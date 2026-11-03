## MODIFIED Requirements

### Requirement: Copyright bar shows copyright, location and scroll-to-top button

The `site-footer` SHALL render a bottom bar separated from the main zone by a horizontal divider (a `<div>` with `border-t` and a low-opacity white border, e.g. `border-white/10`). The bar SHALL contain: the copyright notice ("© 2024 RIFF SPA. TODOS LOS DERECHOS RESERVADOS.") styled with the muted color token and uppercase; the location text ("SANTIAGO, CHILE") styled with the muted color token and uppercase; and a square teal button (`bg-primary`, `text-white`) with a `lucide:arrow-up` icon, `aria-label="Volver arriba"` and a `data-scroll-top` attribute.

The scroll-to-top button SHALL be rendered immediately before the location text in the same flex group (button first, then location), so it reads as "just before" the location both in DOM order and visually. From the `sm` breakpoint upward the bottom bar SHALL reserve enough right padding (e.g. `sm:pr-24`) to keep that group clear of the fixed floating WhatsApp (`bottom-6 right-6`) and phone (`bottom-24 right-6`) buttons; the scroll-to-top button's bounding box SHALL NOT intersect either floating button's bounding box at `md` and above.

#### Scenario: Copyright text renders muted and uppercase

- **WHEN** the footer renders with the default content
- **THEN** the bottom bar contains the text "© 2024 RIFF SPA. TODOS LOS DERECHOS RESERVADOS."
- **AND** the copyright text carries the `text-muted` color class
- **AND** the copyright text carries an `uppercase` class

#### Scenario: Location renders muted and uppercase

- **WHEN** the footer renders with the default content
- **THEN** the bottom bar contains the text "SANTIAGO, CHILE"
- **AND** the location text carries the `text-muted` color class
- **AND** the location text carries an `uppercase` class

#### Scenario: Scroll-to-top button renders with teal background and arrow icon

- **WHEN** the footer renders
- **THEN** the bottom bar contains a `<button>` element carrying the `data-scroll-top` attribute
- **AND** the button carries the `bg-primary` and `text-white` classes
- **AND** the button carries `aria-label="Volver arriba"`
- **AND** the button contains a `lucide:arrow-up` icon rendered as an `<svg>`

#### Scenario: Scroll-to-top button is rendered before the location text

- **WHEN** the footer renders
- **THEN** dentro del grupo flex de la barra inferior, el `<button data-scroll-top>` aparece en el DOM antes del elemento con el texto "SANTIAGO, CHILE"
- **AND** el orden visual en la fila es botón de scroll a la izquierda y ubicación a la derecha
- **AND** el botón conserva `aria-label="Volver arriba"`, `bg-primary`, `text-white` y el ícono `lucide:arrow-up`

#### Scenario: Floating buttons do not cover the scroll-to-top button at md and above

- **WHEN** el footer se renderiza en los viewports `768×1024`, `1024×768` y `1280×800`
- **THEN** la barra inferior lleva padding derecho reservado (e.g. `sm:pr-24`)
- **AND** el `boundingBox` del `<button data-scroll-top>` NO intersecta el `boundingBox` del FAB de WhatsApp (`fixed bottom-6 right-6`)
- **AND** el `boundingBox` del `<button data-scroll-top>` NO intersecta el `boundingBox` del FAB de Teléfono (`fixed bottom-24 right-6`)
