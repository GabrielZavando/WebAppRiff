# Spec Delta — whatsapp-float-button

## MODIFIED Requirements

### Requirement: Global floating WhatsApp contact button
Every page of the site SHALL render a floating WhatsApp contact button (`WhatsAppButton.astro`, integrated once in `Layout.astro`): a fixed `<a>` at the bottom-right corner (`fixed bottom-6 right-6 z-20`), icon-only (`simple-icons:whatsapp` via astro-icon, no text label with the number), `target="_blank"` and `rel="noopener noreferrer"`. El botón SHALL renderizarse con una talla aumentada de 56×56 px (`h-14 w-14`) y un icono de 28 px (`h-7 w-7`), manteniendo su posición fija y su nivel de z-index. The number SHALL be provided via the `phone` prop from `Layout.astro`, sourced from the configuration constant `contact.whatsapp` (`+56 9 3752 6162`) in `lib/config/contact.ts` — the component SHALL NOT hardcode the number. The `href` SHALL be derived as `https://wa.me/{digits}` (phone digits only with country code). The button colors SHALL use the design tokens `--color-whatsapp` (#25D366) and `--color-whatsapp-dark` (hover); no raw hex in the component. (MODIFIED in `ui-chrome-uniform` — the number moved from a hardcoded literal to the configuration constant via prop.)

#### Scenario: SC-004 — button links to the configured WhatsApp number
- **GIVEN** `Layout.astro` renders `<WhatsAppButton phone={contact.whatsapp} />` with `contact.whatsapp = '+56 9 3752 6162'`
- **WHEN** the button renders
- **THEN** the `<a>` carries `href="https://wa.me/56937526162"` (digits of the constant)
- **AND** the component source does NOT contain the phone number as a hardcoded literal

#### Scenario: SC-007 — floating WhatsApp button on every page
- **GIVEN** any page of the site (including the 404 fallback and pages without the search bar)
- **WHEN** the Layout renders
- **THEN** a fixed bottom-right floating button links to the configured WhatsApp number (target `_blank`, `rel="noopener noreferrer"`), icon-only
- **AND** it is visible above the page content (≥ `z-10`) and below the sticky header group `z-30` and its mobile menu overlay (`z-20` < `z-30`)

#### Scenario: SC-008 — WhatsApp button accessibility
- **GIVEN** the floating WhatsApp button rendered with the brand token color
- **WHEN** a screen reader or keyboard user reaches it
- **THEN** it is an `<a>` with `aria-label="Contactar por WhatsApp"` and a visible focus state
- **AND** the icon carries `aria-hidden="true"` and there is no text label with the number

#### Scenario: SC-009 — increased FAB size
- **GIVEN** el botón flotante renderizado en cualquier página
- **WHEN** se inspecciona el marcado del `<a>`
- **THEN** el `<a>` lleva las clases de talla `h-14 w-14` (56×56 px)
- **AND** el icono `simple-icons:whatsapp` lleva las clases `h-7 w-7` (28 px)
- **AND** las clases `h-12 w-12` / `h-6 w-6` ya no están presentes en el componente

## ADDED Requirements

### Requirement: Attention-grabbing pulse animation in pure CSS with reduced-motion support
El botón flotante SHALL aplicar una animación de atención en CSS puro: un pulso infinito y sutil de escala (`@keyframes` con `transform: scale()` y opacidad, sin JavaScript y sin librerías). La animación SHALL declararse en un `<style>` scoped del componente (mismo patrón que el carrusel de clientes de `/nosotros`), SHALL usar únicamente propiedades animables por GPU (`transform`, `opacity`) y SHALL NOT alterar la posición fija, el tamaño del hit area ni el z-index del botón. Con `prefers-reduced-motion: reduce` la animación SHALL desactivarse por completo (`animation: none`), conservando el botón su tamaño, color y estados hover/focus.

#### Scenario: Pulso infinito sutil en estado reposo
- **WHEN** la página renderiza sin interacción del usuario
- **THEN** el botón (o un pseudo-elemento decorativo declarado en el `<style>` scoped) lleva una animación CSS con `infinite` que oscila la escala de forma sutil
- **AND** el componente no añade ningún script de animación (la animación es 100% CSS)

#### Scenario: Animación desactivada con preferencia de movimiento reducido
- **GIVEN** un usuario con `prefers-reduced-motion: reduce` activo
- **WHEN** la página renderiza
- **THEN** la animación de pulso no se aplica (`animation: none` en el media query)
- **AND** el botón conserva su talla 56×56 px, su color `bg-whatsapp`, su hover `bg-whatsapp-dark` y su enlace a `wa.me`

#### Scenario: La animación no degrada la usabilidad
- **WHEN** el usuario interactúa con el botón (hover, focus, clic)
- **THEN** la animación no cambia la posición fija (`bottom-6 right-6`), ni el z-index (`z-20`), ni el área clicable del enlace
- **AND** las propiedades animadas son exclusivamente `transform` y `opacity`
