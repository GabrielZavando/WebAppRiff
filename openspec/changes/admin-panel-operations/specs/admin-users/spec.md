# Delta admin-users

## Purpose
Gestión de usuarios del panel admin: listado con estado invitado/activo, alta por invitación (sin password manual — el usuario define su contraseña desde el email de Firebase), reenvío de invitación, edición y baja lógica (desactivación/reactivación; no existe `DELETE /users/:id`). La matriz de visibilidad por rol del dominio users se aplica ocultando —no deshabilitando— las acciones no permitidas, replicando en la UI las reglas que el backend ya implementa (`usuario.service.ts`) para evitar 403 visibles. Los mensajes de error se muestran en español mediante banners inline (sin toasts).

## ADDED Requirements

### Requirement: Listado de usuarios con estado invitado/activo
La página `/users` SHALL renderizar una tabla (`app-table`) con, al menos, las columnas: nombre, email, rol (badge), estado («Invitado»/«Activo», badge) y acciones por fila. El listado SHALL consumir `GET /api/v1/users` con el token Bearer del interceptor existente; el backend devuelve el listado completo con el campo derivado `estado` (`invitado` cuando el usuario nunca ha iniciado sesión, `activo` en caso contrario). La tabla SHALL mostrar estado vacío cuando no hay usuarios y un banner de error visible cuando la petición falla.

#### Scenario: La tabla muestra los usuarios con rol y estado
- **GIVEN** existen usuarios con distintos roles, al menos uno sin primer login y otro con login previo
- **WHEN** el actor con rol `admin` o `superadmin` abre `/users`
- **THEN** la tabla renderiza una fila por usuario con nombre, email, rol y estado correctos («Invitado» para el que nunca inició sesión, «Activo» para el resto)

#### Scenario: Estado vacío
- **WHEN** `GET /users` responde con una lista vacía
- **THEN** la tabla muestra el estado vacío («Sin resultados» o mensaje equivalente)

#### Scenario: Fallo del backend muestra error visible
- **WHEN** `GET /users` responde con error de red o 5xx
- **THEN** la página muestra un banner de error en español en lugar de una tabla vacía silenciosa

### Requirement: Creación e invitación de usuario
El listado SHALL ofrecer la acción «Añadir usuario» que navega a `/users/new`. El formulario SHALL incluir: nombre (obligatorio), email (obligatorio, formato email) y rol (select según actor: `superadmin` ve opciones `admin` y `editor`; `admin` ve únicamente `editor`) — **sin campo de password**. El envío SHALL hacer `POST /api/v1/users` (el backend crea el usuario en Firebase Auth sin contraseña) y, si el POST es exitoso, el panel SHALL disparar el email de definición de contraseña con `sendPasswordResetEmail` (Firebase JS SDK sobre el token `FIREBASE_AUTH` existente) y `actionCodeSettings = { url: <origen del admin>/login }` para que el usuario defina su contraseña y vuelva al login. Tras la invitación el panel SHALL volver a `/users` con banner de éxito («Invitación enviada»). El botón de guardar SHALL estar deshabilitado con el formulario inválido. Un fallo del POST SHALL mostrarse como banner de error en español (sin detalle técnico); un fallo del envío del email SHALL mostrarse como banner de error pero el usuario queda creado en estado «Invitado» y reinvitable. Un fallo de validación de campo SHALL marcarse en el campo correspondiente (patrón touched+invalid).

#### Scenario: Superadmin crea e invita un admin
- **GIVEN** el actor autenticado es `superadmin`
- **WHEN** crea un usuario con rol `admin`, nombre y email válidos
- **THEN** se emite `POST /users` con `{ nombre, email, rol: 'admin' }` (sin `password`)
- **AND** el panel dispara el email de definición de contraseña al email indicado
- **AND** el listado se muestra con banner de éxito y el nuevo usuario en estado «Invitado»

#### Scenario: Admin solo puede crear editors
- **GIVEN** el actor autenticado es `admin`
- **WHEN** abre `/users/new`
- **THEN** el select de rol ofrece únicamente la opción `editor`

#### Scenario: Nadie crea un superadmin
- **WHEN** cualquier actor abre `/users/new`
- **THEN** el select de rol NO ofrece la opción `superadmin`

