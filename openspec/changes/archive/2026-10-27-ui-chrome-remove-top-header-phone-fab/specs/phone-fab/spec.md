# phone-fab Specification

## Purpose

Botón flotante global de llamada telefónica del sitio público, renderizado una vez por `Layout.astro` encima del botón de WhatsApp y alimentado por la configuración de contacto compartida.

## ADDED Requirements

### Requirement: Global floating phone contact button
Every page of the site SHALL render a floating phone contact button (`PhoneFab.astro`, integrated once in `Layout.astro`): a fixed `<a>` at the bottom-right column (`fixed bottom-24 right-6 z-20`), icon-only (`lucide:phone` via astro-icon, no visible text label), with a 56×56 px hit area (`h-14 w-14`) and a 28 px icon (`h-7 w-7`). The button SHALL use the design tokens `bg-accent` (#F26A21), `text-white` for the icon and `hover:bg-accent-dark`; no raw hex SHALL appear in the component. The button SHALL NOT use radius or shadow utilities, consistent with the flat design system. The number SHALL be provided via the `phone` prop from `Layout.astro`, sourced from `contact.phone` in `lib/config/contact.ts` (`+56 2 29079067`); the component SHALL NOT hardcode the number. The `href` SHALL be derived by preserving an optional leading `+` and stripping every other non-digit character. When `phone` is empty or undefined, no anchor SHALL render.

#### Scenario: SC-201 — button links to the configured phone number
- **GIVEN** `Layout.astro` renders `<PhoneFab phone={contact.phone} />` with `contact.phone = '+56 2 29079067'`
- **WHEN** the button renders
- **THEN** the `<a>` carries `href="tel:+56229079067"`
- **AND** the component source does NOT contain the phone number as a hardcoded literal
- **AND** the button does NOT have `target="_blank"` (the `tel:` action stays in the current context)

#### Scenario: SC-202 — floating button on every page
- **GIVEN** any page of the site, including the 404 fallback and pages without the search bar
- **WHEN** the Layout renders
- **THEN** a fixed bottom-right floating button links to the configured phone number, icon-only
- **AND** its vertical position is 96 px from the bottom (`bottom-24`), leaving a 16 px gap above the WhatsApp FAB (`bottom-6` + 56 px height)
- **AND** it shares `z-20` with the WhatsApp FAB and stays below the sticky header group (`z-30`) and its mobile menu overlay

#### Scenario: SC-203 — phone button accessibility
- **GIVEN** the floating phone button rendered with the accent token color
- **WHEN** a screen reader or keyboard user reaches it
- **THEN** it is an `<a>` with `aria-label="Llamar a Riff"` and a visible focus state
- **AND** the icon carries `aria-hidden="true"` and there is no visible text label with the number

#### Scenario: SC-204 — empty phone renders nothing
- **WHEN** the component renders with `phone` equal to an empty string or `undefined`
- **THEN** no phone `<a>` element is rendered in the layout

### Requirement: Phone button pulse animation in pure CSS with reduced-motion support

El botón flotante de teléfono SHALL aplicar la misma animación de atención que el botón de WhatsApp: un pulso infinito y sutil de escala (`@keyframes` con `transform: scale()` y opacidad, sin JavaScript y sin librerías). La animación SHALL declararse en un `<style>` scoped del componente, SHALL usar únicamente propiedades animables por GPU (`transform`, `opacity`) y SHALL NOT alterar la posición fija, el tamaño del hit area ni el z-index del botón. Con `prefers-reduced-motion: reduce` la animación SHALL desactivarse por completo (`animation: none`), conservando el botón su tamaño, color y estados hover/focus.

#### Scenario: SC-205 — infinite subtle pulse at rest
- **WHEN** the page renders without user interaction
- **THEN** the button (or a decorative pseudo-element declared in the scoped `<style>`) carries a CSS animation with `infinite` that oscillates the scale subtly
- **AND** the component does not add any animation script (the animation is 100% CSS)

#### Scenario: SC-206 — animation disabled with reduced motion
- **GIVEN** a user with `prefers-reduced-motion: reduce` active
- **WHEN** the page renders
- **THEN** the pulse animation is not applied (`animation: none` inside the media query)
- **AND** the button keeps its 56×56 px size, its `bg-accent` color, its `hover:bg-accent-dark` state and its `tel:` link

#### Scenario: SC-207 — animation does not degrade usability
- **WHEN** the user interacts with the button (hover, focus, click)
- **THEN** the animation does not change the fixed position (`bottom-24 right-6`), the z-index (`z-20`) or the clickable area
- **AND** the animated properties are exclusively `transform` and `opacity`
