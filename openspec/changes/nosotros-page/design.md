# Design

## Context

Ver proposal.md — Why. Estado actual relevante (observado en el código):

- `apps/web/src/pages/nosotros.astro`: `<Layout title="Nosotros — Riff" description="…" hero={false} showSearch={false}>` con `<main aria-label="Contenido de Nosotros"></main>` **vacío** (comentario que remite al ticket `fix/header-scroll-regressions-and-about-page`, Req 5 / SC-108 / SC-109).
- `openspec/specs/nosotros-page/spec.md` **ya existe** (ADDED en el change archivado `header-scroll-restore`): un solo requirement, "Page renders with only the shared header and footer chrome", con SC-108 (chrome) y SC-109 (`main` vacío, sin hero image, sin search form).
- `openspec/specs/navigation-menu/spec.md` SC-006 menciona "the empty `/nosotros` page (Header + Footer only)".
- Tests hoy: `apps/web/src/pages/__tests__/nosotros.test.ts` **afirma** que `<main>` está vacío y que no hay `<section>` — se romperá y debe reescribirse en este change.
- Referencia visual: `docs/design/components/nosotros/reference.html` (1403 líneas, HTML con Tailwind CDN + `tailwind.config` propio, Material Symbols, imágenes de Google/AIDA, script propio de smooth scroll, `<footer>` vacío) + `reference.jpg`.

Hallazgos del sistema de diseño (investigación):

