# hero-banner Specification

## Purpose
Sección hero del home del sitio público Astro. Componente presentacional (dumb) que renderiza headline + palabra destacada, subtítulo, descripción y dos CTAs (primario teal + secundario outline blanco). No incluye imagen de fondo ni overlay: el fondo y la cobertura full-viewport los aporta el shell hero del Layout (capability `home-hero-shell`), que envuelve imagen `bg-secondary/80` detrás de los headers transparentes. Layout responsivo (mobile stacked, desktop horizontal). Headline único `<h1>` de la home, subtítulo `<h2>` subordinado.

## Requirements

### Requirement: HeroBanner renders the headline with the highlighted word in a distinct color
The `hero-banner` SHALL render an `<h1>` whose visible text equals `headline` followed by `highlightedWord`, where `highlightedWord` is wrapped in a `<span>` carrying the `text-primary` class (resolving to `--color-primary` `#41B3C4`) so it visually stands out from the rest of the headline. The `<h1>` SHALL apply the heading font via `font-heading` (Montserrat) con peso `font-bold` (700) según la escala tipográfica canónica. The obsolete utility `text-brand-teal` and references to `--color-brand-teal` SHALL NOT appear. The component SHALL NOT render any background `<picture>`/image or overlay; the application shell provides all backgrounds.

#### Scenario: Highlighted word uses primary token
- **WHEN** the HeroBanner renders with headline "Innovación que Fluye" and highlightedWord "Fluye"
- **THEN** the `<h1>` contains a `<span>` element wrapping "Fluye"
- **AND** that `<span>` carries the `text-primary` class (resolving to `#41B3C4`)
- **AND** the `<h1>` carries `font-heading` and `font-bold` classes (Montserrat 700)
- **AND** the rendered HTML does NOT contain the class `text-brand-teal`
- **AND** the rendered HTML does NOT contain a `<picture>` element

### Requirement: HeroBanner renders subtitle and description in subordinate headings and paragraphs
The `hero-banner` SHALL render `subtitle` as an `<h2>` directly subordinate to the `<h1>`, with a constrained maximum width, applying la heading font via `font-heading` (Montserrat) con peso `font-semibold` (600). `description` SHALL render as a `<p>` with reduced opacity (Open Sans body implícito, `font-body` heredado), both inside the same `<section>` as the headline. Neither SHALL introduce a new background layer.

#### Scenario: Subtitle renders as h2 with constrained width
- **WHEN** the HeroBanner renders with `subtitle="Experiencia, tecnología y control en medición de fluidos y tratamientos de agua."`
- **THEN** an `<h2>` element is rendered containing the subtitle text verbatim
- **AND** the `<h2>` carries `font-heading` and `font-semibold` classes (Montserrat 600)
- **AND** the `<h2>` carries a class that constrains its max width (e.g. `max-w-3xl`) so it does not span the full row on desktop

#### Scenario: Description renders as a paragraph with reduced opacity
- **WHEN** the HeroBanner renders with `description="Desarrollamos soluciones..."`
- **THEN** a `<p>` element is rendered containing the description text verbatim
- **AND** the `<p>` carries a class expressing reduced opacity relative to the subtitle (e.g. `text-white/80`)
- **AND** the `<p>` carries a class constraining its max width (e.g. `max-w-2xl`)

### Requirement: HeroBanner renders two CTA buttons with primary and secondary variants
The `hero-banner` SHALL render one `<a>` per element of the `ctas` prop, where the element with `variant: 'primary'` carries the `bg-primary` background token (resolving to `#41B3C4`) and the element with `variant: 'secondary'` carries a white border with no fill. Ambos CTAs SHALL aplicar la heading font via `font-heading` (Montserrat) con peso `font-semibold` (600), `text-xs` size y `uppercase tracking-wide` per la escala tipográfica canónica. Los CTAs SHALL NOT aplicar `rounded` (flat design con radio 0). Los obsolete utilities `bg-brand-teal` y referencias a `--color-brand-teal` SHALL NOT aparecer en ningún CTA.

