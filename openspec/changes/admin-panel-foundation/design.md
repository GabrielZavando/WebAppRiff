## Contexto

- `apps/admin` es Angular 22 (standalone, signals, control flow `@if`/`@for`),
  Tailwind CSS v4 con design tokens Riff en `@theme` (globals.css, flat design:
  sin `rounded*` ni sombras), Vitest + jsdom para tests y ESLint. Solo existe
  la pantalla de login (`features/auth/login`) con submit no-op y las rutas
  `'' → /login` (spec `admin-login`).
- El backend NestJS ya expone `/api/v1/auth/me` (`FirebaseAuthGuard`, envelope
  `{ data, error, meta }`) y el resto de endpoints de catálogo/cotizaciones/
  usuarios con `RolesGuard`; no se toca el backend en esta entrega.
- El panel se entrega en 3 changes: **foundation** (este), **content**
  (dashboard + CRUD catálogo + uploads) y **operations** (quotes + users).
- TailAdmin Angular free (https://github.com/TailAdmin/free-angular-tailwind-
  dashboard) es un template open-source que se clona (no es dependencia npm):
  Angular 22+, Tailwind v4, estructura `src/app/shared/{layout,components,
  services}` + `src/app/pages/`. Verificado su árbol: layout en
  `shared/layout/{app-layout,app-sidebar,app-header,backdrop,auth-page-layout}`,
  UI en `shared/components/ui/{table,badge,dropdown,modal,alert,button,avatar}`,
  servicios `sidebar.service.ts`/`theme.service.ts`, página 404 en
  `pages/other-page/not-found` y auth en `pages/auth-pages/sign-in` +
  `shared/components/auth/signin-form`.

## Objetivos / No-Objetivos

**Objetivos:**

- Login real con Firebase Auth y sesión persistente (signals), con guard e
  interceptor Bearer listos para los cambios posteriores.
- Shell navegable basado en TailAdmin adaptado a los design tokens Riff.
- `RoleService`/`hasRole()` y página `/profile` de solo lectura.
- Tests unitarios en verde (Vitest), lint/typecheck/build en verde.

**No-Objetivos:**

- Dashboard, CRUD de catálogo y endpoint de uploads (`admin-panel-content`).
- Cotizaciones y usuarios (`admin-panel-operations`).
- Contacts, realtime, i18n, tests E2E, branding exhaustivo, recuperación de
  contraseña, cambios de backend (incluida la deuda de acceso de lectura de
  cotizaciones para `editor`, documentada en el proposal).

## Decisiones

### D1 — TailAdmin: integración por copia y adaptación (Opción A1)

Se clona el template en un directorio temporal fuera del repo y se copian
SOLO los archivos necesarios, adaptándolos al proyecto existente:

| Origen (TailAdmin) | Destino (`apps/admin/src/app/`) |
| --- | --- |
| `shared/layout/app-layout/` | `shared/layout/app-layout/` (shell padre con `router-outlet` anidado) |
| `shared/layout/app-sidebar/` (+ widget) | `shared/layout/app-sidebar/` |
| `shared/layout/app-header/` | `shared/layout/app-header/` (usuario + logout) |
| `shared/layout/backdrop/` | `shared/layout/backdrop/` (sidebar móvil) |
| `shared/services/sidebar.service.ts` | `shared/services/sidebar.service.ts` (colapso persistente) |
| `shared/components/ui/button/` | `shared/components/ui/button/` |
| `shared/components/ui/dropdown/` (+item) | `shared/components/ui/dropdown/` (menú de usuario del header) |
| `shared/components/ui/avatar/` | `shared/components/ui/avatar/` |
| `shared/components/ui/badge/` | `shared/components/ui/badge/` |
| `shared/components/common/page-breadcrumb/` | `shared/components/common/page-breadcrumb/` |
| `pages/other-page/not-found/` | `features/shell/pages/not-found/` |
| `pages/auth-pages/sign-in/` + `shared/components/auth/signin-form/` | referencia para conectar `features/auth/login` existente (NO se copia: ya existe la página con tests y spec) |

> Los componentes UI que Foundation no usa aún (`ui/alert`, `ui/modal`,
> `ui/table` y derivados) **no se copian**: se extraerán de TailAdmin en los
> changes que los necesiten (`admin-panel-content` para tablas/modales de CRUD,
> `admin-panel-operations`) para evitar código muerto en el repo.

- **NO se copia**: `package.json`, `angular.json`, `src/styles.css`,
  `public/images/**` (se usa el logo Riff existente), dashboards
  (`pages/dashboard/**`, charts con ApexCharts), ecommerce, invoice,
  transactions, forms, calendar, ui-elements, generator-layout, páginas AI y
  los theme toggles (el panel queda light-only en el MVP).
