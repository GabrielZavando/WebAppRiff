# admin-login Specification

## ADDED Requirements

### Requirement: Login route with lazy loading
The admin panel SHALL configure `@angular/router` so that the root path (`''`) redirects to `/login` and the `/login` route loads the `LoginPageComponent` lazily via `loadComponent`; the root `AppComponent` SHALL render a `<router-outlet/>`. (ADDED in `admin-login-panel`.)

#### Scenario: SC-006 — the /login route is reachable and the root redirects
- **GIVEN** the admin panel with the router configured
- **WHEN** the user visits `/`
- **THEN** the app redirects to `/login` (redirect `'' → /login`)
- **AND** the `/login` route loads the `LoginPageComponent` in a separate chunk

### Requirement: Centered flat login card following the design tokens
The login panel SHALL render a navy card (`bg-secondary`, `shadow-2`) centered on a neutral background (`min-h-screen bg-bg flex items-center justify-center px-4 py-8`) with `w-full max-w-md`, no `rounded*` utilities (flat design, `--radius: 0`), and consuming only Tailwind utilities generated from `@theme` (no raw hex literals). Inner content adapts to the dark surface: labels and the recovery link in light tones (`text-white`, `text-primary-light`), inputs remain `bg-white`, the submit button stays `bg-primary`, and validation messages use the error light tone (`text-error-light`). (ADDED in `admin-login-panel`.)

#### Scenario: SC-001 — the login panel renders the card with logo, fields and button
- **GIVEN** the user navigates to `/login` of the admin panel
- **WHEN** the `LoginPageComponent` renders
- **THEN** a navy centered card exists over a `bg-bg` background
- **AND** the `Iniciar sesión` heading (`<h1>`, `font-heading`, `text-secondary`) sits ABOVE the card on the `bg-bg` background (not inside `[data-login-card]`), together with the Riff brand logo (`alt="Riff"`), the Correo and Contraseña fields, the `INICIAR SESIÓN` button and the `¿Olvidaste tu contraseña?` link
- **AND** the card uses no `rounded*` utilities and only `@theme` utilities (no hex literals)

### Requirement: Riff brand logo
The login card SHALL show the Riff brand logo (`alt="Riff"`, `max-w-[220px] mx-auto`) served from `apps/admin/src/assets/img/`, with the asset registered in `angular.json` build options (`assets`). (ADDED in `admin-login-panel`.)

#### Scenario: SC-001 — logo rendered with brand alt text
- **GIVEN** the login panel renders
- **THEN** the Riff logo is displayed with `alt="Riff"` and is horizontally centered at the top of the card

### Requirement: Email and password fields with labels and autocomplete
The login form SHALL render Correo and Contraseña inputs with associated `<label for>`/`id` pairs, `autocomplete="email"` and `autocomplete="current-password"`, and the shared input style `h-11 border border-border bg-white px-3 text-sm focus:outline-none focus:border-primary`. (ADDED in `admin-login-panel`.)

#### Scenario: SC-001 — fields rendered with labels
- **GIVEN** the login panel renders
- **THEN** the Correo and Contraseña inputs exist with visible labels, `autocomplete` attributes and `focus:border-primary` on focus

### Requirement: Email validation
The Correo field SHALL be `required` with a valid email format (`Validators.email`); when invalid or empty and touched, it SHALL show `border-error` with a visible `text-error` message and keep the form invalid. (ADDED in `admin-login-panel`.)

#### Scenario: SC-002 — invalid email shows an error on touch
- **GIVEN** the login form is rendered
- **WHEN** the user types a non-email value (e.g. `admin`) or leaves it empty and the field becomes touched
- **THEN** the Correo field shows the error state (`border-error`) with a visible message (`text-error`)
- **AND** the form stays invalid and the `INICIAR SESIÓN` button remains disabled