#### Scenario: Primary CTA uses bg-primary
- **WHEN** the HeroBanner renders a primary-variant CTA
- **THEN** the `<a>` element lleva `bg-primary` (resolviendo a `#41B3C4`)
- **AND** su string de clase contiene `font-heading` y `font-semibold`
- **AND** su string de clase no contiene `rounded` (ni `rounded-*`)
- **AND** su string de clase no contiene `bg-brand-teal`

#### Scenario: Secondary CTA keeps white border
- **WHEN** the HeroBanner renders a secondary-variant CTA
- **THEN** el `<a>` elemento tiene un borde blanco (`border-2 border-white`) sin relleno
- **AND** el CTA es keyboard focusable
- **AND** su string de clase no contiene `rounded` (ni `rounded-*`)

#### Scenario: CTA container stacks on mobile and rows on sm+
- **WHEN** the HeroBanner renders
- **THEN** el contenedor de CTAs lleva `flex-col sm:flex-row`

### Requirement: HeroBanner layout is responsive across viewports
El `hero-banner` SHALL escalar su tipografía y espaciado según el viewport: más pequeño en móvil (< 768px) y más grande en escritorio (>= 768px), con el contenedor de CTAs conmutando entre disposiciones apiladas y en línea en el breakpoint `sm`. El wrappers de contenido dentro de la sección SHALL usar padding vertical assimétrico: un relleno superior reducido en móvil/tablet (`pt-4` móvil, `md:pt-8`) para que el título, subtítulo y CTAs se sitúen más alto y permanezcan visibles en el viewport inicial, un mayor relleno superior en desktop (`lg:pt-24`) que baja el bloque de contenido dentro del banner de altura completa según la revisión final del cliente, y un relleno inferior preservado (`pb-16` móvil, `md:pb-24`, `lg:pb-32`) que mantiene el espaciado antes del PanelHome que se superpone.

#### Scenario: Mobile uses small typography and stacked CTAs
- **WHEN** el HeroBanner se renderiza en un viewport < 768px
- ****** THEN** el `<h1>` lleva una clase que restringe su tamaño a un tamaño base móvil menor que `text-5xl` (ej. `text-3xl` o `text-4xl`)
- **AND** el contenedor de CTAs usa `flex-col` layout para que cada CTA ocupe una fila completa

#### Scenario: Desktop uses large typography and inline CTAs
- **WHEN** el HeroBanner se renderiza en un viewport >= 768px
- **THEN** el `<h1>` lleva una clase responsive que escala hasta `md:text-7xl`
- **AND** el contenedor de CTAs usa `sm:flex-row` layout para que los CTAs queden lado a lado

#### Scenario: Section content box uses asymmetric vertical padding with reduced top
- **WHEN** el HeroBanner se renderiza
- **THEN** el wrappers de contenido dentro de la sección lleva `pt-4` (relleno superior reducido en móvil)
- **AND** el wrappers lleva `md:pt-8` y `lg:pt-24` (relleno superior reducido en móvil/tablet, mayor top en desktop bajando el contenido)
- **AND** el wrappers lleva `pb-16` (relleno inferior en móvil)
- **AND** el wrappers lleva `md:pb-24` y `lg:pb-32` (escalando el padding inferior hacia arriba en viewports más grandes)
- **AND** el wrappers no lleva un utilidad symmetric `py-*` (el padding se divide en `pt-*`/`pb-*`)

### Requirement: HeroBanner has no built-in background image or overlay
El `hero-banner` SHALL NOT render un `<picture>`, overlay `div` o cualquier imagen import. Donde el home necesita un fondo, la aplicación shell (capability `home-hero-shell`) lo proporciona.

#### Scenario: No picture element rendered
- **WHEN** el HeroBanner se renderiza
- **THEN** el HTML renderizado no contiene una etiqueta `<picture>`
- **AND** no contiene `bg-secondary/60` ni `bg-secondary/80` en ninguna clase

### Requirement: HeroBanner is keyboard and screen-reader accessible
El `hero-banner` SHALL usar HTML semántico para ser operable con el teclado y consumible por lectores de pantalla: un solo `<h1>` para la página, `<h2>` subordinado, y CTAs focusables en el orden del DOM. El fondo imagery y su overlay decorativo están a cargo de la aplicación shell (`home-hero-shell`), no por este componente.

