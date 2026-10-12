## MODIFIED Requirements

### Requirement: Login route with lazy loading
The admin panel SHALL configure `@angular/router` so that the root path (`''`) redirects to `/profile` and the `/login` route loads the `LoginPageComponent` lazily via `loadComponent`; the root `AppComponent` SHALL render a `<router-outlet/>`. Unauthenticated access to protected routes (`/profile`, etc.) SHALL be redirected to `/login` by the AuthGuard (defined in `admin-auth`). The redirect target is temporary for Foundation: `admin-panel-content` will re-point it to `/dashboard`. (ADDED in `admin-login-panel`; MODIFIED in `admin-panel-foundation`.)

#### Scenario: SC-006 — the /login route is reachable and the root redirects
- **GIVEN** the admin panel with the router configured
- **WHEN** the user visits `/`
- **THEN** the app redirects to `/profile` (redirect `'' → /profile`)
- **AND** if the user has no session, the AuthGuard further redirects to `/login`
- **AND** the `/login` route loads the `LoginPageComponent` in a separate chunk

## REMOVED Requirements

### Requirement: UI-only submit handler
**Reason**: El submit ya no es un stub UI-only: este change conecta el formulario de login a Firebase Authentication (ver `ADDED: Submit conectado a Firebase Authentication` en esta misma delta y la capability `admin-auth`).
**Migration**: El submit del formulario ahora invoca `AuthService.login(email, password)`; el comportamiento (éxito → `/profile` o `returnUrl`, fallo → mensaje de error) queda especificado en la requirement nueva de esta delta y en `admin-auth`.

## ADDED Requirements

### Requirement: Submit conectado a Firebase Authentication
El submit del formulario de login SHALL invocar `AuthService.login(email, password)`: al éxito SHALL redirigir a `/profile` (o al `returnUrl` preservado); al fallo de autenticación SHALL mostrar un mensaje de error visible en la tarjeta de login y SHALL NOT redirigir. Mientras la autenticación está en curso, el botón SHALL deshabilitarse para evitar envíos duplicados. (ADDED in `admin-panel-foundation`.)

#### Scenario: Submit con credenciales válidas redirige al perfil
- **GIVEN** el formulario de login con credenciales válidas
- **WHEN** el usuario presiona `INICIAR SESIÓN`
- **THEN** se invoca `AuthService.login` con email y contraseña
- **AND** al completarse la autenticación y la carga del perfil, el router redirige a `/profile`

#### Scenario: Submit con credenciales inválidas muestra error
- **GIVEN** el formulario de login con credenciales inválidas
- **WHEN** el usuario presiona `INICIAR SESIÓN`
- **THEN** se muestra un mensaje de error visible (texto claro de credenciales incorrectas, tono de error del design system)
- **AND** no se produce redirección y la sesión no queda establecida

#### Scenario: El botón se deshabilita mientras autentica
- **WHEN** la autenticación está en curso
- **THEN** el botón `INICIAR SESIÓN` queda deshabilitado hasta resolver la petición