- **Adaptación**: las clases de paleta TailAdmin (`brand-*`, `gray-*`) se
  reescriben a utilities de `@theme` Riff; se eliminan `rounded*` y `shadow*`
  (flat design); tipografía ya resuelta por `globals.css` (Montserrat/Open
  Sans). No se importa ningún CSS del template: los componentes copiados son
  templates TS/HTML + clases.
- *Alternativa descartada (A2, reconstruir)*: no existe impedimento técnico
  verificable — los tests de `apps/admin` que tocan estilos solo inspeccionan
  `globals.css`/`angular.json`/`package.json`/`main.ts` (ver Riesgos), no los
  componentes; A1 ahorra la mayor parte del trabajo de layout.
- Licencia MIT (`LICENSE.md` del template); se conserva el aviso en el header
  del archivo copiado cuando el original lo trae.

### D2 — Auth cliente: SDK `firebase` puro (sin `@angular/fire`)

Evidencia verificada (`npm view @angular/fire peerDependencies`):
- `latest` = **20.1.1** → peers `@angular/core ^20.0.0`, `@angular/common
  ^20.0.0`, `@angular/platform-browser ^20.0.0`, `rxjs ~7.8.0`.
- `next` = 21.0.0-rc.2 → peers `^21.2.0`. Tampoco soporta Angular 22.
- `apps/admin/package.json` declara `@angular/fire ^20.0.0` pero no está
  instalado en `node_modules` (nunca llegó a instalarse).

Conclusión: **no existe versión compatible con Angular 22**. Se implementa un
único path: SDK `firebase` (v13) con `initializeApp` + `getAuth` envueltos en
`AuthService` (root, provider en `app.config.ts`), estado con **signals**
(`currentUser`, `isAuthenticated`, `isInitializing`) sincronizados desde
`onAuthStateChanged`. Se elimina `@angular/fire` del `package.json`.
El ID token se obtiene con `getIdToken()` (auto-refresh del SDK).

### D3 — Config Firebase por build (sin credenciales committeadas)

`src/environments/environment.model.ts` (tipos) + variantes con
fileReplacements por configuración en `angular.json`:

- **development**: `environment.ts` → `environment.development.local.ts`
  (**gitignoreado**, generado por `write-env.mjs --target=dev`). El
  reemplazo es de **UN SOLO nivel**: Angular no aplica reemplazos en
  cascada (solo contra el archivo original `environment.ts`), y una cadena
  `environment.ts → environment.development.ts → …-local.ts` dejaba el
  bundle de desarrollo con placeholders aunque existieran credenciales
  reales (bug detectado en verificación manual). Regla protegida por
  `dev-file-replacement.test.ts` y por el smoke E2E `[bug-1]` (la `key=` de
  identitytoolkit debe coincidir con el archivo). El ejemplo de placeholders
  vive en `environment.development.example.ts`, sincronizado con
  `DEV_PLACEHOLDERS` del script (testeado).
- **production**: `environment.ts` → `environment.production.ts`
  (gitignoreado, generado por `write-env.mjs` desde variables de entorno del
  pipeline; ejemplo en `environment.production.example.ts`).

Valores inyectables: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`,
`FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`, `API_BASE_URL` (fallback
`http://localhost:3000/api/v1` — puerto del backend, `resolvePort`).

**Por qué no basta el fileReplacement a secas**: el archivo local es
gitignoreado y un clon limpio no lo tiene, lo que rompería `ng build`.
Resolución: los hooks npm (`postinstall`, `prestart`, `pretypecheck`)
ejecutan `write-env.mjs --target=dev --if-missing`, que crea el archivo con
los placeholders seguros solo si falta y **nunca** sobreescribe valores
reales existentes. Restricción documentada (README): ejecutar builds vía
`npm run …`; un `npx ng` directo puede fallar en un clon sin `npm install`.
Con `--target=dev` manual y variables ausentes el script escribe valores
vacíos con warning (la llamada real a Firebase fallará), salvo en el
bootstrap automático (`--if-missing`), que usa placeholders seguros porque
una `apiKey` vacía hace que `getAuth()` lance `auth/invalid-api-key` y
tumbe el bootstrap (verificado; ver `verification.md`).

### D4 — Transporte: interceptor Bearer + cliente base

- `authInterceptor` (`HttpInterceptorFn`): añade
  `Authorization: Bearer <idToken>` a las peticiones al backend; sin sesión
  continúa sin header.
- Manejo de 401: ante `401` del backend se limpia la sesión y redirige a
  `/login`.
- `ApiClientService` (base): URL desde `API_BASE_URL` (default dev
  `http://localhost:8080/api/v1`), destructura el envelope `{ data, error,
  meta }` y tipa los errores. En Foundation solo lo consume `/auth/me`; los
  servicios por dominio llegan con los changes posteriores.

