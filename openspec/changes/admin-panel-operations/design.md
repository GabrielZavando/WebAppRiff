# Design: admin-panel-operations

## Context

El backend ya expone el CRUD de usuarios completo (`apps/backend/src/usuarios/infrastructure/usuario.controller.ts`: `GET /users`, `POST /users`, `GET /users/:id`, `PUT/PATCH /users/:id`, con `FirebaseAuthGuard` + `RolesGuard` + `@Roles('superadmin','admin')` a nivel de clase) y las reglas de negocio están implementadas en `usuario.service.ts` (`assertCanCreate:62-66`, `assertUpdateAllowed:79-81`, `assertNotOrphaningSuperadmin:88-106`). El frontend admin no tiene ningún feature de users (`features/` solo contiene `auth`, `catalog`, `profile`, `shell`).

Tres insumos de la reconnaissance (2026-10-16) condicionan el diseño:

1. **Discrepancia de claim (bloqueante):** el spec `backend-usuarios` exige el custom claim con clave `role` (líneas 7, 23, 38, 43), pero `usuario.repository.ts:38` y `:97` escriben `{ rol }`, mientras `RolesGuard` lee `user.role` (`roles.guard.ts:32-36`). Todo usuario creado vía API con el código actual recibiría 403 en todas las rutas con `@Roles(...)`. Los tests del repository (`usuario.repository.spec.ts:67,213`) fijan hoy el comportamiento divergente.
2. **Invitación por email:** el Admin SDK (`firebase-admin` 12.7.0, `base-auth.d.ts:432`) expone `generatePasswordResetLink` que **genera** el link pero **no envía email** (docs `firebase.google.com/docs/auth/admin/email-action-links`: el envío queda a cargo de un canal propio). El email built-in de Google lo disparan los **Client SDKs**; el panel ya corre Firebase JS SDK 13.0.0 con `sendPasswordResetEmail` (`@firebase/auth/dist/auth-public.d.ts:3136`) y token `FIREBASE_AUTH` listo (`features/auth/firebase.tokens.ts:20-24`).
3. **Estado del usuario:** `UserMetadata.lastSignInTime` es `null` hasta el primer sign-in (`user-record.js:35-43,266` — `parseDate` devuelve null si falta `lastLoginAt`), y `GET /users` hoy **solo lee Firestore** (`usuario.repository.ts:58-61`; no hay `listUsers`/`getUser` en el backend). Derivar invitado/activo requiere enriquecer el listado con metadata de Auth.

Constraints del proyecto: Angular 22 standalone con signals y componentes `OnPush`, Tailwind v4 con tokens Riff (flat: sin sombras ni redondeos), Firebase SDK puro en el frontend, envelope estándar `{ data, error, meta }`, TDD con Vitest + jsdom siguiendo el patrón de `features/auth/login/login-page.component.test.ts`.

## Goals / Non-Goals

**Goals:**

- Gestión de usuarios en el panel: listado, alta por invitación, edición y baja lógica (desactivación/reactivación).
- Estado «Invitado»/«Activo» visible en el listado y reenvío de invitación para los aún no activados.
- Matriz de visibilidad por rol del dominio users, aplicada ocultando acciones (no deshabilitándolas).
- Fix de conformidad del claim `role` en el backend (única lógica de backend nueva junto al enriquecimiento del listado).
- Build del admin resiliente a fallos de red transitorios del registry.
- Cierre de la deuda 8.4 de `admin-panel-content`: verificación con editor real contra staging, incluida la invitación end-to-end.

**Non-Goals:**

- Quotes en el panel (fuera del MVP; `GET /quotes` no se consume).
- Eliminación física de usuarios (`DELETE /users/:id` no existe ni se agrega).
- Email branded (plantilla personalizada con dominio propio): change futuro; se usa la plantilla built-in de Firebase.
- Tracking de entrega de emails (no existe API en Firebase Auth): el estado «Invitado» + reenvío son la mitigación.
- Cambios en guards/roles del backend ni endpoints nuevos de API.
- Page de marcas y admin-uploads (imágenes + PDF): changes futuros.

## Decisions

**D1 — Fix del claim como conformidad, sin duplicar spec.** Se cambia `usuario.repository.ts:38` y `:97` a `{ role }` y se actualizan las assertions de `usuario.repository.spec.ts:67,213`. Alternativa (alinear spec+guard a `rol`) rechazada: el spec vigente ya exige `role` y el único usuario existente (superadmin de staging) tiene el claim `role` seteado manualmente y funciona hoy. El fix solo afecta a usuarios creados vía API desde este change; **no hay migración requerida**.

