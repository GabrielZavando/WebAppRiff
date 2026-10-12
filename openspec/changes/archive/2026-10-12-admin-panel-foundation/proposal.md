## Why

`apps/admin` es hoy un proyecto Angular 22 casi vacío: solo existe la pantalla
de login (UI-only, sin autenticación real). El panel de administración se
construye en 3 changes secuenciales — este es el primero (foundation): pone en
pie el esqueleto operativo del panel (login real + shell + base de acceso por
rol) sobre el que los changes posteriores montarán dashboard, CRUD y gestión
(cotizaciones y usuarios).

## What Changes

- **Login real**: el submit de la pantalla de login existente se conecta a
  Firebase Authentication (email/password, cliente JS) — hoy es un no-op.
- **Sesión y transporte**: `AuthService` con signals (login/logout/usuario/
  ID token, restauración al recargar), `AuthGuard` funcional e interceptor
  HTTP que adjunta `Authorization: Bearer <idToken>` al backend y trata el 401
  como sesión inválida.
- **Shell de aplicación** basado en TailAdmin Angular (free): sidebar
  colapsable + header (usuario actual + logout) + contenido, copiando y
  adaptando SOLO los componentes de layout/UI necesarios a los design tokens
  Riff (flat design). Página 404 incluida.
- **`RoleService` / `hasRole()`**: base del control de acceso por rol en la UI
  (el consumo en acciones CRUD y guards de ruta por rol llega con los changes
  de contenido/operaciones).
- **Perfil** de solo lectura vía `GET /api/v1/auth/me` (única página protegida
  de esta entrega; el redirect raíz apunta a `/profile` hasta que el change de
  contenido introduzca `/dashboard`).
- **Routing base**: `/login` público, rutas protegidas bajo el shell,
  wildcard → 404, páginas lazy.
- **Configuración Firebase cliente** vía variables de entorno de build (sin
  credenciales committeadas).
- **Dependencia**: `@angular/fire` se descarta por incompatibilidad verificada
  con Angular 22 (peer `^20.0.0`); se usa el SDK `firebase` puro (v13).

Fuera de alcance (explícito): dashboard, CRUD de entidades y endpoint de
uploads (change `admin-panel-content`); cotizaciones y usuarios (change
`admin-panel-operations`); contacts (el backend no expone `GET /contacts`);
realtime/websockets; i18n (solo español); tests E2E del panel; branding
exhaustivo.

**Deuda conocida documentada** (sin cambios de backend en estos 3 changes):
el backend solo permite listar/ver cotizaciones a `admin`/`superadmin`
(`GET /quotes` con `@Roles('superadmin','admin')`) aunque un `editor` puede
cambiar su estado vía PATCH. El fix para que un editor pueda listar/ver
cotizaciones se hará en un change separado posterior; no se toca aquí.

## Capabilities

### New Capabilities

- `admin-app-shell`: layout del panel basado en TailAdmin (sidebar colapsable
  + header + main content), estructura de rutas base, redirect raíz a
  `/profile` y página 404.
- `admin-auth`: autenticación Firebase en el cliente con SDK puro
  (login/logout, estado de sesión con signals, ID token), `AuthGuard`
  funcional, interceptor HTTP Bearer y manejo de 401.
- `admin-role-access`: `RoleService` con `hasRole(...)` leído del perfil
  (`GET /api/v1/auth/me`), base para ocultar acciones en changes posteriores.
- `admin-profile`: página de perfil de solo lectura con datos de
  `GET /api/v1/auth/me`.

### Modified Capabilities

- `admin-login`: el submit deja de ser un no-op — ahora invoca a Firebase Auth
  (éxito → redirect a `/profile` o `returnUrl`; fallo → mensaje de error
  visible) y el redirect raíz pasa de `/login` a `/profile` (que a su vez
  protege y redirige a `/login` si no hay sesión).

## Impact

- **`apps/admin`** (único afectado): features nuevas (`auth`, `shell`,
  `profile`), `app.routes.ts` reescrito, `app.config.ts` con inicialización de
  Firebase, interceptor y guard funcionales. Dependencias: se añade `firebase`
  (SDK puro v13) y se elimina `@angular/fire` (incompatible, nunca instalado).
- **TailAdmin**: se clona en un directorio temporal fuera del repo y se copian
  solo los archivos de layout/UI listados en design.md; no se copian su
  `package.json`, `angular.json`, `styles.css`, dashboards ni páginas no usadas.
- **`apps/backend`**: sin cambios.
- **API**: la UI consume `GET /api/v1/auth/me` (existente); el resto de
  endpoints se usará en los changes posteriores.
- **Pipeline**: nuevas variables de entorno de build para el cliente Firebase
  (`FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`,
  `FIREBASE_APP_ID`, `API_BASE_URL`).