#### Scenario: Exactly one h1 on the page
- **WHEN** la página home se renderiza con el HeroBanner
- **THEN** el documento contiene exactamente un elemento `<h1>` (el headline del hero)
- **AND** el subtítulo del hero se renderiza como `<h2>` (no como otro `<h1>`)

#### Scenario: CTAs are keyboard-focusable anchors
- **WHEN** el HeroBanner se renderiza
- **THEN** cada CTA es un elemento `<a href="...">` (focusable por defecto)
- **AND** la navegación Tab pasa por los CTAs en el orden del DOM
- **AND** los CTAs no llevan `tabindex="-1"` ni `aria-hidden="true"`

#### Scenario: No background imagery inside the hero component
- **WHEN** el HeroBanner se renderiza
- **THEN** el componente no renderiza `<picture>`, no `<img>`, y no overlay `<div>`
- **AND** no se introduce elemento `aria-hidden` overlay por la sección hero

### Requirement: HeroBanner content is configured via a hardcoded constant
El contenido del `hero-banner` SHALL venir del constante `HERO_BANNER_CONTENT` en `lib/config/hero-banner.ts`, exportado como `Readonly<HeroBannerProps>`, con exactamente dos CTAs (uno primary y uno secundario).

#### Scenario: HERO_BANNER_CONTENT exposa el conjunto completo de props
- **WHEN** `HERO_BANNER_CONTENT` se importa
- **THEN** tiene la forma `{ headline: string; highlightedWord: string; subtitle: string; description: string; ctas: readonly HeroCta[] }`
- **AND** `headline` y `highlightedWord` son cadenas no vacías
- **AND** `headline` contiene `highlightedWord` como substring O `highlightedWord` está vacío (caso borde manejado por `splitHeadline`)

#### Scenario: HERO_BANNER_CONTENT.ctas tiene exactamente dos CTAs (primary + secondary)
- **WHEN** `HERO_BANNER_CONTENT.ctas` se inspecciona
- **THEN** tiene longitud `2`
- **AND** el primer elemento tiene `variant: "primary"` (renderizado como `VER SERVICIOS` con `href: "/servicios"`)
- **AND** el segundo elemento tiene `variant: "secondary"` (renderizado como `ESCRÍBENOS` con `href: "/contacto"`)

#### Scenario: splitHeadline splitta el headline en la primera ocurrencia de la palabra destacada
- **WHEN** `splitHeadline("Innovación que Fluye", "Fluye")` se llama
- **THEN** devuelve `["Innovación que ", ""]` de modo que la parte antes va plain y la palabra destacada se envuelve, sin texto sobrante ya que "Fluye" aparece al final

#### Scenario: splitHeadline devuelve el headline original cuando la palabra destacada está ausente
- **WHEN** `splitHeadline("Bienvenido", "Fluye")` se llama
- **THEN** devuelve `["Bienvenido", ""]` de modo que el componente renderiza el headline plain sin span destacado

#### Scenario: splitHeadline destaca solo la primera ocurrencia cuando la palabra aparece múltiples veces
- **WHEN** `splitHeadline("Fluye y vuelve a Fluye", "Fluye")` se llama
- **THEN** devuelve `["", " y vuelve a Fluye"]` de modo que solo la primera "Fluye" se renderiza en el span destacado

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

### Requirement: HeroBanner integrates into the home page replacing the placeholder content
La home page SHALL render `<HeroBanner {...HERO_BANNER_CONTENT} />` dentro de su shell Layout (ver `home-hero-shell`), reemplazando cualquier `<h1>` o `<p>` placeholder preexistente de la fase de bootstrap.

#### Scenario: Home page renders the HeroBanner con headers arriba
- **WHEN** un visitante carga `/` (la página home)
- **THEN** el HTML renderizado contiene un `<section>` (el hero) envueltos el headline configurado, subtítulo y CTAs
- **AND** el orden DOM es: hero shell (con overlay `bg-secondary/80`), `<header>` (del site-header), SearchForm `<div role="search">`, luego el bloque `<h1>` del hero
- **AND** no bar de contacto anterior precede al header
- **AND** existe exactamente un elemento `<header>` en el documento
- **AND** el texto placeholder legado "Proyecto en desarrollo — Fase A: Bootstrap completado" no está presente