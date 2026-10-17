# Proposal: admin-panel-operations

## Why

El panel admin no puede gestionar usuarios: dar de alta un editor exige intervención manual en Firebase Console, y la deuda 8.4 del change archivado `admin-panel-content` (verificación de ocultamiento de acciones y 403 con un editor real) quedó diferida exactamente por eso. Además hay dos problemas previos que este change resuelve porque lo bloquean o lo afectan directamente: (1) el backend escribe el custom claim de rol con clave `rol` cuando el spec `backend-usuarios` exige `role`, por lo que todo usuario creado vía API recibiría 403 en todas las rutas con `@Roles(...)`; (2) el build de la imagen admin falló en Coolify el 2026-10-15 por un `ECONNRESET` transitorio en el `npm ci` de `apps/admin/Dockerfile:51`.

## What Changes

- Nueva sección **Usuarios** en el panel admin (`/users`): listado con tabla, creación, edición y baja lógica (desactivación vía `PATCH activo:false` — sin `DELETE`).
- **Alta por invitación, sin password manual:** el backend crea el usuario en Firebase Auth sin contraseña y el panel dispara el email de definición de contraseña (`sendPasswordResetEmail` del Firebase JS SDK, email built-in de Google) con retorno al login del admin. El usuario define su contraseña desde el email y queda activo.
- **Estado invitado/activo en el listado**, derivado server-side de `metadata.lastSignInTime` de Firebase Auth (`null` → «Invitado») enriqueciendo `GET /users` con metadata de Auth; sin campo nuevo en Firestore.
- **Acción «Reenviar invitación»** en filas con estado «Invitado»: re-dispara el email desde el panel (sin endpoint backend).
- Matriz de visibilidad por rol en el dominio users: editor sin acceso a la sección; admin limitado a crear/editar editors; superadmin con acceso completo (ningún rol puede crear superadmin vía API).
- Fix de conformidad en backend: el custom claim se escribe como `{ role }` en lugar de `{ rol }` en `usuario.repository.ts`, alineando el código con el spec `backend-usuarios` ya vigente.
- Blindaje del `npm ci` del Dockerfile admin: retries de npm + bucle de reintento ante fallos de red transitorios (ECONNRESET de Coolify).
- Cierre de la deuda 8.4: verificación manual contra staging con un editor creado e invitado desde el propio panel (ocultamiento de Crear/Eliminar + 403 al forzar + flujo de invitación end-to-end).

Fuera de alcance (MVP): quotes en el panel, eliminación física de usuarios (`DELETE /users/:id`), email branded (plantilla personalizada con dominio propio — change futuro), tracking de entrega de emails, page de marcas, admin-uploads (imágenes + PDF).

## Capabilities

### New Capabilities

- `admin-users`: gestión de usuarios del panel admin — listado con estado invitado/activo, alta por invitación (sin password manual), reenvío de invitación, edición, activación/desactivación, y matriz de visibilidad por rol (editor < admin < superadmin) aplicada con ocultamiento, no deshabilitado.

### Modified Capabilities

- `backend-usuarios`: la creación de usuarios en el flujo del panel no requiere password (invitación); el listado `GET /users` se enriquece con el estado `invitado|activo` derivado de la metadata de Firebase Auth. Las reglas de roles (quién crea a quién, cambio de rol, desactivación, último superadmin) no cambian.
- `frontend-dockerfiles`: el requirement de la imagen Docker del admin se endurece — la instalación de dependencias (`npm ci`) gana retries de npm y un bucle de reintento ante fallos de red transitorios. Sin cambios en los escenarios existentes (siguen aplicando).

No hay delta a `admin-role-access` (esa spec delega explícitamente los requirements de dominio a los changes posteriores).

## Impact

- **Backend** (`apps/backend/src/usuarios/`): `usuario.repository.ts` — fix del claim (líneas 38 y 97) y enriquecimiento de `findAll` con metadata de Firebase Auth (merge Firestore + `getUser` por uid; `IUsuarioRepository` se mantiene en 5 métodos). Único cambio de backend; sin endpoints nuevos.
- **Contrato API** (`docs/api/api-spec.yml`): el schema `Usuario` de la respuesta de `GET /users` gana el campo derivado `estado` (`invitado|activo`). `UsuarioCreate.password` ya es opcional en el contrato (líneas 535-551) — sin cambios estructurales.
- **Frontend admin** (`apps/admin/`): nuevo feature `features/users/` (modelos, servicio de usuarios, servicio de invitación sobre el token `FIREBASE_AUTH` existente en `firebase.tokens.ts`, páginas de listado y formulario), rutas lazy en `app.routes.ts`, ítem «Usuarios» en el sidebar. Reutiliza `ApiClientService`, `RoleService` y los componentes `ui/table`, `ui/modal`, `ui/alert`, `ui/button`, `ui/badge`, `ui/dropdown`.
- **Infraestructura**: `apps/admin/Dockerfile` (solo la etapa de build).
- **Configuración manual de Firebase Console (previa al deploy):** agregar los dominios del admin (staging y producción) a Authentication → Authorized domains (requerido por `actionCodeSettings.url`); opcionalmente traducir la plantilla «Password reset» al español en Templates.
- Sin migraciones de datos; el único usuario existente (superadmin de staging) tiene su claim `role` seteado manualmente y ya inició sesión (estado «Activo»).
