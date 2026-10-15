# Delta admin-login

## MODIFIED Requirements

### Requirement: Login route with lazy loading
The admin panel SHALL configure `@angular/router` so that the root path (`''`) redirects to `/products` and the `/login` route loads the `LoginPageComponent` lazily via `loadComponent`; the root `AppComponent` SHALL render a `<router-outlet/>`. Unauthenticated access to protected routes (`/products`, `/profile`, etc.) SHALL be redirected to `/login` by the AuthGuard (defined in `admin-auth`). The redirect target is defined in `admin-panel-content`: the dashboard promised during Foundation is deferred and the root now points to the product list. (ADDED in `admin-login-panel`; MODIFIED in `admin-panel-foundation`; MODIFIED in `admin-panel-content`.)

#### Scenario: SC-006 — the /login route is reachable and the root redirects
- **GIVEN** the admin panel with the router configured
- **WHEN** the user visits `/`
- **THEN** the app redirects to `/products` (redirect `'' → /products`)
- **AND** if the user has no session, the AuthGuard further redirects to `/login`
- **AND** the `/login` route loads the `LoginPageComponent` in a separate chunk

## REMOVED Requirements

### Requirement: Submit conectado a Firebase Authentication
**Reason**: El destino post-login cambió de `/profile` a `/products` (dashboard diferido; ver `admin-panel-content`). Su escenario de éxito llevaba el destino en el título («Submit con credenciales válidas redirige al perfil») — identificador estable que la validación estricta no permite alterar dentro de un MODIFIED — por lo que el bloque se retira y se reemplaza íntegramente en lugar de dejar título y cuerpo desalineados.
**Migration**: El nuevo requirement «Submit de login conectado a Firebase Authentication» de este mismo change lo sustituye al archivarse; conserva la semántica de error visible sin redirección y de botón deshabilitado durante la autenticación.

## ADDED Requirements

### Requirement: Submit de login conectado a Firebase Authentication
El submit del formulario de login SHALL invocar `AuthService.login(email, password)`: al éxito SHALL redirigir a `/products` (o al `returnUrl` preservado); al fallo de autenticación SHALL mostrar un mensaje de error visible en la tarjeta de login y SHALL NOT redirigir. Mientras la autenticación está en curso, el botón SHALL deshabilitarse para evitar envíos duplicados. (ADDED in `admin-panel-content`; reemplaza a «Submit conectado a Firebase Authentication» de `admin-panel-foundation`, cuyo destino post-login era `/profile`.)

#### Scenario: Submit con credenciales válidas redirige al listado de productos
- **GIVEN** el formulario de login con credenciales válidas
- **WHEN** el usuario presiona `INICIAR SESIÓN`
- **THEN** se invoca `AuthService.login` con email y contraseña
- **AND** al completarse la autenticación y la carga del perfil, el router redirige a `/products`

#### Scenario: Submit con credenciales inválidas muestra error
- **GIVEN** el formulario de login con credenciales inválidas
- **WHEN** el usuario presiona `INICIAR SESIÓN`
- **THEN** se muestra un mensaje de error visible (texto claro de credenciales incorrectas, tono de error del design system)
- **AND** no se produce redirección y la sesión no queda establecida

#### Scenario: El botón se deshabilita mientras autentica
- **WHEN** la autenticación está en curso
- **THEN** el botón `INICIAR SESIÓN` queda deshabilitado hasta resolver la petición
