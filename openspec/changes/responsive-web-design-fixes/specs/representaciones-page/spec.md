# representaciones-page Specification

## MODIFIED Requirements

### Requirement: Hero section renders the editorial headline with highlighted phrase

La sección hero SHALL renderizar, sobre un fondo `bg-secondary` (navy de marca), un eyebrow "ALIANZAS GLOBALES DE ALTA PRECISIÓN", un `<h1>` "Alianzas Estratégicas y Representación Exclusiva" con la subfrase "Representación Exclusiva" envuelta en un `<span>` con `text-primary`, y un párrafo de introducción. La sección SHALL ser responsive (columna en mobile, layout de 12 columnas desde `lg`). El `<h1>` SHALL escalar su tamaño por breakpoint (base reducida en móvil, escalando hasta el tamaño de desktop) y SHALL aplicar una estrategia de quiebre de palabra (`break-words` o equivalente) de modo que la frase "Representación Exclusiva" nunca desborde el ancho de su columna. (MODIFIED en `responsive-web-design-fixes` — escala responsiva y prevention de desborde.)

#### Scenario: Eyebrow and headline rendered

- **WHEN** la página se renderiza
- **THEN** el texto "ALIANZAS GLOBALES DE ALTA PRECISIÓN" está presente
- **AND** un `<h1>` contiene "Alianzas Estratégicas y Representación Exclusiva"
- **AND** la subfrase "Representación Exclusiva" está envuelta en un `<span>` con `text-primary`

#### Scenario: Hero uses the brand navy surface

- **WHEN** el hero se renderiza
- **THEN** el contenedor de la sección hero lleva la clase `bg-secondary`

#### Scenario: Introductory paragraph rendered

- **WHEN** el hero se renderiza
- **THEN** se renderiza el párrafo "Conectando a la minería, industria química y empresas sanitarias de Chile con la manufactura metrológica más avanzada de Europa, Japón y América. Transferencia tecnológica directa sin intermediarios."

#### Scenario: El titular del hero no desborda

- **WHEN** la página `/representaciones` se renderiza en los viewports `320×568` y `375×667`
- **THEN** el `boundingBox` del `<h1>` del hero queda dentro del ancho del viewport
- **AND** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`
- **AND** el texto "Representación Exclusiva" es visible completo

### Requirement: Page is responsive (mobile-first)

La página SHALL ser mobile-first: las tarjetas de marca SHALL apilar panel de wordmark y contenido en mobile y ponerse en fila desde `md`; la sección de distribuidores SHALL apilarse en mobile y usar dos columnas desde `lg`; la sección de pillars SHALL usar una columna en mobile y cuatro columnas desde `lg`. Los encabezados de las secciones SHALL escalar su tamaño por breakpoint (por ejemplo `text-2xl md:text-3xl`) y aplicar quiebre de palabra, de modo que ningún encabezado desborde el ancho de su contenedor en viewports estrechos. (MODIFIED in `responsive-web-design-fixes` — prevention de desborde en los encabezados de sección.)

#### Scenario: Brand cards stack on mobile and row on md+

- **WHEN** la tarjeta de marca se renderiza con los puntos de quiebre de Tailwind
- **THEN** la disposición base es en columna (`flex-col`)
- **AND** a partir de `md` pasa a fila (`md:flex-row`)

#### Scenario: Distributors and pillars reflow in a grid

- **WHEN** las secciones de distribuidores y de pillars se renderizan
- **THEN** la grilla de distribuidores es de una columna en mobile y `lg:grid-cols-2`
- **AND** la grilla de pillars es de una columna en mobile y `lg:grid-cols-4`

#### Scenario: El heading de marcas no desborda

- **WHEN** la sección "Marcas de Representación Exclusiva" se renderiza en el viewport `320×568`
- **THEN** el `boundingBox` de su `<h2>` queda dentro del ancho del viewport
- **AND** el texto "Marcas de Representación Exclusiva" es visible completo
