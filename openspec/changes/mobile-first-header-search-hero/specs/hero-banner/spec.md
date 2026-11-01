## MODIFIED Requirements

### Requirement: HeroBanner renders two CTA buttons with primary and secondary variants

The `hero-banner` SHALL render one `<a>` per element of the `ctas` prop, where the element with `variant: 'primary'` carries the `bg-primary` background token (resolving to `#41B3C4`) and the element with `variant: 'secondary'` carries a white border with no fill. Ambos CTAs SHALL aplicar la heading font via `font-heading` (Montserrat) con peso `font-semibold` (600), `text-xs` size y `uppercase tracking-wide` per la escala tipográfica canónica. En móvil (`< 640px`) cada CTA SHALL ocupar exactamente el 50% del ancho disponible de su contenedor (`w-1/2`), apilados verticalmente y alineados a la izquierda; desde `sm` (≥ 640px) cada CTA SHALL recuperar ancho automático (`sm:w-auto`) y la fila horizontal existente. Los CTAs SHALL NOT aplicar `rounded` (flat design con radio 0). Los obsolete utilities `bg-brand-teal` y referencias a `--color-brand-teal` SHALL NOT aparecer en ningún CTA.

#### Scenario: Primary CTA uses bg-primary

- **WHEN** el HeroBanner renders a primary-variant CTA
- **THEN** el `<a>` element lleva `bg-primary` (resolviendo a `#41B3C4`)
- **AND** su string de clase contiene `font-heading` y `font-semibold`
- **AND** su string de clase no contiene `rounded` (ni `rounded-*`)
- **AND** su string de clase no contiene `bg-brand-teal`

#### Scenario: Secondary CTA keeps white border

- **WHEN** el HeroBanner renders a secondary-variant CTA
- **THEN** el `<a>` elemento tiene un borde blanco (`border-2 border-white`) sin relleno
- **AND** el CTA es keyboard focusable
- **AND** su string de clase no contiene `rounded` (ni `rounded-*`)

#### Scenario: CTA container stacks on mobile and rows on sm+

- **WHEN** el HeroBanner se renderiza
- **THEN** el contenedor de CTAs lleva `flex-col sm:flex-row`
- **AND** en móvil cada CTA ocupa el 50% del ancho con alineación izquierda
- **AND** desde `sm` los CTAs quedan lado a lado

#### Scenario: Mobile CTAs occupy exactly 50% and align left

- **WHEN** el HeroBanner se renderiza en un viewport `< 640px`
- **THEN** cada CTA lleva `w-1/2`
- **AND** el ancho renderizado de cada CTA es igual al 50% del ancho del contenedor de CTAs (±1px)
- **AND** ambos CTAs comparten el borde izquierdo con el contenedor (alineados a la izquierda)
- **AND** el segundo CTA se ubica debajo del primero

#### Scenario: From sm the CTAs restore automatic width

- **WHEN** el HeroBanner se renderiza en un viewport `>= 640px`
- **THEN** cada CTA lleva `sm:w-auto`
- **AND** los CTAs se ubican lado a lado en una fila horizontal

### Requirement: HeroBanner layout is responsive across viewports

El `hero-banner` SHALL escalar su tipografía y espaciado según el viewport: más pequeño en móvil (< 768px) y más grande en escritorio (>= 768px), con el contenedor de CTAs conmutando entre disposiciones apiladas y en línea en el breakpoint `sm`. En móvil (`< 640px`) el contenedor de CTAs SHALL apilar los botones horizontalmente alineados a la izquierda, y cada botón SHALL ocupar el 50% del ancho del contenedor; desde `sm` SHALL pasar a `flex-row` con ancho automático. El wrapper de contenido dentro de la sección SHALL usar padding vertical asimétrico: un relleno superior reducido en móvil/tablet (`pt-4` móvil, `md:pt-8`) para que el título, subtítulo y CTAs se sitúen más alto y permanezcan visibles en el viewport inicial, un mayor relleno superior en desktop (`lg:pt-24`) que baja el bloque de contenido dentro del banner de altura completa, y un relleno inferior preservado (`pb-16` móvil, `md:pb-24`, `lg:pb-32`) que mantiene el espaciado antes del PanelHome que se superpone.

#### Scenario: Mobile uses small typography and stacked CTAs

- **WHEN** el HeroBanner se renderiza en un viewport `< 640px`
- **THEN** el `<h1>` lleva una clase que restringe su tamaño a un tamaño base móvil menor que `text-5xl` (ej. `text-3xl` o `text-4xl`)
- **AND** el contenedor de CTAs usa `flex-col` con `items-start`
- **AND** cada CTA ocupa el 50% del ancho del contenedor y queda alineado a la izquierda
- **AND** los CTAs no desbordan el ancho del contenedor ni provocan scroll horizontal a 320px

#### Scenario: Desktop uses large typography and inline CTAs

- **WHEN** el HeroBanner se renderiza en un viewport `>= 640px`
- **THEN** el contenedor de CTAs usa `sm:flex-row`
- **AND** cada CTA lleva `sm:w-auto`
- **AND** los CTAs quedan lado a lado

#### Scenario: Section content box uses asymmetric vertical padding with reduced top

- **WHEN** el HeroBanner se renderiza
- **THEN** el wrapper de contenido dentro de la sección lleva `pt-4` (relleno superior reducido en móvil)
- **AND** el wrapper lleva `md:pt-8` y `lg:pt-24`
- **AND** el wrapper lleva `pb-16` (relleno inferior en móvil)
- **AND** el wrapper lleva `md:pb-24` y `lg:pb-32`
- **AND** el wrapper no lleva una utilidad simétrica `py-*` (el padding se divide en `pt-*`/`pb-*`)