### D5 — Routing base

`appRoutes`: `'' → /profile` (`pathMatch: 'full'` — constante
`POST_LOGIN_REDIRECT`; el change de contenido la re-apuntará a `/dashboard`),
`login` (público, sin shell), `profile` protegido con `canActivate: [authGuard]`
y renderizado dentro del shell (`children`), wildcard → `NotFoundPageComponent`.
Todo lazy (`loadComponent`). El `roleGuard` por ruta se introduce en
`admin-panel-operations` (cuando exista `/users`).

**El guard espera la inicialización del SDK (`AuthService.ready`)** — decisión
post-verificación-manual (bug de persistencia al recargar): la navegación
inicial de Angular es síncrona durante el bootstrap, pero el SDK de Firebase
restaura la sesión persistida de forma asíncrona (lectura de indexedDB);
decidir con el estado previo a la restauración expulsaba a usuarios
autenticados a `/login` con cada F5. El guard ahora devuelve
`authService.ready.then(...)`, donde `ready` resuelve cuando el primer
`onAuthStateChanged` terminó de establecer sesión y perfil
(`isInitializing === false`). Semántica **fail-closed**: si el SDK nunca
dispara el evento, la navegación queda pendiente (pantalla en blanco) — se
prefiere a fail-open porque rebotar a `/login` recrearía el bug; la
configuración inválida de Firebase ya falla antes, en `getAuth()`. Cobertura:
tests unitarios del guard (caso "aún inicializando") y E2E
`[session-restore]` que ejercita el ciclo real persistir → recargar →
restaurar con una sesión falsificada a nivel de respuestas del SDK.

### D6 — Control de acceso por rol (base)

`RoleService` (root, sobre el perfil cargado por `AuthService` desde
`/auth/me`): `role()` signal y `hasRole(...roles: UsuarioRol[])` con la
jerarquía `editor` < `admin` < `superadmin`. En Foundation su único consumo
visible es la disponibilidad de la base para ocultar acciones; el ocultamiento
de acciones CRUD y los guards por rol se especifican en los changes de
contenido/operaciones. Principio ya fijado: ocultar, no solo deshabilitar.

### D7 — Estructura de features

`src/features/<modulo>/` con patrón uniforme (`pages/`, `components/`,
`<modulo>.service.ts`, `models.ts`): Foundation crea `features/auth/` (login
existente + AuthService), `features/shell/` (layout + 404) y `features/profile/`.
`shared/` aloja los componentes UI copiados de TailAdmin y sus servicios.
Estado global solo para sesión (AuthService/RoleService).

## Riesgos / Trade-offs

- [Los tests de `apps/admin` podrían leerse como barrera para copiar TailAdmin]
  → Verificado: `styles/__tests__/sync.test.ts` (paridad de tokens `@theme`
  admin↔web y @fontsource) y `config/__tests__/globals-css.test.ts`
  (existencia de globals.css, import de tailwindcss, `--color-primary
  #41B3C4`) solo inspeccionan `globals.css`; `config/__tests__/
  {angular-config,package,main}.test.ts` inspeccionan `angular.json`,
  `package.json` (Tailwind v4) y `main.ts`. Ninguno toca componentes: copiar
  y adaptar templates no los rompe, siempre que no se copie el CSS del
  template ni se alteren los tokens.
- [Componentes TailAdmin con clases de dark mode y paleta propia] → Adaptación
  token a token durante la copia (checklist por archivo); el MVP es light-only,
  las variantes `dark:` se eliminan.
- [Flat design vs estética TailAdmin (rounded/shadows)] → Se eliminan en la
  adaptación; el look queda gobernado por los tokens Riff.
- [Token expira en 1h] → `getIdToken()` refresca por request; el manejo de 401
  cubre token revocado/inactivo.
- [Credenciales Firebase en el cliente] → Patrón estándar de Firebase web (la
  API key no es secreta; la seguridad vive en guards/reglas backend, ya
  implementadas). No se commitean valores reales (D3).
- [`/profile` como destino temporal post-login] → Aceptado para Foundation;
  el change de contenido re-apunta el redirect a `/dashboard` (delta futura
  sobre `admin-login`/`admin-app-shell`).

## Plan de despliegue

1. Construir el panel con las variables de entorno Firebase del entorno
   destino (añadir `FIREBASE_*` de cliente + `API_BASE_URL` al pipeline de
   build del admin en Coolify/Cloud Run).
2. Desplegar; rollback = revert del deploy (sin cambios de datos ni backend).

## Preguntas abiertas

- Ninguna bloqueante. La compatibilidad `@angular/fire` quedó resuelta con
  evidencia (D2): se usa SDK puro. La URL de producción de `API_BASE_URL` se
  toma del deploy existente del backend.