**D2 — Baja lógica con `PATCH activo:false`, sin `DELETE`.** Alineado con el contrato (`api-spec.yml` no define `DELETE /users/{id}`) y con el repositorio existente (5 métodos, ISP: `iusuario.repository.ts:25-31`). El repository ya sincroniza `activo:false` → Firebase Auth `disabled` (`usuario.repository.ts:85-87`), con lo que el usuario desactivado no puede iniciar sesión.

**D3 — Alta por invitación, sin password manual (reemplaza la decisión del 2026-10-15).** El backend crea el usuario en Firebase Auth **sin contraseña** — el repository ya lo soporta (`usuario.repository.ts:29-36`: `createParams.password` solo si viene; `UsuarioCreateDto.password` opcional; `api-spec.yml:537` `required: [nombre, email, rol]`). Tras el `POST /users` exitoso, el **panel** dispara el email de definición de contraseña con `sendPasswordResetEmail(auth, email, actionCodeSettings)` usando el token `FIREBASE_AUTH` existente, con `actionCodeSettings = { url: ${window.location.origin}/login }` para que el usuario vuelva al login del admin. Alternativas descartadas: password manual (decisión del cliente del 2026-10-16), backend genera link + envío con el adaptador `ResendEmailNotifier` existente (contradice «NO Resend por ahora»; queda para el change de email branded), y REST `accounts:sendOobCode` server-side con la web API key (uso no documentado de una API de cliente). Fundamento: el email built-in lo envía Google solo cuando un Client SDK dispara el flujo; el Admin SDK no tiene método de envío.

**D4 — `PATCH` (no `PUT`) para edición.** Actualización parcial, coherente con el patrón de los servicios de catálogo y con el resumen del contrato («Actualización parcial (ej. solo estado activo)»).

**D5 — Reutilización total de la UI existente.** `app-table` (listado), `app-modal` (confirmación de desactivar), `app-alert` (banners), `app-badge` (rol, estado), `app-button`; formulario reactivo con patrón touched+invalid y select cargado de datos (`producto-form-page.component.html:198-231`). No se crean componentes UI nuevos.

**D6 — Guard de ruta por rol.** `usersGuard` (`CanActivateFn`) que redirige a `POST_LOGIN_REDIRECT` (`/products`, fuente única en `app-navigation.ts`) cuando `!roleService.hasRole('admin')`; se aplica a las tres rutas (`/users`, `/users/new`, `/users/:id`) además del `authGuard` heredado del shell. El ítem del sidebar se oculta para editor con el mismo criterio (ocultar, no deshabilitar; patrón de la tarea 7.1 del change archivado).

**D7 — Selección de rol en el formulario y email no editable.**
- Creación: superadmin ve opciones `admin` y `editor`; admin ve única opción `editor`. Nadie crea superadmin (el `UsuarioCreateDto` restringe el enum a `admin|editor`).
- Edición: superadmin ve el select de rol (rol actual precargado); admin no ve el select (rol no editable para él).
- **Email no editable en edición:** el backend persiste el email en Firestore pero no actualiza el email de Firebase Auth (`usuario.repository.ts:69-94` no llama a `updateUser`), por lo que editarlo generaría divergencia entre identidad y documento. Se muestra como texto de solo lectura.

**D8 — Estado «Invitado»/«Activo» derivado de Firebase Auth, enriquecido en `GET /users`.** El repository mergea cada doc de Firestore con la metadata de Auth (`getUser(uid)` por usuario — N pequeño en un panel admin; `listUsers()` por batches queda como optimización futura documentada) y la respuesta incluye `estado: 'invitado' | 'activo'` derivado de `lastSignInTime` (null → invitado). Sin campo nuevo en Firestore y `IUsuarioRepository` se mantiene en 5 métodos (ISP). El superadmin existente ya inició sesión → «Activo» sin migración.

**D9 — Reenvío de invitación solo frontend.** En filas con `estado: 'invitado'` (y con permisos de edición según matriz), la acción «Reenviar invitación» re-dispara `sendPasswordResetEmail` desde el panel. Sin endpoint backend ni contrato nuevo. Con Email Enumeration Protection el método no falla si el email no existe (`auth-public.d.ts:3096-3098`) — aceptable: solo se invita a usuarios creados desde el panel.

**D10 — Resiliencia del `npm ci` en el Dockerfile admin.** En el `RUN` de la línea 51: configuración de retries de npm (`fetch-retries 5`, `fetch-retry-mintimeout 20000`, `fetch-retry-maxtimeout 120000`, `fetch-timeout 600000`) + bucle de reintento del `npm ci` (hasta 5 intentos, `sleep 15` entre intentos). Único punto de red con el registry del archivo; `npm run build` y `write-env.mjs` no se tocan.

