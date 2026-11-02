## MODIFIED Requirements

### Requirement: HeroBanner renders two CTA buttons with primary and secondary variants

The `hero-banner` SHALL render one `<a>` per element of the `ctas` prop, where the element with `variant: 'primary'` carries the `bg-primary` background token (resolving to `#41B3C4`) and white text, and the element with `variant: 'secondary'` carries a solid white fill (`bg-white`) with the navy secondary text token (`text-secondary`) and a `border-2 border-white` white border, so it remains visible over both light and dark hero imagery. The secondary CTA SHALL switch to `hover:bg-secondary` with `hover:text-white` on hover. Ambos CTAs SHALL aplicar la heading font via `font-heading` (Montserrat) con peso `font-semibold` (600), `text-xs` size y `uppercase tracking-wide` per la escala tipográfica canónica. En móvil (`< 640px`) cada CTA SHALL ocupar exactamente el 50% del ancho disponible de su contenedor (`w-1/2`), apilados verticalmente y alineados a la izquierda; desde `sm` (≥ 640px) cada CTA SHALL recuperar ancho automático (`sm:w-auto`) y la fila horizontal existente. Los CTAs SHALL NOT aplicar `rounded` (flat design con radio 0). Los obsolete utilities `bg-brand-teal` y referencias a `--color-brand-teal` SHALL NOT aparecer en ningún CTA.

#### Scenario: Primary CTA uses bg-primary

- **WHEN** el HeroBanner renders a primary-variant CTA
- **THEN** el `<a>` element lleva `bg-primary` (resolviendo a `#41B3C4`)
- **AND** su string de clase contiene `font-heading` y `font-semibold`
- **AND** su string de clase no contiene `rounded` (ni `rounded-*`)
- **AND** su string de clase no contiene `bg-brand-teal`

#### Scenario: Secondary CTA keeps white border

- **WHEN** el HeroBanner renders a secondary-variant CTA
- **THEN** el `<a>` elemento lleva `bg-white`, `text-secondary` y `border-2 border-white`
- **AND** el CTA es keyboard focusable
- **AND** su string de clase incluye `hover:bg-secondary` y `hover:text-white`
- **AND** su string de clase no contiene `rounded` (ni `rounded-*`)

#### Scenario: Secondary CTA stays readable over light hero imagery

- **WHEN** el CTA "ESCRÍBENOS" se renderiza sobre la imagen clara del hero en el viewport `640×800`
- **THEN** el color de fondo computado del CTA es blanco (`rgb(255, 255, 255)`)
- **AND** el color de texto computado corresponde al token `--color-secondary` (`rgb(31, 45, 64)`)
- **AND** el borde computado es blanco y de 2px
- **AND** el contraste entre texto y fondo cumple WCAG AA para texto normal

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
- **AND** el borde derecho de cada CTA queda dentro del contenedor del hero

### Requirement: HeroBanner layout is responsive across viewports

El `hero-banner` SHALL escalar su tipografía y espaciado según el viewport: más pequeño en móvil (< 768px) y más grande en escritorio (>= 768px), con el contenedor de CTAs conmutando entre disposiciones apiladas y en línea en el breakpoint `sm`. En móvil (`< 640px`) el contenedor de CTAs SHALL apilar los botones horizontalmente alineados a la izquierda, y cada botón SHALL ocupar el 50% del ancho del contenedor; desde `sm` SHALL pasar a `flex-row` con ancho automático. El wrapper de contenido dentro de la sección SHALL usar padding vertical asimétrico: un relleno superior reducido en móvil/tablet (`pt-4` móvil, `md:pt-8`) para que el título, subtítulo y CTAs se sitúen más alto y permanezcan visibles en el viewport inicial, un mayor relleno superior en desktop (`lg:pt-24`) que baja el bloque de contenido dentro del banner de altura completa, y un relleno inferior preservado (`pb-16` móvil, `md:pb-24`, `lg:pb-32`) que mantiene el espaciado antes del PanelHome que se superpone. Desde `sm` el wrapper SHALL reservar además un relleno derecho (`sm:pr-24`) que mantiene el texto fuera de la columna de botones flotantes (WhatsApp y teléfono) y un relleno inferior ampliado (`sm:pb-32`) para que ningún texto ni CTA quede tapado por esos botones en el viewport `640×800` ni en `640×360`.

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
- **AND** el wrapper lleva `sm:pb-32`, `md:pb-24` y `lg:pb-32`
- **AND** el wrapper lleva `sm:pr-24`
- **AND** el wrapper no lleva una utilidad simétrica `py-*` (el padding se divide en `pt-*`/`pb-*`)

#### Scenario: Floating contact buttons do not cover hero content at sm

- **WHEN** la home se carga en el viewport `640×800` y en `640×360`
- **THEN** el texto del `h1`, el subtítulo, la descripción y los CTAs quedan fuera del área ocupada por los botones flotantes `.whatsapp-fab` y `.phone-fab`
- **AND** ningún elemento de texto del hero queda debajo de esos botones flotantes
- **AND** la página no provoca scroll horizontal
