# Scenarios — admin-login-panel

> Validación de diseño: change solo frontend (UI-only); no introduce entidades
> del data model ni endpoints de API (no aplica verificación contra
> `docs/data-model/data-model.md` ni `docs/api/api-spec.yml`). Conflictos
> menores: ninguno — la ruta `/login` no choca con rutas existentes (el admin
> no tiene router previo) y el logo reutiliza el asset existente de la marca.
>
> Escenarios derivados del título del ticket (`LOGIN-1`: "Admin login panel
> UI") al no existir artefacto enriquecido; cubren happy path, casos de error
> y edge cases con IDs `SC-{NNN}` secuenciales.

### SC-001: El panel de login renderiza la card con logo, campos y botón
**Given** el usuario navega a `/login` del panel admin
**When** se renderiza el `LoginPageComponent`
**Then** existe una card navy (`bg-secondary`) centrada sobre fondo `bg-bg` con elevación `shadow-2`
**And** muestra el título `Iniciar sesión` **encima de la card** (sobre `bg-bg`, `<h1>` `font-heading` `text-secondary`, no dentro de `[data-login-card]`), el logo de la marca Riff (`alt="Riff"`), los campos Correo y Contraseña, el botón `INICIAR SESIÓN` y el link "¿Olvidaste tu contraseña?"
**And** los labels y el link usan tonos claros sobre el fondo oscuro (`text-white` / `text-primary-light`), los inputs permanecen `bg-white` y los mensajes de error usan `text-error-light`
**And** la card no usa esquinas redondeadas (`rounded*` ausente) y solo consume utilities de `@theme` (sin hex literales)

### SC-002: Email inválido muestra error al tocar el campo
**Given** el formulario de login renderizado
**When** el usuario escribe un email sin formato válido (p. ej. `admin` o vacío) y el campo queda en estado tocado
**Then** el campo de correo muestra estado de error (`border-error`) con mensaje visible (`text-error`)
**And** el formulario permanece inválido y el botón de inicio de sesión deshabilitado

### SC-003: Contraseña inválida muestra error
**Given** el formulario de login renderizado
**When** el usuario escribe una contraseña vacía o de menos de 6 caracteres y el campo queda en estado tocado
**Then** el campo de contraseña muestra estado de error (`border-error`) con mensaje visible (`text-error`)
**And** el formulario permanece inválido y el botón de inicio de sesión deshabilitado

### SC-004: Botón habilitado solo con formulario válido
**Given** los campos Correo y Contraseña
**When** ambos son válidos (email con formato correcto y contraseña ≥ 6 caracteres)
**Then** el botón `INICIAR SESIÓN` queda habilitado
**And** si cualquiera de los dos deja de ser válido, el botón vuelve a deshabilitarse

### SC-005: Envío del formulario invoca el handler (UI-only)
**Given** el formulario de login con campos válidos
**When** el usuario presiona `INICIAR SESIÓN` (submit)
**Then** se invoca el handler de submit del componente (stub no-op: no hay llamada a Firebase Auth ni a backend en este hito)
**And** el formulario no recarga la página (prevención del submit nativo)

### SC-006: La ruta /login es alcanzable y la raíz redirige
**Given** el panel admin con router configurado
**When** el usuario visita `/`
**Then** se redirige a `/login` (redirect `'' → /login`)
**And** la ruta `/login` carga el `LoginPageComponent` de forma lazy (chunk separado)

### SC-007: Accesibilidad del panel de login
**Given** el panel de login renderizado
**When** un lector de pantalla o teclado lo recorre
**Then** cada campo tiene `<label for>`/`id` asociado, `autocomplete` (`email` / `current-password`) y `aria-describedby` apuntando a su mensaje de error
**And** el logo tiene `alt="Riff"`, el botón tiene texto accesible `INICIAR SESIÓN` y el link "¿Olvidaste tu contraseña?" tiene `aria-label` descriptivo

### SC-008: Link "¿Olvidaste tu contraseña?" clickeable
**Given** el panel de login renderizado
**When** el usuario activa el texto "¿Olvidaste tu contraseña?"
**Then** es un `<a>` clickeable con `href="#"` (decorativo; la recuperación real se implementa en un change posterior)

### SC-009: Responsive — sin overflow en móvil y desktop
**Given** el panel de login
**When** se renderiza en viewport móvil (375px) y desktop (1440px)
**Then** la card se centra y se mantiene dentro del viewport (`max-w-md`, `px-4`), sin overflow horizontal
**And** en móvil los campos y el botón usan todo el ancho disponible de la card

## Non-Functional Requirements aplicados

- Flat design estricto: `--radius: 0`, prohibido `rounded*` (style guide).
- Solo utilities Tailwind generadas desde `@theme`; prohibidos literales hex
  (`docs/frontend-standards.md` § Design Tokens).
- Mobile-first, diseño responsivo obligatorio; estados de carga/error visibles
  (`docs/frontend-standards.md` § UI/UX).
- Componentes smart/dumb: `LoginPageComponent` es smart (posee el estado del
  formulario); el template se extrae a `.html` (umbral 60-80 líneas).
- Máximo 400 líneas por archivo de componente `.ts`.