**D11 — Manejo de errores en español.** `ApiError` (status/code) → banner con mensaje traducido: 403 → error de permisos; 409 «Cannot leave the system without an active superadmin» → «No se puede dejar el sistema sin un superadmin activo»; fallo del envío de invitación (`sendPasswordResetEmail`) → banner de error pero el usuario queda creado y reinvitable; validaciones de formulario por campo (patrón touched+invalid); fallos genéricos → banner sin detalle técnico.

### Tabla endpoints ↔ requirements

| Endpoint backend | Requirement en la delta |
| --- | --- |
| `GET /api/v1/users` | `admin-users`: Listado de usuarios (incluye estado derivado) / `backend-usuarios`: MODIFIED endpoints (listing enriquecido) |
| `POST /api/v1/users` | `admin-users`: Creación e invitación de usuario / `backend-usuarios`: MODIFIED endpoints + claim-sync (creación sin password) |
| `GET /api/v1/users/{id}` | `admin-users`: Edición de usuario (precarga) |
| `PATCH /api/v1/users/{id}` | `admin-users`: Edición + Desactivación y reactivación (baja lógica) |
| Firebase `sendPasswordResetEmail` (client SDK, sin endpoint propio) | `admin-users`: Invitación y reenvío (disparo desde el panel) |
| — (fix de código, sin endpoint) | `backend-usuarios`: claim `role` — conformidad con el spec vigente |
| — (solo build) | Delta `frontend-dockerfiles` (resiliencia del `npm ci`) |

## Risks / Trade-offs

- [Cuota de emails built-in: 150 resets/día en plan Spark (docs/auth/limits)] → holgada para invitaciones de un equipo admin; documentada como límite operativo.
- [Sin tracking de entrega de emails (no existe API en Firebase Auth)] → estado «Invitado» persistente + acción «Reenviar invitación» como mitigación; verificación con el destinatario por canal externo.
- [TTL exacto del link de reset no concluyente en docs] → el reenvío cubre links expirados.
- [`sendPasswordResetEmail` sobre cuentas creadas sin password] → es el patrón estándar de invitación, pero se valida explícitamente en staging (tarea de verificación) porque no está documentado de forma explícita.
- [Pasos manuales en Firebase Console: dominios del admin en Authorized domains; si falta, `auth/unauthorized-continue-uri`] → checklist previo al deploy en tasks; opcionalmente plantilla de reset en español.
- [Claim `rol` residual en usuarios creados con el código anterior] → tras el deploy se verifica el claim de usuarios existentes en Firebase; hoy solo existe el superadmin con claim `role` manual. Sin migración automatizada.
- [El cambio de rol no afecta la sesión activa del usuario editado] → los custom claims viajan en el token; el usuario debe re-iniciar sesión para obtener el rol nuevo. Se documenta; no se fuerza logout desde el panel.
- [403 visibles si la UI replica mal la matriz del backend] → la UI implementa exactamente las reglas de `usuario.service.ts`; cualquier 403 residual se traduce a banner en español (D11).
- [Admin se bloquea a sí mismo] → el backend lo prohíbe (`assertUpdateAllowed`) y la UI oculta la acción de desactivación sobre filas admin para actores admin (incluida la propia).
- [El `npm ci` puede seguir fallando tras 5 intentos] → el build falla de forma visible en Coolify y se reintentará el deploy; los retries mitigan el ECONNRESET transitorio observado, no un fallo prolongado del registry.

## Migration Plan

1. Firebase Console (manual, previo al deploy): agregar dominios del admin a Authorized domains; opcionalmente traducir la plantilla «Password reset».
2. Deploy del backend (claim `role` + enriquecimiento de `GET /users`): compatible hacia atrás; la respuesta gana el campo derivado `estado`.
3. Deploy del admin (nueva sección `/users` con invitación).
4. Verificación de la deuda 8.4 contra staging con un editor invitado desde el panel: recibir email → definir contraseña → login → estado «Activo», ocultamiento de acciones y 403 al forzar.

Rollback: revert de los commits; no hay migraciones de datos ni de esquema de Firestore (el estado es derivado).

## Open Questions

Ninguna bloqueante: las decisiones de alcance (claim `role`, alta por invitación con disparo frontend, estado derivado de Auth enriquecido en `GET /users`, reenvío frontend-only, solo desactivación, Dockerfile dentro de este change) fueron confirmadas con el cliente el 2026-10-15 y 2026-10-16 durante la reconnaissance.
