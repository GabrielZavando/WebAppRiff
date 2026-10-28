# hero-banner Specification

## MODIFIED Requirements

### Requirement: HeroBanner layout is responsive across viewports
The `hero-banner` SHALL scale its typography and spacing based on the viewport: smaller on mobile (< 768px) and larger on desktop (>= 768px), with the CTA container switching between stacked and inline layouts at the `sm` breakpoint. The `<h1>` SHALL use a fluid responsive scale — a small base size on mobile (e.g. `text-3xl`/`text-4xl`), an intermediate step from `sm` and the large size from `md` (`md:text-7xl`) — and SHALL NOT keep a fixed 48px (`text-5xl`) size across all mobile widths. The `<h1>` SHALL apply a word-breaking utility (`break-words` or equivalent) so that long words never force horizontal overflow. The content wrapper inside the section SHALL use asymmetric responsive vertical padding: a reduced top padding on mobile/tablet (`pt-4` mobile, `md:pt-8`) so the title, subtitle and CTAs sit higher and remain visible in the initial viewport, a larger desktop top padding (`lg:pt-24`) that lowers the content block within the full-height banner per the client's final review, and a preserved bottom padding (`pb-16` mobile, `md:pb-24`, `lg:pb-32`) that maintains spacing before the overlapping PanelHome. (MODIFIED in `responsive-web-design-fixes` — la escala tipográfica del `<h1>` pasa a ser responsiva y con quiebre de palabra para eliminar el scroll horizontal a 320–375px.)

#### Scenario: Mobile uses small typography and stacked CTAs
- **WHEN** the HeroBanner renders on a viewport < 768px
- **THEN** the `<h1>` carries a class constraining its size to a mobile base size smaller than `text-5xl` (e.g. `text-3xl` or `text-4xl`)
- **AND** the CTA container uses `flex-col` layout so each CTA occupies a full row

#### Scenario: Desktop uses large typography and inline CTAs
- **WHEN** the HeroBanner renders on a viewport >= 768px
- **THEN** the `<h1>` carries a responsive class scaling up to `md:text-7xl`
- **AND** the CTA container uses `sm:flex-row` layout so the CTAs sit side by side

#### Scenario: Section content box uses asymmetric vertical padding with reduced top
- **WHEN** the HeroBanner renders
- **THEN** the content wrapper inside the section carries `pt-4` (reduced top padding on mobile)
- **AND** the wrapper carries `md:pt-8` and `lg:pt-24` (reduced top on mobile/tablet, larger top on desktop lowering the content)
- **AND** the wrapper carries `pb-16` (bottom padding on mobile)
- **AND** the wrapper carries `md:pb-24` and `lg:pb-32` (scaling bottom padding up on larger viewports)
- **AND** the wrapper does NOT carry a symmetric `py-*` utility (padding is split into `pt-*`/`pb-*`)

#### Scenario: El titular no desborda en viewports estrechos
- **WHEN** el HeroBanner se renderiza en los viewports `320×568` y `375×667`
- **THEN** el `boundingBox` del `<h1>` queda dentro del ancho del viewport
- **AND** el `<h1>` aplica `break-words` (o equivalente) para palabras indivisibles

## ADDED Requirements

### Requirement: HeroBanner headline never produces horizontal overflow

El `<h1>` del hero SHALL permanecer contenido dentro del ancho del viewport en todos los anchos soportados, con un tamaño de fuente computado que no supere el ancho disponible para el texto configurado (`"Innovación que Fluye"` + palabra destacada). El tamaño computado del `<h1>` SHALL escalar de forma monótona al aumentar el viewport, de menor a mayor.

#### Scenario: Tamaño computado escala con el viewport

- **WHEN** se mide el `font-size` computado del `<h1>` del home en los viewports `320×568`, `375×667`, `768×1024` y `1280×800`
- **THEN** el valor en `320×568` es estrictamente menor que el valor en `375×667`
- **AND** el valor en `375×667` es menor o igual que el valor en `768×1024`
- **AND** el valor en `768×1024` es menor o igual que el valor en `1280×800`

#### Scenario: Sin scroll horizontal en la home móvil

- **WHEN** se carga `/` en el viewport `320×568`
- **THEN** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`
- **AND** el `<h1>` del hero no es el elemento que provoca el desborde
