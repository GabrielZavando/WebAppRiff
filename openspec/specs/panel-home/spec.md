# panel-home Specification

## Purpose
The `panel-home` is the teal + white about/trust panel that sits below the home `HeroBanner` on the home page. Its left half carries a teal background with an eyebrow, headline, description and a navy CTA pointing to `/contacto`. Its right half carries a 2×2 grid of four statistics (`40+`, `30.000+`, `5+`, `9+`) over a white background, adorned with a decorative `+` divider formed by the primary colour through CSS Grid `gap-px`. The stats count up from 0 to their target values on first visibility (respecting `prefers-reduced-motion`). The whole card sits with an elevation shadow (`--shadow-scroll-shell`) — the documented flat-design exception.

## Requirements

### Requirement: PanelHome renders the left half with eyebrow, headline, description and a navy CTA over a teal background
The `panel-home` SHALL render its left half as a `<div>` (or equivalent) carrying the `bg-primary` class (resolving to `--color-primary` `#41B3C4`), containing un eyebrow `<span>` (uppercase, not a heading) que aplica la heading font via `font-heading` (Montserrat) con peso `font-semibold` y size `text-xs tracking-wider`, a headline `<h2>` que aplica `font-heading font-bold`, a description `<p>` (Open Sans body implícita), and a single CTA `<a href="/contacto">` styled con `bg-secondary text-white font-heading font-semibold` (Montserrat 600, `text-xs uppercase tracking-wide`). The CTA SHALL NOT apply `rounded` (flat design con radio 0). La eyebrow SHALL NOT ser renderizada como un elemento heading (`<h1>`–`<h6>`). Los obsolete utilities `bg-brand-teal` y `bg-brand-navy`, y referencias a `--color-brand-teal` / `--color-brand-navy`, SHALL NOT aparecer en ningún lugar del panel.

#### Scenario: Left half uses primary (not brand-teal)
- **WHEN** el PanelHome se renderiza
- **THEN** la mitad izquierda `<div>` lleva `bg-primary` (computando a `rgb(65, 179, 196)`)
- **AND** su string de clase no contiene `bg-brand-teal`

#### Scenario: CTA uses secondary, flat square corners
- **WHEN** el PanelHome renderiza el CTA de `/contacto`
- **THEN** el CTA `<a>` lleva `bg-secondary text-white` (computando a `rgb(31, 45, 64)`)
- **AND** el CTA `<a>` lleva `font-heading` y `font-semibold` clases (Montserrat 600)
- **AND** el CTA `<a>` no contiene `rounded` (ni ningún `rounded-*` variante) en su string de clase
- **AND** su string de clase no contiene `bg-brand-navy`

#### Scenario: Eyebrow and headline use heading font
- **WHEN** el PanelHome renderiza la mitad izquierda
- **THEN** el eyebrow `<span>` lleva `font-heading` y `font-semibold` clases
- **AND** el headline `<h2>` lleva `font-heading` y `font-bold` clases

