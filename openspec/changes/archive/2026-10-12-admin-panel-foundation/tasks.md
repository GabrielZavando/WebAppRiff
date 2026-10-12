## 1. Configuración base (entorno, Firebase, transporte)

- [x] 1.1 Configurar `src/environments/` con placeholders committeados, archivos por configuración (fileReplacements) y ejemplo local gitignoreado; inyectar `FIREBASE_*` de cliente + `API_BASE_URL` vía `define`/fileReplacements en `angular.json` (design D3). Test: paridad de claves de environment + build dev OK.
- [x] 1.2 Añadir `firebase` (SDK v13) y eliminar `@angular/fire` del `package.json` (evidencia D2: peer `^20.0.0` latest / `^21.2.0` next, ambos incompatibles con Angular 22). Test: `npm ls` limpio y `package.test.ts` en verde.
- [x] 1.3 Inicializar Firebase en `app.config.ts` (`initializeApp` + `getAuth`) + `provideHttpClient(withInterceptors([...]))`. Test fallido: la app bootstrapea con Auth disponible (spec `admin-auth`).
- [x] 1.4 Implementar `ApiClientService` (base URL, envelope `{data,error,meta}`, errores tipados) con test de destructuración del envelope.
- [x] 1.5 Implementar `authInterceptor` (Bearer + manejo de 401: limpiar sesión y redirigir a `/login`) con tests: header presente con sesión, ausente sin sesión, 401 cierra sesión (spec `admin-auth`).

## 2. Núcleo de sesión y roles

- [x] 2.1 Implementar `AuthService` con signals (`currentUser`, `isAuthenticated`, `isInitializing`) sincronizados desde `onAuthStateChanged`, `login` (signInWithEmailAndPassword + carga de perfil vía `GET /auth/me`), `logout`, `getIdToken` y restauración al recargar. TDD: tests de login exitoso, login fallido, logout, idToken y sesión persistente (spec `admin-auth`).
- [x] 2.2 Implementar `AuthGuard` funcional (redirect a `/login` con `returnUrl`) con tests: sin sesión redirige, con sesión permite (spec `admin-auth`).
- [x] 2.3 Implementar `RoleService` (`role()` signal + `hasRole(...)`, jerarquía editor < admin < superadmin, `false` sin perfil cargado) con tests por rol (spec `admin-role-access`).

## 3. Shell basado en TailAdmin (Opción A1)

- [x] 3.1 Clonar `TailAdmin/free-angular-tailwind-dashboard` en un directorio temporal fuera del repo y copiar según la tabla de design D1: `shared/layout/{app-layout,app-sidebar,app-header,backdrop}`, `shared/services/sidebar.service.ts`, `shared/components/ui/{button,dropdown,avatar,badge}`, `shared/components/common/page-breadcrumb/` y `pages/other-page/not-found/`. NO copiar su `package.json`, `angular.json`, `styles.css`, assets, páginas no usadas ni los componentes UI que Foundation aún no consume (`ui/alert`, `ui/modal`, `ui/table` — se extraerán en Content/Operations para evitar código muerto).
- [x] 3.2 Adaptar los componentes copiados: reescribir clases `brand-*`/`gray-*` a utilities de `@theme` Riff, eliminar `rounded*`/`shadow*` y variantes `dark:` (light-only), conservar atribución MIT cuando el archivo original la traiga. Checklist de adaptación por archivo + test de que el shell no referenciar paletas TailAdmin ni `rounded*`/`shadow*` (spec `admin-app-shell`).
- [x] 3.3 Integrar `features/auth/login` existente como página pública sin shell (referencia visual: `auth-page-layout`/`signin-form` del template, sin copiarlos) y conectar `auth-page-layout` solo si aporta sin chocar con la spec `admin-login` vigente.

## 4. Routing base y 404

- [x] 4.1 Reescribir `app.routes.ts`: `'' → /profile` (`pathMatch: 'full'`, constante `POST_LOGIN_REDIRECT`), `/login` público sin shell, `/profile` protegido con `authGuard` bajo el shell, wildcard → 404, todo lazy. Test fallido de estructura de rutas primero (spec `admin-app-shell`, delta `admin-login`).
- [x] 4.2 Implementar la página 404 desde `not-found/` de TailAdmin (adaptada a tokens Riff) con enlace a `/profile`; test de render + navegación (spec `admin-app-shell`).
- [x] 4.3 Cablear el header del shell con usuario actual (avatar + dropdown) y logout; test de render y de acción logout (spec `admin-app-shell` + `admin-auth`).

## 5. Login real

- [x] 5.1 Conectar el submit del login existente a `AuthService` (redirect a `/profile` o `returnUrl`, mensaje de error visible, botón deshabilitado en curso). Tests TDD: éxito redirige, fallo muestra error, botón deshabilitado (delta `admin-login`).

## 6. Perfil

- [x] 6.1 Implementar `ProfileService` (consumo de `GET /auth/me` vía `ApiClientService`) con test de mapeo del envelope.
- [x] 6.2 Página `/profile` de solo lectura (nombre, email, rol) con test de render sin controles de edición (spec `admin-profile`).

## 7. Verificación final

- [x] 7.1 `npm run lint` + `npm run typecheck` + `npm run test` en `apps/admin` en verde (incluye tests de paridad de tokens y config existentes).
- [x] 7.2 `npm run build --workspace=apps/admin` sin errores.
- [x] 7.3 `npx openspec validate --all --strict` sin errores.
- [x] 7.4 Verificación manual documentada: login válido → `/profile`; login inválido → mensaje de error; `/profile` sin sesión → `/login`; recargar con sesión activa mantiene la sesión; logout → `/login`; sidebar colapsa/expande y persiste; 404 con vuelta al panel; peticiones al backend llevan `Authorization: Bearer`.
