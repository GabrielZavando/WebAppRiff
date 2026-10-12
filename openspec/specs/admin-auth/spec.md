# admin-auth Specification

## Purpose
Autenticación del panel con Firebase Authentication (SDK cliente puro, sin @angular/fire): login email/password, sesión reactiva con signals, ID token para el backend, AuthGuard funcional, interceptor HTTP Bearer y manejo de 401. Fuente de verdad del rol: perfil de GET /api/v1/auth/me.
## Requirements
### Requirement: Configuración de Firebase Authentication en el cliente
La aplicación admin SHALL inicializar Firebase en `app.config.ts` (SDK `firebase` puro: `initializeApp` + `getAuth`; ver design D2) usando la configuración del entorno (`apiKey`, `authDomain`, `projectId`, `appId` y claves afines) y la URL base del backend (`API_BASE_URL`). Los valores reales SHALL inyectarse en build (variables de entorno / fileReplacements en `src/environments/`) y NO SHALL quedar credenciales reales committeadas en el repositorio. El `package.json` SHALL declarar `firebase` y SHALL NOT declarar `@angular/fire` (incompatible con Angular 22: peer `^20.0.0` en latest, `^21.2.0` en next).

#### Scenario: La app arranca con Auth inicializado
- **WHEN** la aplicación admin se bootstrappea
- **THEN** `FirebaseAuth` está inicializado y disponible vía el `AuthService`
- **AND** el build consumió la config desde `src/environments/` (con fileReplacements/define por configuración)

#### Scenario: El repositorio no contiene credenciales reales ni @angular/fire
- **WHEN** se inspeccionan los archivos committeados de `apps/admin/src/environments/` y el `package.json`
- **THEN** solo existen placeholders o archivos de ejemplo; los valores reales provienen de variables de entorno del build
- **AND** el `package.json` declara `firebase` y no declara `@angular/fire`

### Requirement: Login con Firebase Authentication
El `AuthService` SHALL exponer `login(email, password)` que autentica con `signInWithEmailAndPassword`; al éxito SHALL cargar el perfil del usuario desde `GET /api/v1/auth/me` y redirigir a `/profile` (o al `returnUrl` interceptado). Al fallo de credenciales SHALL exponer un estado de error para que la pantalla muestre un mensaje visible y la sesión quede sin establecer.

#### Scenario: Login exitoso redirige al perfil
- **GIVEN** credenciales válidas de un usuario activo
- **WHEN** el usuario envía el formulario de login
- **THEN** `AuthService.login` autentica con Firebase Auth
- **AND** se consulta `GET /api/v1/auth/me` para cargar perfil y rol
- **AND** el router redirige a `/profile` (o al `returnUrl` si existía)

#### Scenario: Login fallido muestra mensaje de error
- **GIVEN** credenciales inválidas (email o contraseña incorrectos)
- **WHEN** el usuario envía el formulario de login
- **THEN** se muestra un mensaje de error visible en la pantalla de login
- **AND** la sesión no queda establecida y no se produce redirección

### Requirement: Estado de sesión reactivo y persistente
El `AuthService` SHALL exponer el estado de sesión con signals: `currentUser` (perfil con `nombre`, `email`, `rol`), `isAuthenticated` e `isInitializing`, sincronizados desde `onAuthStateChanged`. El estado SHALL restablecerse al recargar la página (persistencia por defecto de Firebase) antes de resolver guards.

#### Scenario: La sesión persiste al recargar
- **GIVEN** un usuario autenticado
- **WHEN** la página se recarga
- **THEN** `AuthService` restaura el usuario desde Firebase Auth
- **AND** el usuario accede a rutas protegidas sin pasar por `/login`

### Requirement: ID token disponible para el backend
El `AuthService` SHALL exponer `getIdToken()` que devuelve el ID token vigente del usuario autenticado (refrescándolo si está próximo a expirar, mediante `getIdToken()` del SDK). Sin usuario autenticado SHALL resolver `null`.

#### Scenario: Token vigente para llamar al backend
- **GIVEN** un usuario autenticado
- **WHEN** el código llama `authService.getIdToken()`
- **THEN** se resuelve con un ID token no expirado (el SDK lo refresca si es necesario)
- **AND** sin sesión resuelve `null`

### Requirement: Interceptor HTTP Bearer
La app SHALL registrar un interceptor funcional que añada el header `Authorization: Bearer <idToken>` a las peticiones HTTP hacia el backend. Con sesión activa el header SHALL estar presente; sin sesión la petición SHALL continuar sin el header (para no romper llamadas públicas).

#### Scenario: Petición con sesión incluye el header
- **GIVEN** un usuario autenticado
- **WHEN** la app emite una petición al backend (ej. `GET /api/v1/auth/me`)
- **THEN** la petición lleva `Authorization: Bearer <idToken>` con el token vigente

#### Scenario: Petición sin sesión no rompe
- **GIVEN** un usuario sin sesión
- **WHEN** la app emite una petición al backend
- **THEN** la petición continúa sin header `Authorization` y no lanza error en el interceptor

### Requirement: AuthGuard funcional
La app SHALL registrar un `AuthGuard` funcional que proteja las rutas configuradas (`/profile` en Foundation): sin sesión autenticada SHALL redirigir a `/login` preservando la URL destino en `returnUrl`; con sesión SHALL permitir el acceso.

#### Scenario: Ruta protegida sin sesión redirige a login
- **WHEN** un usuario sin sesión navega a `/profile`
- **THEN** el guard redirige a `/login`
- **AND** la URL `/profile` queda preservada como `returnUrl`

#### Scenario: Ruta protegida con sesión permite acceso
- **GIVEN** un usuario autenticado
- **WHEN** navega a `/profile`
- **THEN** el guard permite la activación de la ruta

### Requirement: Logout
El `AuthService` SHALL exponer `logout()` que cierra sesión en Firebase (`signOut`), limpia el estado local (usuario, rol, errores) y redirige a `/login`. La acción de logout SHALL estar disponible desde el header del shell.

#### Scenario: Logout cierra sesión y vuelve a login
- **GIVEN** un usuario autenticado
- **WHEN** activa la acción de logout del header
- **THEN** la sesión de Firebase se cierra y el estado local se limpia
- **AND** el router redirige a `/login`

### Requirement: Manejo de 401 del backend
Cuando el backend responde `401` a una petición autenticada, la app SHALL tratar la sesión como inválida: limpiar el estado local y redirigir a `/login`.

#### Scenario: Respuesta 401 cierra la sesión
- **GIVEN** un usuario autenticado cuyo token fue revocado/expirado
- **WHEN** el backend responde `401`
- **THEN** la app limpia el estado de sesión y redirige a `/login`