#### Scenario: El formulario no incluye password
- **WHEN** se renderiza `/users/new`
- **THEN** el formulario contiene nombre, email y rol, y NO contiene ningún campo de contraseña

#### Scenario: Fallo del envío del email tras crear el usuario
- **GIVEN** el `POST /users` respondió 201
- **WHEN** el disparo del email de invitación falla (error de red o del SDK de Firebase)
- **THEN** se muestra un banner de error en español en el listado
- **AND** el usuario figura creado con estado «Invitado» y puede recibir un reenvío

#### Scenario: Fallo del backend en la creación
- **WHEN** `POST /users` responde con error (400 o 403)
- **THEN** se muestra un banner de error en español y el usuario permanece en el formulario

### Requirement: Reenvío de invitación
En filas con estado «Invitado», el listado SHALL ofrecer la acción «Reenviar invitación» (visible solo para actores con permisos de edición sobre esa fila según la matriz de visibilidad). La acción SHALL re-disparar `sendPasswordResetEmail` para el email del usuario con el mismo `actionCodeSettings` y SHALL mostrar banner de éxito («Invitación reenviada») o de error en español. La acción NO SHALL requerir llamadas al backend aparte de las del SDK de Firebase (sin endpoint propio de reenvío).

#### Scenario: Reenviar invitación a un usuario invitado
- **GIVEN** un usuario en estado «Invitado» y un actor con permisos de edición sobre él
- **WHEN** el actor activa «Reenviar invitación»
- **THEN** se dispara nuevamente el email de definición de contraseña a su email
- **AND** se muestra el banner «Invitación reenviada» sin recargar la página

#### Scenario: No hay reenvío para usuarios activos
- **GIVEN** un usuario en estado «Activo»
- **WHEN** se observan sus acciones en el listado
- **THEN** la acción «Reenviar invitación» NO está visible

### Requirement: Edición de usuario
La ruta `/users/:id` SHALL precargar el usuario con `GET /api/v1/users/{id}`. El formulario de edición SHALL permitir editar el nombre y, según actor, el rol: `superadmin` ve el select de rol precargado (opciones `admin` y `editor`); `admin` NO ve el select de rol. El email SHALL mostrarse como texto de solo lectura (el backend no sincroniza el email de Firebase Auth). El envío SHALL hacer `PATCH /api/v1/users/{id}` y el éxito SHALL volver a `/users` con banner de éxito. Un 409 del backend («Cannot leave the system without an active superadmin») SHALL mostrarse como banner «No se puede dejar el sistema sin un superadmin activo»; un 403 SHALL mostrarse como banner de error de permisos.

#### Scenario: Precarga y guardado del nombre
- **GIVEN** un usuario existente
- **WHEN** el actor con permisos abre `/users/:id` y guarda un nombre modificado
- **THEN** se emite `PATCH /users/{id}` con `{ nombre }` y el listado se muestra con banner de éxito

#### Scenario: Superadmin cambia el rol de un editor a admin
- **GIVEN** el actor autenticado es `superadmin`
- **WHEN** edita un usuario con rol `editor` y selecciona `admin`
- **THEN** se emite `PATCH /users/{id}` con `{ rol: 'admin' }`

#### Scenario: Admin no puede cambiar roles
- **GIVEN** el actor autenticado es `admin`
- **WHEN** abre la edición de un usuario con rol `editor`
- **THEN** el formulario no muestra el select de rol

#### Scenario: Intento de degradar al último superadmin
- **GIVEN** un único `superadmin` activo en el sistema
- **WHEN** se intenta cambiar su rol o desactivarlo
- **THEN** el backend responde 409
- **AND** se muestra el banner «No se puede dejar el sistema sin un superadmin activo»

### Requirement: Desactivación y reactivación (baja lógica)
El listado SHALL ofrecer por fila las acciones «Desactivar» y «Activar» según el estado actual del usuario y la matriz de visibilidad. La desactivación SHALL pedir confirmación con `app-modal` y luego emitir `PATCH /api/v1/users/{id}` con `{ activo: false }`; la reactivación SHALL emitir el mismo endpoint con `{ activo: true }` (con o sin modal, de forma consistente). Tras la operación el listado SHALL refrescarse y mostrar un banner de éxito. Un usuario desactivado no puede iniciar sesión (el backend lo deshabilita en Firebase Auth). Un 403 o 409 del backend SHALL mostrarse como banner de error en español.