### Requirement: PanelHome renders the right half with a 2×2 grid of four statistics over a white background
El `panel-home` SHALL render su mitad derecha como un `<div>` (o equivalente) que lleva la clase `bg-white`, que contiene exactamente cuatro celdas de estadística dispuestas en un `grid-cols-2` grid (2 filas × 2 columnas). Cada celda de estadística SHALL renderizar el `value` como un párrafo grande y en negrita con la heading font via `font-heading font-bold` (Montserrat 700) y class `text-secondary` (en lugar del obsoleto `text-brand-navy`), y el `label` como un párrafo pequeño en mayúsculas debajo de él que aplica la body font implícita (`font-body`, Open Sans) y el token `text-text-2` (#5C6675) en lugar de la paleta por defecto Tailwind `text-gray-*`. El grid SHALL mantener `grid-cols-2` en todos los viewports (móvil y escritorio).

#### Scenario: Stat value uses secondary and heading font
- **WHEN** el PanelHome renderiza una celda de estadística
- **THEN** el párrafo de valor lleva `text-secondary` (resolviendo a `#1F2D40`)
- **AND** el párrafo de valor lleva `font-heading` y `font-bold` clases (Montserrat 700)
- **AND** su string de clase no contiene `text-brand-navy`

#### Scenario: Stat label uses text-text-2 (no gray-*)
- **WHEN** el PanelHome renderiza una celda de estadística
- **THEN** el párrafo de label lleva la clase `text-text-2` (resolviendo a `#5C6675`)
- **AND** el párrafo de label no contiene `text-gray-600`, `text-gray-700` ni ningún `text-gray-*` literal en su string de clase

### Requirement: El valor más largo queda dentro de su celda
El `panel-home` SHALL garantizar que el valor de estadística configurado más largo (`30.000+`) quede totalmente contenido dentro de su celda en los viewports `320×568` y `375×667`, sin desbordarse ni recortarse. Se aplican `min-w-0` en el wrapper de la celda y `break-words` en el texto del valor para lograrlo.

#### Scenario: Valor más largo queda dentro de la celda en viewport estrecho
- **WHEN** el PanelHome se renderiza en el viewport `320×568` o `375×667`
- **THEN** el `boundingBox` del párrafo de valor `30.000+` queda dentro del `boundingBox` de su celda
- **AND** el texto `30.000+` es visible completo (no recortado ni desbordado)

#### Scenario: Padding y tamaño de fuente adaptados al viewport
- **WHEN** se inspecciona el source de `PanelHome.astro`
- **THEN** la celda de estadística declara un padding horizontal menor en la base (móvil) que en `md:` (por ejemplo `p-4 md:p-8 md:lg:p-12`)
- **AND** el padding de la mitad derecha NO mantiene `p-8 md:p-12` como único valor en móvil

### Requirement: PanelHome reduces its inner padding on desktop
El `panel-home` izquierda (`<div>` que lleva `bg-primary`) SHALL usar un relleno interior reducido en desktop: `lg:p-12` (48px) en lugar del `lg:p-16` (64px) usado anteriormente, para que el panel lea más apretado en pantallas grandes. El padding móvil/tablet (`p-8 md:p-12`) se mantiene sin cambios para la mitad izquierda. La mitad derecha SHALL usar un padding responsivo que mantenga los valores de estadística contenidos en viewports estrechos (ej. `p-4 md:p-8 lg:p-12`) en lugar del `p-8 md:p-12` fijo anterior.

#### Scenario: Left half uses reduced desktop padding lg:p-12
- **WHEN** el PanelHome renderiza la izquierda (`bg-primary`)
- **THEN** la mitad izquierda `<div>` lleva `lg:p-12`
- **AND** la mitad izquierda `<div>` no lleva `lg:p-16`

#### Scenario: Right half uses responsive padding
- **WHEN** el PanelHome renderiza la mitad derecha (`bg-white`)
- **THEN** sus celdas de estadística declaran un padding base menor que el aplicado en `md:`/`lg:`
- **AND** el padding en `lg:` se mantiene en `p-12` para conservar la densidad desktop

### Requirement: PanelHome stat values scale down on narrow viewports
El tamaño de fuente computado del valor de cada estadística SHALL adaptarse al ancho disponible: el valor SHALL usar un tamaño base reducido en móvil y escalar hacia arriba en `md:`. La celda SHALL impedir además el desborde horizontal mediante `min-w-0` y/o quiebre de palabra sobre el texto del valor.

#### Scenario: Escala tipográfica del valor
- **WHEN** se mide el `font-size` computado del valor `30.000+` en los viewports `320×568`, `375×667` y `1280×800`
- **THEN** el valor en `320×568` es menor que el valor en `1280×800`
- **AND** el valor en `375×667` es menor o igual que el valor en `1280×800`

#### Scenario: La celda no impone un ancho mínimo
- **WHEN** se renderiza el PanelHome en el viewport `320×568`
- **THEN** la celda de estadística no declara un `min-width` superior al ancho disponible de su columna
- **AND** la celda sigue siendo visible y con el texto completo

### Requirement: PanelHome meets WCAG AA contrast between white text and the teal background
El `panel-home` SHALL cumplir los requisitos de contraste WCAG AA entre el texto blanco (`#FFFFFF`) y el fondo teal de la mitad izquierda (ahora `--color-primary` `#41B3C4`):

- El headline `<h2>` (negrita, fontsize ≥ 18pt) SHALL cumplir WCAG AA Large (razón de contraste ≥ 3:1) contra el fondo teal.
- El description `<p>` SHALL cumplir WCAG AA Normal (razón de contraste ≥ 4.5:1) contra el fondo teal. La opacity PUEDE ajustarse (ej. `text-white/90` o solid `text-white`) para cumplir el umbral, O — si el token primario `#41B3C4` no puede cumplir AA Normal ni con texto blanco sólido — el fondo de la mitad izquierda SHALL retroceder a `--color-primary-darker` (`#227E8E`, razón ≈ 3.95:1 a blanco) solo cuando el AA Large sea requerido para texto body.

El `test.skip()` llamado en `apps/web/e2e/panel-home.spec.ts` para tasks 4.13 y 4.14 del change archivado SHALL borrarse; las pruebas correspondientes SHALL pasar con los nuevos tokens.

#### Scenario: h2 white text meets WCAG AA Large on teal background
- **WHEN** la prueba E2E 4.13 se ejecuta contra el PanelHome renderizado
- **THEN** el `color` computado (esperado `rgb(255, 255, 255)`) y `background-color` (esperado que se resuelva de `--color-primary` `#41B3C4`) del `<h2>` se lean mediante `getComputedStyle`
- **AND** la razón de contraste WCAG entre ellos es ≥ 3.0
- **AND** la prueba se ejecuta (no `test.skip()`ed)

#### Scenario: description <p> meets WCAG AA Normal on teal background
- **WHEN** la prueba E2E 4.14 se ejecuta contra el PanelHome renderizado
- **THEN** el `color` computado y `background-color` del párrafo `<p>` se lean mediante `getComputedStyle`
- **AND** la razón de contraste WCAG es ≥ 4.5
- **O** si el token primario `#41B3C4` con texto blanco sólido no alcanza 4.5:1, el fondo de la mitad izquierda se sobreecribe localmente a `--color-primary-darker` `#227E8E` y la prueba pasa
- **AND** la prueba se ejecuta (no `test.skip()`ed)

#### Scenario: panel-home spec file contiene test.skip para 4.13/4.14
- **WHEN** el source de `apps/web/e2e/panel-home.spec.ts` se inspecciona
- **THEN** no existe llamada `test.skip()` para las pruebas nombradas "WCAG AA Large contraste: h2 texto blanco sobre fondo teal (4.13)" ni "WCAG AA Normal contraste: descripción <p> en fondo teal; verificar y ajustar si fallando (4.14)"
- **AND** las pruebas están definidas con una llamada `test(...)` regular y se ejecutan en CI

### Requirement: PanelHome layout is responsive: stacked on mobile, two columns on desktop
El `panel-home` SHALL componer sus dos mitades en un grid responsivo: en móvil (`< 1024px`) las dos mitades se apilan verticalmente (izquierda teal arriba, derecha blanca abajo, cada una full-width); en escritorio (`>= 1024px`) las dos mitades quedan lado a lado, cada una ocupando 50% del ancho del panel. El breakpoint SHALL ser `lg` (1024px).

#### Scenario: Mobile stacks the two halves vertically
- **WHEN** el PanelHome se renderiza en un viewport `< 1024px`
- **THEN** el grid exterior lleva una clase que expresa una sola columna (ej. `grid-cols-1`)
- **AND** la mitad izquierda elemento aparece arriba de la mitad derecha en el DOM

#### Scenario: Desktop lays the two halves side by side
- **WHEN** el PanelHome se renderiza en un viewport `>= 1024px`
- **THEN** el grid exterior lleva una clase que expresa dos columnas (ej. `lg:grid-cols-2`)
- **AND** la mitad izquierda y la mitad derecha cada una ocupa ~50% del ancho del panel

### Requirement: PanelHome is keyboard and screen-reader accessible
El `panel-home` SHALL usar HTML semántico para ser operable con el teclado y consumible por lectores de pantalla sin atributos ARIA extra: el headline del panel es `<h2>` (subordinado al hero `<h1>`), el CTA es un `<a>` focusable, y ningún elemento decorativo emite ruido ARIA.

#### Scenario: The panel headline is an h2, not a new h1
- **WHEN** la página home se renderiza con ambos HeroBanner y PanelHome
- **THEN** el documento contiene exactamente un `<h1>` (el headline del hero)
- **AND** el headline del PanelHome se renderiza como `<h2>`

#### Scenario: The CTA is keyboard-focusable
- **WHEN** el PanelHome se renderiza
- **THEN** el CTA es un elemento `<a href="/contacto">` (focusable por defecto)
- **AND** el CTA no lleva `tabindex="-1"` ni `aria-hidden="true"`
- **AND** la navegación Tab puede mover el foco al CTA

#### Scenario: Stat cells do not carry aria-label
- **WHEN** el PanelHome se renderiza
- **THEN** no celda de estadística `<div>` o `<p>` lleva `role="img"`, `aria-label` ni atributos `alt` (las estadísticas son texto plano, sin ruido decorativo)

### Requirement: PanelHome content is configured via a hardcoded constant
El contenido del `panel-home` SHALL venir del constante `PANEL_HOME_CONTENT` en `lib/config/panel-home.ts`, exportado como `Readonly<PanelHomeProps>`, con exactamente cuatro stats y exactamente un CTA. El valor de la primera stat SHALL ser `"40+"` y el valor de la última stat SHALL ser `"9+"`.

#### Scenario: PANEL_HOME_CONTENT exposa el conjunto completo de props
- **WHEN** `PANEL_HOME_CONTENT` se importa
- **THEN** tiene la forma `{ eyebrow: string; headline: string; description: string; cta: PanelCta; stats: readonly PanelStat[] }`
- **AND** `eyebrow`, `headline` y `description` son cadenas no vacías
- **AND** `cta.label`, `cta.href` y `cta.variant` son cadenas no vacías con `variant === 'primary'`

#### Scenario: PANEL_HOME_CONTENT.stats tiene exactamente cuatro stats
- **WHEN** `PANEL_HOME_CONTENT.stats` se inspecciona
- **THEN** tiene longitud `4`
- **AND** cada elemento tiene cadenas no vacías `value` y `label`
- **AND** el valor de la primera elemento equals `"40+"`
- **AND** el valor de la última elemento equals `"9+"`

#### Scenario: PANEL_HOME_CONTENT.cta points to /contacto
- **WHEN** `PANEL_HOME_CONTENT.cta` se inspecciona
- **THEN** `cta.href` equals `"/contacto"`
- **AND** `cta.label` equals `"SOLICITAR ASESORÍA TÉCNICA"`
- **AND** `cta.variant` equals `"primary"`

#### Scenario: Cada stat label es uppercase
- **WHEN** `PANEL_HOME_CONTENT.stats` se inspecciona
- **THEN** cada elemento's `label` coincide con la regex `/^[A-ZÁÉÍÓÚÑ0-9\s+]+$/` (mayúsculas, dígitos, espacios y el signo más solamente)

### Requirement: PanelHome integrates into the home page after the HeroBanner
El `apps/web/src/pages/index.astro` SHALL render `<HeroBanner {...HERO_BANNER_CONTENT} />` seguido de `<PanelHome {...PANEL_HOME_CONTENT} />` dentro de su `<Layout>` slot. El PanelHome SHALL NOT reemplazar al HeroBanner; ambos renderizan en la página home.

#### Scenario: Home page renders both HeroBanner and PanelHome
- **WHEN** un visitante carga `/` (la página home)
- **THEN** el HTML renderizado contiene el HeroBanner `<section>` (con el headline, subtitle y CTAs)
- **AND** el HTML renderizado contiene el PanelHome `<section>` (con el headline, descripción, CTA y 4 stats)

#### Scenario: PanelHome renders after the HeroBanner in the DOM
- **WHEN** la página home se renderiza
- **THEN** el HTML renderizado mantiene el orden: `<header>` (site-header), luego el SearchForm `<div role="search">`, luego el HeroBanner `<section>`, luego el PanelHome `<section>`
- **AND** no bar de contacto anterior precede al header
- **AND** el count de `<header>` elementos en el documento sigue siendo exactamente uno (no se introduce nuevo landmark)

### Requirement: PanelHome reduces its inner padding on desktop
El `panel-home` izquierda (`<div>` que lleva `bg-primary`) SHALL usar relleno interior reducido en desktop: `lg:p-12` (48px) en lugar del `lg:p-16` (64px) usado anteriormente, para que el panel lea más apretado en pantallas grandes. El padding móvil/tablet (`p-8 md:p-12`) se mantiene sin cambios para la mitad izquierda. La mitad derecha SHALL usar un padding responsivo que mantenga los valores de estadística contenidos en viewports estrechos (ej. `p-4 md:p-8 lg:p-12`) en lugar del `p-8 md:p-12` fijo anterior.

#### Scenario: Left half uses reduced desktop padding lg:p-12
- **WHEN** el PanelHome renderiza la izquierda (`bg-primary`)
- **THEN** la mitad izquierda `<div>` lleva `lg:p-12`
- **AND** la mitad izquierda `<div>` no lleva `lg:p-16`

#### Scenario: Right half uses responsive padding
- **WHEN** el PanelHome renderiza la mitad derecha (`bg-white`)
- **THEN** sus celdas de estadística declaran un padding base menor que el aplicado en `md:`/`lg:`
- **AND** el padding en `lg:` se mantiene en `p-12` para conservar la densidad desktop

### Requirement: PanelHome animates the four stat numbers from 0 to their value on first visibility
El `panel-home` SHALL animar cada valor de estadística de `0` hasta su valor objetivo cuando el usuario hace scroll hacia abajo y el panel entra por primera vez en el viewport, usando un `IntersectionObserver` que dispara la animación exactamente una vez (SHALL NOT re-play on subsequent re-entries). Durante la animación el valor numérico cuenta mientras el sufijo `+` SHALL permanecer visible en todo momento (ej. `0+`, `1+`, … `40+`). El valor objetivo SHALL venir del campo `numericValue: number` de `PanelStat` (valores `40`, `30000`, `5`, `9`), mientras que el formato de exhibición (`value`, ej. `30.000+`) SHÁ permanecer el fallback SSR/no-JS. La animación SHALL respetar `prefers-reduced-motion: reduce` al omitir el count-up y mostrar el valor final inmediatamente.

#### Scenario: Stat cells expose a numeric target via data attributes
- **WHEN** el PanelHome se renderiza
- **THEN** cada párrafo de valor `<p>` lleva un `data-stat-value` attribute y un `data-target` attribute igual a su `numericValue` (`40`, `30000`, `5`, `9`)
- **AND** el texto visible de cada párrafo de valor es el string `value` (`40+`, `30.000+`, `5+`, `9+`) como fallback SSR/no-JS

#### Scenario: Numbers count up from 0 to target once when scrolled into view
- **WHEN** la página se hace scroll hacia abajo para que el PanelHome entre en el viewport
- **THEN** cada número estadístico anima desde `0` hasta su valor `data-target`
- **AND** el sufijo `+` está presente durante toda la animación
- **AND** la animación no re-replay si el panel sale y reingresa el viewport

#### Scenario: Reduced motion shows final value without animation
- **WHEN** el entorno informa `prefers-reduced-motion: reduce`
- **THEN** los valores de estadística se renderizan como sus cadenas de valor final (`40+`, `30.000+`, `5+`, `9+`) sin animación de count-up

#### Scenario: numericValue is part of the PanelStat contract
- **WHEN** `PanelStat` / `PANEL_HOME_CONTENT` se inspecciona
- **THEN** cada elemento `stats` tiene un `numericValue` número igual al target entero de su `value` (`40`, `30000`, `5`, `9` respectivamente)

### Requirement: PanelHome adornos la grid de estadísticas con un divisor en forma de más signo (+) mediante gap-px
El `panel-home` right-half stats grid SHALL renderizar un signo decorativo `+` (más) que divide el layout 2×2 de estadísticas en cuatro cuadrantes: una línea vertical 1px en el centro horizontal (entre las dos columnas) y una línea horizontal 1px en el centro vertical (entre las dos filas), ambas en el color primario (`--color-primary`, `#41B3C4`).

El divisor SHALL alcanzar los bordes reales superior, inferior, izquierdo y derecho de la mitad blanca del panel. Dado que el wrapper lleva `background-color: var(--color-primary)` y las cells llevan `bg-white`, con el grid configurado como `grid-cols-2 grid-rows-2 gap-px h-full w-full`, la brecha 1px entre cells expone el color primario como las líneas del divisor.

El wrapper SHALL ser un elemento `relative` que se estire a la altura completa de la mitad blanca (`flex-1` dentro de un `flex flex-col` `bg-white` padre que se estira mediante `align-items: stretch` en el main `lg:grid-cols-2` grid). El padding SHALL vivir en las cells, no en el wrapper, para que nada limite las líneas del divisor desde alcanzar los bordes reales de la mitad blanca.

Dado que el divisor se renderiza mediante CSS Grid gaps (no como elementos DOM separados), no se necesita `aria-hidden` atributo: las tecnologías asistenciales no lean gaps grid y los cuatro `<p>` de valores estadísticos permanecen sin modificar en texto y orden accesible.

#### Scenario: Stats grid container is relative and stretches to the white half height
- **WHEN** el PanelHome renderiza la mitad derecha
- **THEN** la grid 2×2 de estadísticas está envuelta en un container `relative` (`stats-grid-wrap`)
- **AND** ese container se estira a la altura completa de la mitad blanca (mediante `flex-1` + `flex flex-col` cadena anclada al main `lg:grid-cols-2` grid)
- **AND** el grid usa `grid-cols-2 grid-rows-2 gap-px h-full w-full` para que las cells llenen el wrapper de borde a borde

#### Scenario: Divider colour resolves from the primary token
- **WHEN** el divisor se inspecciona
- **THEN** el background-color del wrapper se resuelve de `--color-primary` (`rgb(65, 179, 196)`)
- **AND** el background-color de las cells se resuelve a blanco (`rgb(255, 255, 255)`)
- **AND** la brecha 1px expone el color primario como las líneas del divisor
- **AND** ningún literal hexadecimal aparece en el source del componente para el color del divisor

#### Scenario: Divider lines reach the actual edges of the white half
- **WHEN** el panel renderizado se mide
- **THEN** la cell más izquierda comienza en el borde izquierdo del wrapper (X ≈ 0, dentro de 1px)
- **AND** la cell más derecha termina en el borde derecho del wrapper (dentro de 1px)
- **AND** la cell más arriba comienza en el borde superior del wrapper (Y ≈ 0, dentro de 1px)
- **AND** la cell más abajo termina en el borde inferior del wrapper (dentro de 1px)
- **AND** tanto la línea horizontal como la vertical del divisor, por lo tanto, se extiende el ancho y altura completos de la mitad blanca

#### Scenario: Divider no impacta accesibilidad
- **WHEN** el DOM renderizado se inspecciona con tecnologías asistenciales
- **THEN** los cuatro valores `<p>` estadísticos y labels permanecen sin modificar en texto y orden accesible
- **AND** dado que el divisor se renderiza mediante CSS Grid gaps (no como elementos DOM separados), no se requiere atributo `aria-hidden`: gaps no están expuestos al árbol de accesibilidad

### Requirement: PanelHome elevates 8px above the HeroBanner via uniform negative margin-top
El PanelHome `<section>` SHALL llevar un uniforme `-mt-2` (−8px en todos los breakpoints) de modo que la carta elevada (`.panel-home-elevated`) se superpone al borde inferior del HeroBanner por 8px en todos los breakpoints; en desktop (≥1024px) esto coloca la carta 16px más cerca del borde superior que el anterior offset positivo +8px (decisión del cliente, solo cambio desktop; móvil/tablet sin cambios a −8px). El stacking `z-10` SHALL preservarse.

#### Scenario: SC-005 — panel card is 16px higher on desktop
- **WHEN** la página home renderiza la sección PanelHome
- **THEN** el `<section data-panel-home>` lleva `relative -mt-2 z-10`
- **AND** la sección no lleva un positive `lg:mt-2` offset ni un `md:-mt-2` redundante
- **AND** en desktop (≥1024px) la carta se sitúa 8px arriba del borde inferior del hero — 16px más cerca de la parte superior que antes
- **AND** en móvil/tablet el offset se mantiene −8px (sin cambios)