- **Tokens**: Tailwind v4 `@theme` en `apps/web/src/styles/globals.css` (espejo en `apps/admin`). Marca (`primary` #41B3C4, `primary-deep` #006874, `secondary` #1F2D40, `accent` #F26A21 y sus tonos), neutros (`text`, `text-2`, `muted`, `border`, `bg`, `white`), estado, `font-heading` (Montserrat) / `font-body` (Open Sans), `--radius: 0` (flat estricto, `rounded*` prohibido), sombras `shadow-1..5` + `shadow-scroll-shell` reservadas a capas flotantes (los componentes base no las aplican en estado estático; las tarjetas de contenido sí usan `shadow-1/2` — precedente `DestacadosSection`, `SolutionSection`, `ProductCard`). **Prohibido** hex literales y `brand-*`.
- **Iconos**: `astro-icon` + `@iconify-json/lucide` vía `<Icon name="lucide:..." />`; set único (excepciones de marca `simple-icons:x` / `simple-icons:whatsapp`); `icon-catalog.test.ts` fuerza el prefijo `lucide:` en los componentes base y prohíbe `material-symbols:`/`logos:` en el README.
- **Imágenes** (convención `image-assets`, `docs/frontend-standards.md`): todo asset vive en `apps/web/src/assets/img/`, se importa con `@/` y se renderiza con `<Image>`/`<Picture>` de `astro:assets` (sharp); **prohibido** añadir binarios a `public/` (excepción única: `og-image.png`). Above-the-fold eager; resto `loading="lazy"`.
- **Patrón de páginas**: componentes tontos + config hardcodeada en `src/lib/config/<pagina>.ts` (tipos en `src/lib/types/`) esparcida por la página (`contact-page.ts`, `services-page.ts`, `hero-banner.ts`, …).
- **Hero de la home**: `HeroBanner.astro` es una sección **transparente** pensada para montarse sobre el shell full-bleed del `<Layout hero>` (texto blanco sobre imagen + overlay, `splitHeadline` para la palabra destacada, sin columna de imagen, sin badge, un solo CTA por variante).
- **Offset del header**: el grupo Header+SearchForm es `sticky top-0` (en flujo, no `fixed`), por lo que el contenido fluye después sin offset; `/contacto` y `/servicios` no aplican padding superior compensatorio.
- **Smooth scroll global**: `html { scroll-behavior: smooth; }` en `globals.css` (`@layer base`) — ya cubre las anclas internas.
- **Teléfono**: `getContactInfo()` en `src/lib/config/contact.ts` es la fuente única (`+56 2 29079067` → `tel:+56229079067`, ya usado por `ContactBar` y `TopHeader`).

## Goals / Non-Goals

**Goals:**

- Que `/nosotros` renderice las 6 secciones de la referencia con el copy aprobado, responsive y accesible, dentro del `<Layout>` existente (sin tocar Layout/Header/Footer).
- Traducir la referencia a los sistemas reales del proyecto: iconos Lucide, tokens `@theme`, assets locales, rutas reales, smooth scroll global.
- Mantener el copy verbatim salvo los ajustes listados en D13 (justificados).
- Cobrir el comportamiento observable con specs delta + tests TDD (página y componentes).

**Non-Goals:**

- No tocar `Layout.astro`, `Header.astro`, `Footer.astro`, ni la home ni otras páginas.
- No añadir imágenes reales nuevas ni binarios a `public/` (solo placeholders reutilizando assets existentes).
- No modificar el sistema de tokens (no se añaden colores, fuentes ni sombras nuevas; D4 documenta los mapeos).
- No añadir un script propio de smooth scroll ni tocar el mecanismo global.
- No añadir e2e Playwright para `/nosotros` en este change (ver Open Questions).
- No cambiar `title`/`description` SEO del `<Layout>` (D15).

## Decisions

### D1 — Capability existente: delta `MODIFIED` + `ADDED`, no capability nueva

**Elección**: `nosotros-page` ya existe en `openspec/specs/nosotros-page/spec.md` (creada por `header-scroll-restore`). El delta la **modifica** (requirement del `main` vacío) y **añade** los requirements de las 6 secciones. Además se modifica `navigation-menu` (SC-006 menciona la página vacía).

**Alternativa descartada**: crear la capability como nueva — duplicaría la spec existente y rompería el merge en archive (dos requirements con el mismo nombre para el mismo capability path). La instrucción de la tarea asumía capability nueva; se corrige y se documenta en proposal.md.

### D2 — Estructura: 6 componentes tontos + config tipada (patrón de página del proyecto)

**Elección**: una sección = un componente presentacional, todo el copy/arrays en `src/lib/config/nosotros-page.ts` (`NOSOTROS_PAGE_CONTENT`, tipos en `src/lib/types/nosotros-page.ts`), la página solo compone:

| Componente | Sección de la referencia |
| --- | --- |
| `NosotrosHero.astro` | 1 — Hero / presentación institucional (`<h1>` único) |
| `NosotrosTimeline.astro` | 2 — Línea de tiempo (`id="historia"`) |
| `NosotrosValueProp.astro` | 3 — 4 pilares + bento de 4 sectores |
| `NosotrosIdentity.astro` | 4 — Misión & Visión |
| `NosotrosTeamGrid.astro` | 5 — 4 tarjetas de equipo (nombre evita la colisión con `NosotrosTeamSection.astro` de la home, que es otra pieza con 3 miembros y layout distinto) |
| `NosotrosClients.astro` | 6 — Grid de 8 clientes + banner CTA final |

**Rationale**: SRP por componente testeable con AstroContainer (precedente: `contacto.astro` = 3 componentes + `CONTACT_PAGE_CONTENT`; `servicios.astro` = `ServicesHero` + `ServiceCard` + config). Frontmatter sin lógica de negocio: los únicos cálculos triviales (p. ej. el `tel:` href) se resuelven en config/lib.

**Alternativa descartada**: un único `NosotrosSections.astro` gigante (archivo > 1000 líneas, test monolítico, viola "un componente = una responsabilidad"); o 6 configs separadas (fragmenta el copy de una sola página).

### D3 — Hero: **Opción B — componente propio `NosotrosHero.astro`** (no reusar `HeroBanner`)

**Elección**: hero específico para Nosotros, tomando el estilo de la home como referencia de lenguaje visual (tipografía Montserrat bold, CTAs uppercase con `font-heading`, tokens de marca).

**Trade-off explícito (duplicación vs acoplamiento)**:

- *Opción A — reusar `HeroBanner` con props extra*: `HeroBanner` está acoplado al shell `hero={true}` del Layout (blanco sobre imagen full-bleed, sin fondo propio), asume `splitHeadline` con palabra destacada, no tiene badge/eyebrow, ni columna de imagen con caption, ni segundo CTA con icono, ni fondo navy. Habría que convertirlo en un árbol de condicionales (`heroImageColumn ? …`, `eyebrow ? …`, `darkBackground ? …`), con snapshot propio de la home (`HeroBanner.test.ts.snap`) y la home como consumidor colateral del riesgo — acoplamiento alto para beneficio nulo (la home no va a usar el layout del hero de Nosotros).
- *Opción B — componente nuevo (elegida)*: duplica ~30 líneas de "lenguaje de hero" (título/CTAs), pero mantiene a `HeroBanner` intacto, permite fondo `bg-secondary` propio con `hero={false}` en el Layout (condición pedida: no hero image ni search) y deja cada hero testeable por separado. Precedente directo: `ContactHero.astro` y `ServicesHero.astro` ya son heroes por página en lugar de parametrizar `HeroBanner`.

### D4 — Mapeo de design tokens (referencia → proyecto) — **sin añadir tokens**

La referencia define su propio `tailwind.config` (paleta Material 3 + spacing `unit-*` + fuentes Inter). Se **mapea a los tokens existentes** de `@theme`; no se añade ningún token al sistema.

**Color:**

| Referencia | Proyecto | Uso |
| --- | --- | --- |
| `background` / `surface` / `surface-bright` (#f8f9ff) | `bg-bg` (#F6F8FA) | fondos de sección clara alterna |
| `surface-container-lowest` (#ffffff) | `bg-white` | tarjetas, secciones blancas |
| `surface-container-low` (#eef4ff) | `bg-bg` | secciones claras alterna (timeline, misión/visión, bento) |
| `surface-container` (#e4efff) | `bg-primary-100` (#EAF7F9) | cajas de nota ("Hito Clave", footers de pilar, bento) — tinte de marca sutil equivalente |
| `surface-dim` (#ccdbf1) | `bg-bg` + `border border-border` | badges numéricos pares de la timeline (02/04) |
| `outline-variant` (#bcc9cb) | `border-border` | línea central de timeline, divisores |
| `on-surface` / `on-background` (#0d1d2c) | `text-text` (#1F2D40) | texto base |
| `on-surface-variant` (#3d494b) | `text-text-2` (#5C6675) | texto secundario |
| `inverse-surface` (#233242) | `bg-secondary` (#1F2D40) | fondos oscuros: hero, bloque Visión, sección Clientes |
| `inverse-on-surface` (#e9f1ff) | `text-white` | texto sobre oscuro |
| `primary` (#006874) | `primary-deep` (#006874 — **match exacto**) | fondos de acento oscuro, badge "AÑO 2013/1979", banner CTA |
| `primary-container` (#42b7c8) | `primary` (#41B3C4) | "RIFF" resaltado del h1, badges, iconos |
| `primary-fixed` (#99f0ff) | `primary-light` (#D2EEF2) | texto claro cian sobre navy (eyebrow, subtítulos) |
| `primary-fixed-dim` (#66d6e7) | `primary` | variantes/hover cian |
| `secondary-container` (#fc7728) | `accent` (#F26A21) | CTA naranja "SOLICITAR ASESORÍA TÉCNICA", etiquetas "SECTOR 0x" |
| `secondary` (#a04100) | `accent-dark` (#D14E12) | hover de los CTA naranja |
| `secondary-fixed` (#ffdbcb) | `accent-light` | eyebrow del bloque Visión sobre navy |
| `tertiary` (#4f5e81) | `secondary-light` (#35455E) | badge "AÑO 2012" |
| `on-primary` / `on-secondary` / `on-tertiary` (#ffffff) | `text-white` | texto sobre fondos de marca |
| `surface-tint` (#006874) | `primary-deep` | overlay de imagen (`bg-primary-deep/20`) |
| `error*`, `on-error*` | — | no se usan en la referencia |

**Tipografía** (la referencia usa Montserrat + Open Sans + **Inter**; el proyecto solo carga Montserrat/Open Sans self-hosted):

| Referencia | Proyecto |
| --- | --- |
| `font-display-*`, `font-headline-*` (Montserrat) | `font-heading` |
| `font-label-bold`, `font-label-md` (**Inter**) | `font-heading` + `uppercase tracking-wider` (no se añade Inter: los labels de la referencia son uppercase con tracking, lenguaje que Montserrat ya resuelve; añadiría una familia nueva al `@fontsource` sin necesidad) |
| `font-body-*`, `font-caption` (Open Sans) | `font-body` |

**Escala tipográfica** (→ utilities Tailwind estándar, sin nuevos tokens de tamaño):

| Referencia | Proyecto |
| --- | --- |
| `text-display-lg` (64px) | `text-4xl sm:text-5xl lg:text-7xl` |
| `text-display-md` (48px) | `text-3xl md:text-4xl lg:text-5xl` |
| `text-headline-lg` (32px) | `text-2xl md:text-3xl` |
| `text-headline-md` (24px) | `text-xl md:text-2xl` (títulos de tarjeta: `text-xl`) |
| `text-body-lg` (18px) | `text-lg` |
| `text-body-md` (16px) | `text-base` |
| `text-caption` (12px) | `text-xs` |
| `text-label-bold` (14px) | `text-sm` |

**Spacing / contenedor**: `max-w-container-max` (1280px) + `px-gutter` (24px) → la utility `.container` del proyecto (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`, 1280px + 16/24/32px); `py-unit-xl` (64px) → `py-16 md:py-20` (precedente `servicios.astro`: `py-12 md:py-20`); `unit-lg` (32) → `8`, `unit-md` (16) → `4`, `unit-sm` (8) → `2`, `unit-xs` (4) → `1`.

**Justificación de no añadir tokens**: los tonos de la referencia que no existen (`#eef4ff`, `#e4efff`, `#ccdbf1`) son variantes de una escala Material 3 de superficies; el proyecto ya modela esa jerarquía con `bg-white` / `bg-bg` / `bg-primary-100` + `border-border`, que es además la separación por defecto del flat design (bordes 1px, sin sombras nuevas). Introducir 3 tokens solo para esta página rompería la paridad `apps/web` ↔ `apps/admin` (`sync.test.ts`) sin beneficio de sistema.

### D5 — Iconos: Material Symbols → Lucide (set único), con verificación previa

Todos los iconos pasan a `<Icon name="lucide:…" />` con `aria-hidden="true"` (decorativos). Mapeo propuesto (nombres a **verificar contra `@iconify-json/lucide` instalado** antes de escribir el componente — task 1.x; si un nombre no existe se usa el fallback indicado y se documenta en este archivo):

| Referencia (Material) | Lucide | Notas |
| --- | --- | --- |
| `verified` | `badge-check` | fallback: `badge` |
| `arrow_forward` | `arrow-right` | convención del proyecto (`ContactForm`, `ServiceCard`) |
| `history_edu` | `book-open-text` | fallback: `book-open` |
| `precision_manufacturing` | `cog` | fallback: `settings` (pilar Durabilidad) |
| `tune` | `sliders-horizontal` | pilar Precisión |
| `water_drop` | `droplet` | pilar Eficiencia (familia `droplets` ya usada) |
| `engineering` | `wrench` | pilar Servicio In-Situ **y** badge "+100 años en terreno" (un solo mapping por icono fuente) |
| `terrain` | `mountain` | sector Minería |
| `restaurant` | `utensils` | sector Alimentos |
| `reduce_capacity` | `users` | sector APR (población/comunidad) |
| `apartment` | `building` | sector Edificación — **fallback aplicado en task 1.3**: `building-2` NO existe en el `@iconify-json/lucide` instalado (solo `building`, `building-complex`, `building-complex-plus`) |
| `assignment` | `clipboard-list` | eyebrow Misión |
| `visibility` | `eye` | eyebrow Visión |
| `verified_user` | `shield-check` | nota Misión |
| `eco` | `leaf` | nota Visión |
| `badge` | `badge` | footer de tarjeta de equipo; fallback: `award` |
| `architecture` | `drafting-compass` | fallback: `pen-tool` (tarjeta Lara Smith) |
| `public` | `globe` | tarjeta John Doe |
| `speed` | `gauge` | tarjeta Felipe Román |
| `handshake` | `handshake` | eyebrow Clientes |
| `call` | `phone` | ya en el catálogo |
| `★` (glifo de texto) | `star` | ya en el catálogo; se sustituye el glifo por el icono por consistencia (D13) |

**Alternativas descartadas**: `lucide-astro`/SVG inline (prohibidos por el catálogo: set único vía astro-icon); conservar Material Symbols (rompe `icon-catalog.test.ts` y el catálogo canónico).

Los iconos nuevos se añaden a la tabla del catálogo en `docs/design/style-guide/README.md` (task 5.1).

### D6 — Imágenes: placeholders reutilizando `src/assets/img/` (convención `image-assets`)

**Elección**: ningún binario nuevo. Cada `data-alt` de la referencia se conserva **verbatim** como `alt` real (son descripciones válidas). `src` externo → asset local importado con `@/assets/img/…` y renderizado con `<Image>` de `astro:assets` (`loading="lazy"` por ir bajo el fold; la del hero eager si se decide que es above-the-fold — como el hero no es full-bleed y queda bajo el header, `lazy` es aceptable; se usa `eager` solo si el LCP lo requiere).

| Imagen de la referencia | Placeholder local | Justificación |
| --- | --- | --- |
| Hero (técnico con flujómetro) | `medicion-fluidos.webp` | asset técnico existente, coherente con el `alt` |
| Retratos Steven Marks / Lara Smith / John Doe | `f-1.jpg` / `f-2.jpg` / `f-3.jpg` | **son las mismas 3 personas**, fotos ya entregadas por el cliente y usadas por el home (`nosotros-team-section.ts`) |
| Retrato Felipe Román (4.º, no existe en el repo) | `control-accesorios.webp` | no hay 4.º retrato en el repo y está prohibido añadir binarios: se usa un asset técnico neutro como placeholder explícito, a sustituir cuando el cliente entregue la foto (cambio de config, task 8.x lo deja parametrizado) |

**Alternativa descartada**: crear `public/placeholders/…` (viola `image-assets`: "No se añaden otros binarios de imagen a `public/`"); generar imágenes nuevas (fuera de alcance).

### D7 — CTAs, anclas internas y teléfono

- `href="#contacto"` (2 apariciones: hero + banner final) → **`/contacto`** (ruta real del sitio).
- `href="#historia"` → se conserva como ancla interna: la sección timeline lleva `id="historia"` (ya existe el target en la propia página).
- `href="tel:+56229079067"` y el texto `+56 2 29079067` → se resuelven desde `getContactInfo()` en la config (misma fuente que TopHeader/ContactBar/Footer; el valor renderizado es idéntico al de la referencia). **No** se hardcodea el número en el componente.
- `#` vacíos o CTAs muertos: ninguno (ambos CTAs del hero y los 2 del banner final quedan cubiertos).

### D8 — Smooth scroll: reutilizar el global, sin script nuevo

La referencia incluye un `<script>` que intercepta `a[href^="#"]` y hace `scrollIntoView({behavior:'smooth'})`. **No se copia**: `globals.css` ya declara `html { scroll-behavior: smooth }` a nivel global (aplica a todo salto de ancla del sitio, incluido `#historia`). Añadir el script duplicaría el mecanismo y rompería la navegación con View Transitions (`<ClientRouter />`).

### D9 — `pt-44`: no aplica (header `sticky` en flujo, no `fixed`)

La referencia añade `pt-44` a `<main>` porque su header es fijo y el contenido quedaría debajo. En el proyecto el grupo Header+SearchForm es `sticky top-0` **dentro del flujo** (TopHeader scrollea encima), así que el contenido ya nace debajo sin offset: `/contacto` y `/servicios` no compensan ningún padding. **Verificación durante la implementación** (task 8.x): render y captura de la página para confirmar que el hero no queda tapado por el header sticky; si se confirmara solapamiento, el offset coherente sería el mismo lenguaje del hero de la home (`pt-4 md:pt-8 lg:pt-24` en `HeroBanner`/`ContactHero`), **no** `pt-44` (que asume header fijo de ~176px que no existe aquí). No se duplica ningún offset de Layout.

### D10 — Responsive (breakpoints resueltos)

La referencia ya trae clases responsive; se conservan y se verifican los colapsos (mobile-first):

| Sección | Comportamiento |
| --- | --- |
| Hero | `grid-cols-1 lg:grid-cols-12`: en móvil texto arriba + imagen debajo (`mt-8 lg:mt-0`); CTAs `flex-wrap` |
| Timeline | Base `grid-cols-1` (tarjeta + nota apiladas, en orden lógico), línea central y badges numéricos `hidden lg:flex`/`hidden lg:block`, alternado solo en `lg` vía `order-*`; texto de nota alineado a la izquierda en móvil (sin `lg:text-right` efectivo) |
| Pilares | `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` |
| Bento sectores | `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` |
| Misión & Visión | `grid-cols-1 lg:grid-cols-2` (apilados en móvil, Misión primero) |
| Equipo | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| Clientes | `grid-cols-2 sm:grid-cols-4 lg:grid-cols-8` (2×4 en móvil) |
| Banner CTA | `grid-cols-1 lg:grid-cols-12`; botones `w-full sm:w-auto lg:w-full` |
| Encabezados con badge a la derecha | `flex flex-col md:flex-row md:items-end` |

Además: `overflow-x-hidden` no está en el body con `hero=false`, así que se evitan anchos que desborden (todo dentro de `.container`); el SVG decorativo del hero es `hidden lg:block`.

### D11 — Sombras y flat design

- **`rounded*`**: la referencia no usa ninguna (respetamos `--radius: 0`; ninguna se añade).
- **Sombras**: la referencia usa `shadow-sm/md/xl/lg` de Tailwind (valores por defecto, no son tokens del proyecto). Mapeo: `shadow-sm` → `shadow-1`, `shadow-md` → `shadow-2`, `shadow-xl` → `shadow-3` (precedente: tarjetas de contenido `DestacadosSection`/`SolutionSection` usan `shadow-1/2`); **los botones/CTA pierden su `shadow-lg`** (los botones no son capas flotantes y el flat design reserva sombras a capas flotantes). Los bloques estáticos de chrome no llevan sombra.

### D12 — Semántica, jerarquía y accesibilidad

- Un **único `<h1>`** por página: "SOMOS RIFF" (hero). Cada sección abre con `<h2>`; tarjetas/pilares `<h3>`; tarjetas del bento `<h4>` (igual que la referencia).
- `<main aria-label="Contenido de Nosotros">` se conserva; el Layout ya aporta `<header>`, `<footer>` y la nav (un solo landmark de header — SC-108).
- Imágenes con `alt` no vacío (los `data-alt` de la referencia); el SVG decorativo del hero y los iconos llevan `aria-hidden="true"`.
- Anclas: `#historia` apunta a una sección con `id` real; CTAs usan texto visible (sin `aria-label` redundante).
- Contraste: texto claro sobre navy usa `text-white` / `primary-light` (verificado en D4: `primary-light` #D2EEF2 sobre `secondary` #1F2D40 es alto contraste).

### D13 — Copy: preservación verbatim + ajustes puntuales (lista cerrada)

Se preserva **todo** el copy de la referencia (títulos, subtítulos, párrafos, hitos, roles, nombres de clientes, misiones entre comillas, `<strong>RIFF SpA</strong>`). Únicos ajustes:

1. `href="#contacto"` → `/contacto` (D7).
2. Teléfono desde `getContactInfo()` (D7) — valor renderizado idéntico.
3. Glifo `★` → icono `lucide:star` (D5).
4. `src` externo → placeholder local; `data-alt` → `alt` (D6). Las descripciones `alt` se conservan en su texto original (inglés, descriptivas).
5. Entidades HTML (`&amp;`, `&lt;`) se escriben como caracteres literales en Astro/JSX.
6. Comentarios de la referencia (`<!-- SECCIÓN N: … -->`) no se trasladan al markup de producción (el comentario de la página explica la composición, como en `contacto.astro`).
7. El `<footer>` vacío final de la referencia se ignora (lo aporta el Layout).

Ningún texto comercial se reescribe; si QA/cliente pide cambios de copy, van a config (D2) sin tocar componentes.

### D14 — SVG decorativo del hero

La referencia incluye una retícula técnica (paths `stroke-dasharray`) como fondo decorativo. **Se conserva** como `<svg>` inline con `aria-hidden="true"` + `hidden lg:block`: es un patrón de fondo, no un icono de UI (la prohibición de SVG inline del catálogo aplica a *iconos* — `docs/frontend-standards.md` § "Iconos: no son assets de imagen… se consumen exclusivamente vía astro-icon"; no existe set Lucide para "retícula de fondo"). Alternativa descartada: quitarlo (pérdida de fidelidad con la referencia aprobada) o representarlo con gradiente CSS (más frágil que el SVG ya probado).

### D15 — SEO: metadatos actuales se conservan

`title="Nosotros — Riff"` y `description="Conozca a Riff: ingeniería de precisión en medición, control y tratamiento de fluidos."` se mantienen: describen la página y caben en longitud; el copy de la referencia (hero) es de destino, no meta copy. No se propone `hero={true}` ni `showSearch` (condición de la página: sin imagen de fondo full-bleed y sin buscador global).

### D16 — Estrategia de tests (TDD)

- **Página** (`src/pages/__tests__/nosotros.test.ts`, reescritura): SC-108 se conserva (1 `<header>`, `<footer>`, nav); SC-109 pasa a: `<main>` contiene las 6 secciones (h1 "SOMOS RIFF", `id="historia"` con 5 hitos, misión/visión, 4 tarjetas de equipo, grid de 8 clientes, banner CTA), CTAs con `href="/contacto"` (y **sin** `#contacto`), ausencia de `material-symbols`, presencia de `lucide:`, `alt` no vacíos en todas las imágenes, sin hero image (`banner_home`) y sin `role="search"` (se preservan las aserciones de `hero={false}`/`showSearch={false}`), y sin hex literales en el markup.
- **Componentes**: un test por componente (`Nosotros*.test.ts`) con AstroContainer, estilo `ContactForm.test.ts` (usar `stripComments`); asserts de contenido distintivo + accesibilidad básica (h1 único a nivel de página, `aria-hidden` en iconos).
- **Catálogo de iconos**: correr `icon-catalog.test.ts` (no debe romperse: los componentes base no cambian y el README solo gana filas Lucide).
- **Snapshots**: la referencia no pide snapshot nuevo; se regenera solo si algún componente existente lo tiene (no aplica — ninguno se modifica). Si se añade snapshot de los nuevos componentes, es opcional y estable (contenido hardcodeado).
- **Gate**: `npm run lint`, `npm run typecheck`, `npm test` en `apps/web` + `npx openspec validate --all --strict` + `make ci`.

## Risks / Trade-offs

- **[Fidelidad cromática] Los mapeos de D4 desvían unos pocos valores hex** (p. ej. `#eef4ff` → `#F6F8FA`) → Mitigación: captura lado a lado con `reference.jpg` en la revisión; si un contraste queda corto, se ajusta el *rol* (p. ej. `bg-bg` → `bg-primary-100`) sin crear tokens.
- **[Iconos inexistentes] Un nombre Lucide propuesto en D5 puede no existir** en la versión instalada → Mitigación: task 1.3 verifica cada nombre contra `node_modules/@iconify-json/lucide` antes de escribir componentes; fallbacks ya previstos en la tabla.
- **[Test existente en rojo] `nosotros.test.ts` afirma hoy `<main>` vacío** → Mitigación: el spec delta (SC-109) y el test se actualizan en el mismo change; ningún otro test/e2e referencia la vaciedad (verificado: `navigation.test.ts` solo valida el enlace).
- **[Spec `navigation-menu` con mención obsoleta]** → Mitigación: delta MODIFIED del scenario SC-006 incluido en este change.
- **[Sin 4.º retrato de equipo]** → Placeholder neutro documentado (D6); cambio de config cuando llegue la foto real. Riesgo residual: el `alt` describe una persona y la imagen no es ella — aceptado y explícito porque la consigna prohíbe añadir binarios y exige conservar el `alt`.
- **[Sombra vs flat design]** → Mapeo a tokens `shadow-1..3` + quitar sombras de botones (D11); si el gate visual del cliente pide cero sombras, se retiran en config/markup sin tocar specs (los specs solo piden "sin `rounded*`" y "tokens, sin hex").
- **[Tamaño del change]** 6 componentes + config + tests → Mitigación: tareas pequeñas y ordenadas por dependencia en tasks.md; cada una verificable por su test.

## Migration Plan

Sin migración de datos ni despliegue especial: el sitio es SSG, el change se despliega con el build normal (Docker → Coolify). Rollback = revert del commit (la página vuelve al `main` vacío, que sigue soportado por el spec original si se revierte también el delta).

## Open Questions

- ¿Incluir un e2e Playwright (`/nosotros` responde 200, anclas y CTAs) en este change o en un follow-up? Fuera de alcance por defecto (el enunciado de verificación no lo pide); si se quiere, task 9.x lo agrega.
- Confirmación de cliente sobre el placeholder del retrato de Felipe Román (D6) cuando entregue la foto real.
