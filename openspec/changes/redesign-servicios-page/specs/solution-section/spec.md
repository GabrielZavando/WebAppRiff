## REMOVED Requirements

### Requirement: SolutionSection content is configured via a hardcoded constant
**Reason**: El `href` genérico `/soluciones` apuntaba a una ruta inexistente. Las tarjetas del home deben abrir la fila exacta del portafolio en `/servicios`.
**Migration**: Usar la nueva versión del requisito, que conserva la misma estructura de `SOLUTION_SECTION_CONTENT` y cambia solo los valores de `href` a `/servicios#solucion-*`.

## ADDED Requirements

### Requirement: SolutionSection content is configured via a hardcoded constant and deep-links to /servicios
The `solution-section` content SHALL come from the `SOLUTION_SECTION_CONTENT` constant in `lib/config/solution-section.ts`, exported as `Readonly<SolutionSectionProps>`, containing exactly 4 solutions and the section header copy. The 4 solutions SHALL be, in render order: "Medición de Fluidos", "Tratamiento de Agua", "Productos Químicos", "Control y Accesorios". Each solution SHALL carry a `slug`, `title`, `description`, `image` (imported from `apps/web/src/assets/img/`), `imageAlt`, `icon` (one of the `SolutionIconName` allowlist) and an `href` that deep-links to the matching row of the `/servicios` "Portafolio Técnico" section: `medicion-de-fluidos` → `/servicios#solucion-medicion-fluidos`, `tratamiento-de-agua` → `/servicios#solucion-tratamiento-agua`, `productos-quimicos` → `/servicios#solucion-productos-quimicos` and `control-y-accesorios` → `/servicios#solucion-control-accesorios`. The `#solucion-*` anchors SHALL stay 1:1 with the `SolucionPortafolio.id` values defined by the `/servicios` config.

#### Scenario: SOLUTION_SECTION_CONTENT exposes the full set of props
- **WHEN** `SOLUTION_SECTION_CONTENT` is imported from `lib/config/solution-section`
- **THEN** it has the shape `{ readonly eyebrow: string; readonly headline: string; readonly description: string; readonly solutions: readonly Solution[] }`
- **AND** `eyebrow`, `headline` and `description` are non-empty strings
- **AND** `solutions` has length exactly 4

#### Scenario: Solutions carry the expected titles in render order
- **WHEN** `SOLUTIONS_DATA` (or `SOLUTION_SECTION_CONTENT.solutions`) is inspected
- **THEN** the titles in render order are exactly: "Medición de Fluidos", "Tratamiento de Agua", "Productos Químicos", "Control y Accesorios"

#### Scenario: Each solution deep-links to its /servicios portfolio anchor
- **WHEN** `SOLUTIONS_DATA` is inspected
- **THEN** the `href` values in render order are exactly: `/servicios#solucion-medicion-fluidos`, `/servicios#solucion-tratamiento-agua`, `/servicios#solucion-productos-quimicos`, `/servicios#solucion-control-accesorios`
- **AND** no solution `href` equals the generic `/soluciones` path

#### Scenario: Each solution carries a Lucide icon from the constrained allowlist
- **WHEN** `SOLUTIONS_DATA` is inspected
- **THEN** each element's `icon` is one of `"gauge"`, `"droplet"`, `"flask-conical"`, `"settings-2"`
- **AND** the icons in render order are exactly: `"gauge"`, `"droplet"`, `"flask-conical"`, `"settings-2"`

#### Scenario: Each solution carries a non-empty descriptive imageAlt
- **WHEN** `SOLUTIONS_DATA` is inspected
- **THEN** each element's `imageAlt` is a non-empty string describing the image content (not the title)