### Requirement: Password validation
The Contraseña field SHALL be `required` with a minimum length of 6 characters; when invalid and touched, it SHALL show `border-error` with a visible `text-error` message and keep the form invalid. (ADDED in `admin-login-panel`.)

#### Scenario: SC-003 — invalid password shows an error
- **GIVEN** the login form is rendered
- **WHEN** the user types an empty password or one shorter than 6 characters and the field becomes touched
- **THEN** the Contraseña field shows the error state (`border-error`) with a visible message (`text-error`)
- **AND** the form stays invalid and the `INICIAR SESIÓN` button remains disabled

### Requirement: Submit button enabled only when the form is valid
The `INICIAR SESIÓN` button SHALL be disabled while the form is invalid and enabled only when both fields are valid; it SHALL use the brand button style `w-full h-11 bg-primary hover:bg-primary-dark text-white font-heading font-semibold uppercase text-xs tracking-wide` with `disabled:opacity-50 disabled:cursor-not-allowed`. (ADDED in `admin-login-panel`.)

#### Scenario: SC-004 — button enabled only with a valid form
- **GIVEN** the Correo and Contraseña fields
- **WHEN** both are valid (valid email format and password of at least 6 characters)
- **THEN** the `INICIAR SESIÓN` button becomes enabled
- **AND** if either field becomes invalid again, the button returns to disabled

### Requirement: UI-only submit handler
The form submit (`ngSubmit`) SHALL invoke a no-op handler that prevents the native form submission; no Firebase Auth or backend call happens in this change. (ADDED in `admin-login-panel`.)

#### Scenario: SC-005 — submitting invokes the handler (UI-only)
- **GIVEN** the login form with valid fields
- **WHEN** the user presses `INICIAR SESIÓN` (submit)
- **THEN** the component submit handler runs (stub no-op: no Firebase Auth or backend call)
- **AND** the page does not reload (native submit prevented)

### Requirement: Accessible login panel
Each field SHALL have an associated `<label for>`/`id`, `aria-describedby` pointing to its error message, `autocomplete` (`email` / `current-password`); the logo SHALL carry `alt="Riff"`, the button a visible accessible text `INICIAR SESIÓN`, and the recovery link a descriptive `aria-label`. (ADDED in `admin-login-panel`.)

#### Scenario: SC-007 — accessibility of the login panel
- **GIVEN** the login panel rendered
- **WHEN** a screen reader or keyboard user traverses it
- **THEN** each field has `<label for>`/`id`, `autocomplete` and `aria-describedby` pointing to its error message
- **AND** the logo has `alt="Riff"`, the button has accessible text `INICIAR SESIÓN`, and the `¿Olvidaste tu contraseña?` link has a descriptive `aria-label`

### Requirement: Clickable "¿Olvidaste tu contraseña?" link
The panel SHALL render the clickable text `¿Olvidaste tu contraseña?` as an `<a href="#">` (decorative; real password recovery is a future change), centered below the submit button and styled with tokens (`text-primary hover:text-primary-dark`). (ADDED in `admin-login-panel`.)

#### Scenario: SC-008 — the recovery link is clickable
- **GIVEN** the login panel rendered
- **WHEN** the user activates the `¿Olvidaste tu contraseña?` text
- **THEN** it is a clickable `<a href="#">` (decorative; recovery flow not implemented yet)

### Requirement: Responsive layout without horizontal overflow
The login card SHALL be `w-full max-w-md` centered with `px-4`, without horizontal overflow at 375px and 1440px viewports; on mobile the fields and the button SHALL use the full card width. (ADDED in `admin-login-panel`.)

#### Scenario: SC-009 — responsive without overflow on mobile and desktop
- **GIVEN** the login panel
- **WHEN** rendered at mobile (375px) and desktop (1440px) viewports
- **THEN** the card stays centered and inside the viewport (`max-w-md`, `px-4`) with no horizontal overflow
- **AND** on mobile the fields and the button use the full available card width