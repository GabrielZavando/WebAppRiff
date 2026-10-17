# Tasks: admin-panel-operations

> TDD en todo el change: cada tarea de código va precedida de su test fallido
> (Vitest + jsdom en admin, Jest en backend, patrón de
> `features/auth/login/login-page.component.test.ts` y
> `usuario.repository.spec.ts`). Referencias: design.md (D1–D11) y specs/
> (admin-users, backend-usuarios, frontend-dockerfiles).

## 1. Backend — fix de conformidad del claim (D1)

- [x] 1.1 Test fallido + implementación en `usuario.repository.ts:38`: `create` escribe el custom claim como `{ role: input.rol }` (hoy `{ rol }`); actualizar la assertion de `usuario.repository.spec.ts:67`.
- [x] 1.2 Test fallido + implementación en `usuario.repository.ts:97`: `setRoleClaim` escribe `{ role }` (hoy `{ rol }`); actualizar la assertion de `usuario.repository.spec.ts:213`.
- [x] 1.3 Test fallido + implementación: `create` sin `input.password` crea el usuario de Firebase Auth sin contraseña (flujo de invitación; `usuario.repository.ts:29-36` ya lo soporta — cubrir con test explícito).

## 2. Backend — estado invitado/activo en `GET /users` (D8)

- [x] 2.1 Test fallido + implementación en `usuario.repository.ts` (`findAll`): merge de cada doc de Firestore con la metadata de Firebase Auth (`getUser(uid)`) y campo derivado `estado: 'invitado' | 'activo'` (`lastSignInTime` null → invitado); sin persistir nada en Firestore y sin nuevos métodos en `IUsuarioRepository`.
- [x] 2.2 Test fallido + passthrough del `estado` en `UsuarioService.findAll` y `UsuarioController` (respuesta enriquecida, mismas reglas de acceso).
- [x] 2.3 Actualizar `docs/api/api-spec.yml`: schema `Usuario` de la respuesta de `GET /users` gana `estado` (enum `invitado|activo`, derivado de `lastSignInTime`); `password` de `UsuarioCreate` documentado como omitible en el flujo de invitación.
- [x] 2.4 `npm run lint && npm run typecheck && npm run test` en `apps/backend` en verde (junto con 1.x; sin cambios fuera de `usuarios/`).

## 3. Dockerfile admin — resiliencia del `npm ci` (D10)

- [x] 3.1 Modificar `apps/admin/Dockerfile:51`: configurar retries de npm (`fetch-retries 5`, `fetch-retry-mintimeout 20000`, `fetch-retry-maxtimeout 120000`, `fetch-timeout 600000`) y envolver el `npm ci --workspace=@riff/admin --include-workspace-root=false --ignore-scripts` en un bucle de reintento (5 intentos, `sleep 15` entre intentos). Sin tocar los demás `RUN`.

## 4. Frontend — modelos, servicio de usuarios y servicio de invitación

- [x] 4.1 Test fallido + `features/users/models.ts`: tipos espejo del backend — `Usuario` (id, nombre, email, rol, activo, estado: 'invitado'|'activo', creadoPor, creadoEn, actualizadoEn), `UsuarioCreatePayload` (nombre, email, rol: 'admin'|'editor' — sin password) y `UsuarioUpdatePayload` (nombre?, email?, rol?, activo?); reutilizar `UsuarioRol` de `features/auth/auth.models.ts`.
- [x] 4.2 Test fallido + `features/users/users.service.ts`: `findAll()`, `findById(id)`, `create`, `update` (PATCH) sobre `ApiClientService` siguiendo el patrón de `profile.service.ts` / `categoria.service.ts`; assertions de método y URL (`users`, `users/:id`).
- [x] 4.3 Test fallido + `features/users/users-invitation.service.ts`: `sendInvitation(email)` que llama a `sendPasswordResetEmail` del SDK con el token `FIREBASE_AUTH` existente (`firebase.tokens.ts:20-24`) y `actionCodeSettings = { url: ${window.location.origin}/login }`; assertions de llamada, settings y manejo de `ApiError`/`FirebaseError` (D3, D9).

## 5. Frontend — guard de ruta, rutas y sidebar (D6)