#### Scenario: Desactivar un editor con confirmación
- **GIVEN** un usuario con rol `editor` activo y un actor `admin`
- **WHEN** el actor confirma la desactivación en el modal
- **THEN** se emite `PATCH /users/{id}` con `{ activo: false }`
- **AND** la fila pasa a inactivo y se muestra banner de éxito

#### Scenario: Reactivar un usuario desactivado
- **GIVEN** un usuario inactivo
- **WHEN** un actor con permisos activa la reactivación
- **THEN** se emite `PATCH /users/{id}` con `{ activo: true }` y la fila pasa a activo

#### Scenario: Admin no puede desactivar a un admin
- **GIVEN** el actor autenticado es `admin`
- **WHEN** observa las filas de usuarios con rol `admin` o `superadmin`
- **THEN** las acciones de edición, reenvío y desactivación NO están visibles (ocultas, no deshabilitadas)

#### Scenario: Desactivar al último superadmin activo
- **GIVEN** un único `superadmin` activo
- **WHEN** se confirma su desactivación
- **THEN** el backend responde 409
- **AND** se muestra el banner «No se puede dejar el sistema sin un superadmin activo» y la fila permanece activa

### Requirement: Visibilidad por rol en el dominio users
El acceso a la sección de usuarios SHALL seguir la jerarquía `editor < admin < superadmin` aplicada con ocultamiento (no deshabilitado):
- Un actor `editor` SHALL NOT ver el ítem «Usuarios» en el sidebar y SHALL ser redirigido al destino post-login si accede por URL a `/users`, `/users/new` o `/users/:id`.
- Un actor `admin` SHALL ver la sección, SHALL poder crear (solo `editor`) e invitar, y SHALL poder editar, reinvitar y desactivar únicamente usuarios con rol `editor`; sobre filas `admin`/`superadmin` las acciones de edición, reenvío y desactivación SHALL estar ocultas.
- Un actor `superadmin` SHALL tener acceso completo: crear e invitar, editar y desactivar `admin` y `editor` (nunca crear `superadmin`).

#### Scenario: Editor no ve la sección
- **GIVEN** un actor autenticado con rol `editor`
- **WHEN** carga el panel
- **THEN** el sidebar no muestra el ítem «Usuarios»

#### Scenario: Editor accede por URL y es redirigido
- **GIVEN** un actor autenticado con rol `editor`
- **WHEN** navega directamente a `/users`
- **THEN** es redirigido al destino post-login (`/products`) sin renderizar la página de usuarios

#### Scenario: Admin ve la sección con acciones limitadas
- **GIVEN** un actor autenticado con rol `admin`
- **WHEN** abre `/users`
- **THEN** ve el listado completo y el botón «Añadir usuario»
- **AND** las acciones de editar/reinvitar/desactivar solo están visibles en filas con rol `editor`

#### Scenario: Superadmin tiene acceso completo
- **GIVEN** un actor autenticado con rol `superadmin`
- **WHEN** abre `/users`
- **THEN** ve las acciones de crear, editar, reinvitar (según estado) y desactivar/reactivar en las filas `admin` y `editor`

### Requirement: Navegación y rutas del módulo users
El sidebar SHALL incluir el ítem «Usuarios» entre «Categorías» y «Perfil», con icono SVG inline coherente con el patrón existente (`USER_ICON` + `SafeHtmlPipe`) e indicación de ítem activo. Las rutas `/users`, `/users/new` y `/users/:id` SHALL registrarse lazy bajo el shell en `app.routes.ts`, literales antes que `:id`, con `authGuard` heredado del padre y el guard de rol del módulo aplicado a las tres.

#### Scenario: Ítem del sidebar en posición correcta
- **WHEN** un actor `admin` carga el panel
- **THEN** el sidebar muestra, en este orden: Productos, Categorías, Usuarios, Perfil
- **AND** al estar en `/users` el ítem «Usuarios» aparece como activo

#### Scenario: Rutas lazy registradas
- **WHEN** el router resuelve `/users/new`
- **THEN** el componente del formulario se carga lazy bajo el shell
- **AND** `/users/new` se resuelve antes que `/users/:id` (literales antes que parámetros)
