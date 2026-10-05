# Requirements — admin-login-panel

1. **R1 — Routing con ruta /login lazy.** El admin configura `@angular/router`:
   `''` redirige a `/login` y la ruta `/login` carga `LoginPageComponent` de
   forma lazy (`loadComponent`); raíz `AppComponent` con `<router-outlet/>`.
   (SC-006)
2. **R2 — Card centrada flat en azul navy del sistema.** El panel es una card
   `bg-secondary shadow-2` centrada en `min-h-screen bg-bg`, sin `rounded*` y
   consumiendo solo utilities de `@theme` (sin hex literales); el contenido se
   adapta al fondo oscuro: título `Iniciar sesión` **encima de la card** (sobre
   `bg-bg`, `<h1>` `font-heading` `text-secondary`, fuera de `[data-login-card]`),
   labels `text-white`, link `text-primary-light`,
   inputs `bg-white`, botón `bg-primary`, mensajes de error `text-error-light`.
   (SC-001, SC-009)
3. **R3 — Logo de la marca Riff.** La card muestra el logo (`alt="Riff"`,
   `max-w-[220px] mx-auto`) servido desde `apps/admin/src/assets/img/`, con el
   asset registrado en `angular.json` (`assets`). (SC-001)
4. **R4 — Campos Correo y Contraseña con labels y autocomplete.** Inputs con
   `<label for>`/`id`, `autocomplete="email"` y `autocomplete="current-password"`,
   estilo `h-11 border border-border bg-white px-3 text-sm focus:outline-none
   focus:border-primary` (patrón SearchForm del sitio). (SC-001, SC-007)
5. **R5 — Validación de correo.** El campo Correo exige `required + email`; con
   valor inválido o vacío y campo tocado muestra `border-error` + mensaje
   `text-error` y mantiene el formulario inválido. (SC-002)
6. **R6 — Validación de contraseña.** El campo Contraseña exige
   `required + minLength(6)`; con valor inválido y campo tocado muestra
   `border-error` + mensaje `text-error` y mantiene el formulario inválido.
   (SC-003)
7. **R7 — Botón deshabilitado con form inválido.** El botón `INICIAR SESIÓN`
   (`w-full h-11 bg-primary hover:bg-primary-dark text-white font-heading
   font-semibold uppercase text-xs tracking-wide`) está `disabled` mientras el
   formulario sea inválido y se habilita solo cuando ambos campos son válidos.
   (SC-004)
8. **R8 — Submit stub (UI-only).** `(ngSubmit)` invoca un handler no-op que
   previene el submit nativo (sin Firebase Auth ni backend en este hito).
   (SC-005)
9. **R9 — Link "¿Olvidaste tu contraseña?".** Texto clickeable
   `¿Olvidaste tu contraseña?` como `<a href="#">` (decorativo), con
   `aria-label` descriptivo, centrado bajo el botón y estilizado con tokens
   (`text-primary hover:text-primary-dark`). (SC-008, SC-007)
10. **R10 — Responsive mobile-first.** La card es `w-full max-w-md` centrada
    con `px-4`; sin overflow horizontal en 375px ni 1440px; en móvil los
    campos y el botón ocupan todo el ancho de la card. (SC-009)
11. **R11 — Accesibilidad.** `aria-describedby` en cada campo apuntando a su
    mensaje de error, logo con `alt="Riff"`, botón con texto accesible.
    (SC-007)
12. **R12 — Smoke E2E de la ruta /login.** Test Playwright verifica que
    `/login` renderiza la card completa y que no hay overflow horizontal en
    viewports móvil (375px) y desktop (1440px). (SC-001, SC-009)