- [x] 5.1 Test fallido + `features/users/users.guard.ts` (`usersGuard`): redirige a `POST_LOGIN_REDIRECT` cuando `!roleService.hasRole('admin')` (cumplen `admin` y `superadmin`).
- [x] 5.2 Test fallido + registro lazy en `app.routes.ts`: `/users`, `/users/new`, `/users/:id` bajo el shell, literales antes que `:id`, con `authGuard` heredado del padre y `usersGuard` en las tres rutas.
- [x] 5.3 Test fallido + ítem «Usuarios» en `navItems` entre «Categorías» y «Perfil» con icono SVG inline (patrón `USER_ICON` + `SafeHtmlPipe`), visible solo cuando `hasRole('admin')`; test de orden, de ítem activo y de ocultamiento para editor.

## 6. Frontend — listado de usuarios con estado

- [x] 6.1 Test fallido + página `/users` con `app-table`: columnas nombre, email, rol (`app-badge`), estado («Invitado»/«Activo», `app-badge`), acciones; estado vacío; banner de error ante fallo de carga (spec: Listado de usuarios con estado invitado/activo).
- [x] 6.2 Test fallido + acciones del listado: «Añadir usuario» → `/users/new`, «Editar» → `/users/:id`, «Desactivar»/«Activar» según estado, «Reenviar invitación» solo en filas «Invitado» — acciones ocultas (no deshabilitadas) según la matriz: admin no las ve en filas `admin`/`superadmin`; superadmin las ve en `admin` y `editor` (specs: Visibilidad por rol; Reenvío de invitación).

## 7. Frontend — creación e invitación

- [x] 7.1 Test fallido + formulario `/users/new`: nombre obligatorio, email obligatorio con formato, select de rol según actor (superadmin: `admin`|`editor`; admin: solo `editor`; nunca `superadmin`) — **sin campo de password**; botón de guardar deshabilitado con form inválido (spec: Creación e invitación de usuario).
- [x] 7.2 Test fallido + envío `POST /users` → si responde 201, disparar `sendInvitation(email)` → volver a `/users` con banner «Invitación enviada»; fallo del POST → banner de error y permanencia en el formulario; fallo del email tras 201 → banner de error y usuario «Invitado» reinvitable (D3, D11).

## 8. Frontend — edición

- [x] 8.1 Test fallido + formulario `/users/:id`: precarga con `GET /users/{id}`; nombre editable; email de solo lectura (D7); select de rol precargado solo para superadmin; admin sin select de rol (spec: Edición de usuario).
- [x] 8.2 Test fallido + envío `PATCH /users/{id}` → volver a `/users` con banner de éxito; 409 → banner «No se puede dejar el sistema sin un superadmin activo»; 403 → banner de error de permisos (D11).

## 9. Frontend — desactivación y reactivación (baja lógica)

- [x] 9.1 Test fallido + desactivar con confirmación (`app-modal`) → `PATCH /users/{id}` con `{ activo: false }`; reactivar → `{ activo: true }`; refresco del listado y banner de éxito en ambos casos (spec: Desactivación y reactivación).
- [x] 9.2 Test fallido + manejo de errores de la baja lógica: 403 (admin→admin) y 409 (último superadmin) → banner de error en español; la fila permanece en su estado actual.

## 10. Verificación final

- [x] 10.1 Cobertura de specs: recorrer `specs/admin-users/spec.md`, `specs/backend-usuarios/spec.md` y `specs/frontend-dockerfiles/spec.md` escenario por escenario y confirmar test o verificación manual que lo ejercite.
- [x] 10.2 `npm run lint && npm run typecheck && npm run test` en `apps/admin` en verde (junto con 2.4 cierra ambos workspaces).
- [x] 10.3 `make ci` en verde (gate completo: openspec-validate + lint + typecheck + test + audit).
- [x] 10.4 Build local de la imagen admin (`docker build -f apps/admin/Dockerfile .`) verificando que el bucle de reintento queda en el `RUN` del `npm ci` y que el build completa (spec frontend-dockerfiles: Local build succeeds from the monorepo root).
- [x] 10.5 Checklist manual de Firebase Console antes del deploy: dominios del admin (staging y producción) en Authentication → Authorized domains; opcionalmente plantilla «Password reset» en español (Authentication → Templates); proveedor Email/Password habilitado.
- [ ] 10.6 Cierre de la deuda 8.4 (`admin-panel-content`) + flujo de invitación end-to-end en staging: crear un editor desde `/users` (invitación enviada), verificar recepción del email y definición de contraseña, login del editor, estado «Activo» en el listado; ocultamiento de «Crear»/«Eliminar» en los tres listados de catálogo, «Editar» visible, 403 del backend al forzar; sin peticiones a endpoints inexistentes en la pestaña Network. Registrar el resultado como nota en la tarea 8.4 del change archivado.
