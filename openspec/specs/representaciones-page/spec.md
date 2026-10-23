# representaciones-page Specification

## Purpose
Página Representaciones del sitio público: catálogo de las marcas representadas y de los distribuidores autorizados, compuesta dentro del chrome compartido (header y footer) del layout del sitio.

## Requirements

### Requirement: Representaciones page composes inside the existing site Layout

La página `/representaciones` SHALL renderizarse como `apps/web/src/pages/representaciones.astro` envolviendo su contenido en `<Layout>` (el layout existente del sitio público), recibiendo por composición el chrome completo del sitio: `TopHeader`, `Header`, `Footer`, `SiteCredits`, el botón flotante de WhatsApp y el `ClientRouter`/View Transitions globales. La página SHALL pasar `showSearch={false}` a `Layout` (sin barra de búsqueda de catálogo, consistente con la anterior página `/marcas` y con `/contacto`). La página SHALL NOT pasar la prop `hero` (no usa el shell de imagen full-bleed; el hero oscuro es propio de la sección).

#### Scenario: Page renders inside Layout with full chrome

- **WHEN** `apps/web/src/pages/representaciones.astro` se renderiza
- **THEN** el HTML resultante contiene exactamente un landmark `<header>` (el del sitio)
- **AND** contiene el contenido de `Footer` y de `SiteCredits`
- **AND** contiene el enlace del botón flotante de WhatsApp (`href="https://wa.me/56937526162"`)
- **AND** la sección hero propia de la página está presente

#### Scenario: Catalog search is omitted

- **WHEN** `representaciones.astro` se renderiza
- **THEN** el HTML NO contiene el landmark de búsqueda (`role="search"`)

#### Scenario: Page does not use the hero image shell

- **WHEN** `representaciones.astro` se renderiza
- **THEN** el HTML NO contiene la imagen full-bleed `banner_home` ni `tratamiento-agua`
- **AND** el contenido puede fluir debajo del header sólido como en cualquier página sin hero

#### Scenario: Page declares its own SEO metadata

- **WHEN** `representaciones.astro` se renderiza
- **THEN** el `<title>` contiene "Representaciones" y la marca "Riff"
- **AND** el `<meta name="description">` contiene la descripción de la página

### Requirement: Hero section renders the editorial headline with highlighted phrase

La sección hero SHALL renderizar, sobre un fondo `bg-secondary` (navy de marca), un eyebrow "ALIANZAS GLOBALES DE ALTA PRECISIÓN", un `<h1>` "Alianzas Estratégicas y Representación Exclusiva" con la subfrase "Representación Exclusiva" envuelta en un `<span>` con `text-primary`, y un párrafo de introducción. La sección SHALL ser responsive (columna en mobile, layout de 12 columnas desde `lg`).

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

### Requirement: Hero renders three metric cards

La sección hero SHALL renderizar exactamente tres tarjetas de métricas con los valores `05`, `02` y `100%`, cada una con su etiqueta y una leyenda secundaria: `05` / "Representaciones Exclusivas" / "Soporte directo de fábrica"; `02` / "Distribuciones Oficiales" / "Stock garantizado en bodega"; `100%` / "Garantía Directa de Fábrica" / "Certificación trazable".

#### Scenario: Three metric cards with values and labels

- **WHEN** el hero se renderiza
- **THEN** exactamente tres tarjetas de métrica están presentes
- **AND** contienen los valores "05", "02" y "100%"
- **AND** contienen las etiquetas "Representaciones Exclusivas", "Distribuciones Oficiales" y "Garantía Directa de Fábrica"

### Requirement: Representación exclusiva section renders five brand cards

La página SHALL renderizar una sección "Marcas de Representación Exclusiva" con eyebrow "CATÁLOGO OFICIAL DE FABRICANTES" y exactamente cinco tarjetas de marca, en orden: Apator Powogaz, RIFF Flow Metering, Nitto Seiko, GL Sanitaria e ILMAP. Cada tarjeta SHALL renderizar el nombre en un panel de wordmark, un chip de origen, un subtítulo, el nombre como `<h3>`, una categoría técnica destacada en `text-primary` y un párrafo descriptivo.

#### Scenario: Five brand cards in order

- **WHEN** la página se renderiza
- **THEN** exactamente cinco elementos de tarjeta de marca están presentes
- **AND** los títulos `<h3>` son, en orden, "Apator Powogaz", "RIFF Flow Metering", "Nitto Seiko", "GL Sanitaria" e "ILMAP"

#### Scenario: Each brand card renders chip, category and description

- **WHEN** las tarjetas de marca se renderizan
- **THEN** cada tarjeta incluye un chip de origen (por ejemplo "Polonia / UE", "Marca Propia / Chile", "Japón", "Italia / UE", "Italia / Industrial")
- **AND** cada tarjeta incluye una categoría técnica destacada con la clase `text-primary` (por ejemplo "Medición Volumétrica y Macromedición", "Electromagnéticos, Ultrasónicos y Telemetría", "Desplazamiento Positivo y Flujo Viscoso", "Grado Alimentario y Farmacéutico", "Sistemas de Filtración y Toberas Drenantes")
- **AND** cada tarjeta incluye un párrafo descriptivo propio

#### Scenario: Section header rendered

- **WHEN** la sección se renderiza
- **THEN** contiene el eyebrow "CATÁLOGO OFICIAL DE FABRICANTES"
- **AND** contiene un `<h2>` con el texto "Marcas de Representación Exclusiva"

### Requirement: Distribuidores autorizados section renders two distributor cards

La página SHALL renderizar una sección "Somos Distribuidores Autorizados de:" con eyebrow "CANAL DE DISTRIBUCIÓN CALIFICADO", un párrafo de introducción y exactamente dos tarjetas de distribuidor: PIUSI y SENSUS. Cada tarjeta SHALL renderizar el wordmark, una insignia (por ejemplo "Italia", "Xylem Brand"), un ícono temático, el nombre como `<h3>`, un párrafo descriptivo, una lista de exactamente tres bullets (cada uno con ícono de check decorativo) y una leyenda de garantía al pie.

#### Scenario: Exactly two distributor cards

- **WHEN** la sección de distribuidores se renderiza
- **THEN** exactamente dos tarjetas de distribuidor están presentes
- **AND** contienen los títulos `<h3>` "PIUSI" y "SENSUS" respectivamente

#### Scenario: PIUSI card content

- **WHEN** la tarjeta PIUSI se renderiza
- **THEN** contiene tres bullets: "Medidores de pulsos y mecánicos para combustible", "Sistemas de gestión de flotas y despacho controlado" y "Pistolas de llenado automático con corte de flujo"
- **AND** contiene la leyenda "Garantía Oficial PIUSI Italia"

#### Scenario: SENSUS card content

- **WHEN** la tarjeta SENSUS se renderiza
- **THEN** contiene tres bullets: "Macromedidores Woltman MeiStream e iPERL", "Módulos de comunicación radiofrecuencia SensusRF" y "Integración de datos AMI/AMR para compañías de agua"
- **AND** contiene la leyenda "Garantía Xylem / Sensus"

### Requirement: Propuesta de valor section renders four pillar cards

La página SHALL renderizar una sección "¿Por qué adquirir a través del representante oficial en Chile?" con eyebrow "GARANTÍA CORPORATIVA RIFF SPA", un párrafo de introducción y exactamente cuatro tarjetas (pillars), cada una con un ícono, una etiqueta indexada numerada ("01 / Respaldo Técnico", "02 / Marco Normativo", "03 / Logística & Repuestos", "04 / Certificación"), un título `<h4>` y un párrafo descriptivo.

#### Scenario: Four pillar cards with indexed labels and titles

- **WHEN** la sección de propuesta de valor se renderiza
- **THEN** exactamente cuatro tarjetas de pillar están presentes
- **AND** contienen las etiquetas "01 / Respaldo Técnico", "02 / Marco Normativo", "03 / Logística & Repuestos" y "04 / Certificación"
- **AND** contienen los títulos `<h4>` "Soporte de Ingeniería Local", "Homologación DGA Chile", "Stock Inmediato en Santiago" y "Garantía Directa de Fabricante"

### Requirement: Icons are rendered with astro-icon and the Lucide set

Todos los íconos de la página SHALL renderizarse con el componente `<Icon>` de `astro-icon` usando el set Lucide (`lucide:*`), en correspondencia con los Material Symbols del diseño de referencia: `wrench` (engineering), `clipboard-check` (assignment_turned_in), `package` (inventory_2), `shield-check` (security), `fuel` (local_gas_station), `radio-tower` (sensors) y `check` (check). Los íconos decorativos SHALL llevar `aria-hidden` y NO SHALL existir archivos SVG de íconos locales.

#### Scenario: Lucide icons used for pillars and distributors

- **WHEN** la página se renderiza
- **THEN** el HTML contiene íconos renderizados por `astro-icon` con nombres `lucide:*` (al menos `lucide:wrench`, `lucide:clipboard-check`, `lucide:package`, `lucide:shield-check`, `lucide:fuel`, `lucide:radio-tower` y `lucide:check`)
- **AND** no se referencian íconos `material-symbols:*`

#### Scenario: No local SVG icon components

- **WHEN** se inspecciona `apps/web/src/components/` y `apps/web/src/pages/`
- **THEN** no existe un componente `.astro` de ícono SVG local nuevo para esta página

### Requirement: Page content containers align with the site Header

Los contenedores de contenido de `/representaciones` (hero y las tres secciones) SHALL usar el utility `.container` del sitio, el mismo que usa `Header.astro`, de modo que compartan el ancho máximo `max-w-7xl` y el padding responsive `px-4 sm:px-6 lg:px-8`. Los contenedores SHALL NOT usar un ancho o padding propio distinto (por ejemplo `mx-auto max-w-[1280px] px-6`), porque produce un desfase horizontal respecto del Header. El contenido interno de cada sección SHALL conservar sus gaps y grillas actuales.

#### Scenario: All page sections use the canonical container

- **WHEN** la página `/representaciones` se renderiza
- **THEN** el contenedor del hero y los contenedores de las secciones de marcas, distribuidores y propuesta de valor llevan la clase `container`
- **AND** ninguno de esos contenedores lleva `max-w-[1280px]`, `px-6` como padding de contenedor ni un ancho máximo alternativo

#### Scenario: Left and right edges match the Header

- **WHEN** se comparan el contenedor del `Header` y el contenedor de la sección de marcas en el HTML renderizado
- **THEN** ambos usan la misma combinación de ancho máximo y padding responsive provista por `.container`
- **AND** las tarjetas de marca quedan alineadas a los mismos bordes izquierdo y derecho que el contenido del Header

### Requirement: Company logos render as optimized image assets

Los logos reales de las marcas SHALL renderizarse con `<Image>` de `astro:assets` a partir de los binarios existentes en `apps/web/src/assets/img/representaciones/`, reemplazando los wordmarks tipográficos de reemplazo en las tarjetas de marcas exclusivas y en las tarjetas de distribuidores autorizados. Cada logo SHALL importarse como `ImageMetadata` en `lib/config/representaciones-page.ts` y renderizarse optimizado (formato WebP generado en build), con `alt` descriptivo, dimensiones provistas por la imagen y `loading="lazy"`. El `<Image>` SHALL vivir dentro del contenedor dedicado con el hook estable `data-brand-logo`, de modo que se preserve la estructura externa de las tarjetas. El mapeo SHALL ser: Apator Powogaz → `apator-logo.png`; RIFF Flow Metering → `Riff-meters.png`; Nitto Seiko → `nittoseiko-logo.jpg`; GL Sanitaria → `GL-Flow.webp`; ILMAP → `Ilmap-logo.webp`; PIUSI → `piusi-logo.png`; SENSUS → `sensus-logo.webp`. SHALL NOT añadirse binarios de imagen nuevos a `src/assets/img/` ni a `public/` en este change.

#### Scenario: Brand cards render the real optimized logos

- **WHEN** la sección de marcas se renderiza
- **THEN** cada una de las cinco tarjetas contiene un `<img>` renderizado por `astro:assets` dentro de su contenedor `data-brand-logo`
- **AND** los `alt` corresponden a "Apator Powogaz", "RIFF Flow Metering", "Nitto Seiko", "GL Sanitaria" e "ILMAP"
- **AND** las imágenes se sirven desde un asset procesado por el pipeline de Astro (ruta generada, no un wordmark de texto)
- **AND** cada imagen declara `loading="lazy"`

#### Scenario: Distributor cards render the real optimized logos

- **WHEN** la sección de distribuidores autorizados se renderiza
- **THEN** las tarjetas de PIUSI y SENSUS contienen un `<img>` renderizado por `astro:assets` dentro de su contenedor `data-brand-logo`
- **AND** los `alt` corresponden a "PIUSI" y "SENSUS"
- **AND** las imágenes se sirven desde un asset procesado por el pipeline de Astro

#### Scenario: Logo containers preserve the card structure

- **WHEN** los componentes `RepresentacionBrandCard.astro` y `DistribuidorCard.astro` se inspeccionan
- **THEN** el logo está envuelto en un contenedor identificable con `data-brand-logo`
- **AND** la sustitución del texto por `<Image>` no altera el layout externo (columna del panel de marca en mobile, fila desde `md`, panel izquierdo de ancho fijo en la tarjeta de marca)

#### Scenario: No new binary assets are introduced

- **WHEN** se revisan `apps/web/src/assets/img/` y `apps/web/public/`
- **THEN** no existe ningún binario de logo nuevo distinto de los siete ya presentes en `apps/web/src/assets/img/representaciones/`

### Requirement: Page styling uses only Riff design tokens (flat design)

La página y sus componentes SHALL estilizarse exclusivamente con las utilities derivadas de los design tokens de Riff (`bg-secondary`, `bg-surface-muted`, `bg-primary`, `text-primary`, `bg-accent`, `text-text`, `text-text-2`, `border-border`, `bg-bg`, `bg-white`, `font-heading`, `font-body`, etc.). SHALL NOT usarse literales hex, clases obsoletas `brand-*`, ni clases `rounded*`/`shadow*` (flat design estricto, radio 0). El remapeo desde la paleta Material del diseño de referencia es: navy → `bg-secondary`; teal `primary` → `text-primary`/`bg-primary`; naranja `secondary-container` → `bg-accent`; superficies de sección → `bg-surface-muted` o `bg-primary-100`; tarjetas → `bg-white` con `border border-border`; mats y controles anidados → `bg-bg`; texto → `text-text`/`text-text-2`.

#### Scenario: Page sections use the muted surface

- **WHEN** la página `/representaciones` se renderiza
- **THEN** las secciones de marcas y de propuesta de valor llevan `bg-surface-muted` como fondo de sección
- **AND** la sección de distribuidores conserva `bg-primary-100`
- **AND** el hero conserva `bg-secondary`

#### Scenario: Cards keep the white content surface

- **WHEN** las tarjetas de marca, distribuidor y propuesta de valor se renderizan
- **THEN** cada tarjeta lleva `bg-white` con `border border-border`
- **AND** los mats internos que lo requieran pueden conservar `bg-bg`

#### Scenario: No raw hex or obsolete brand classes

- **WHEN** los `.astro` de la página y sus componentes se inspeccionan
- **THEN** ninguno contiene literales hex de color (`#XXXXXX`) en clases ni en `style`
- **AND** ninguno contiene clases que empiecen por `bg-brand-`, `text-brand-`, `border-brand-`, etc.

#### Scenario: Flat design (no rounded, no shadow)

- **WHEN** la página se renderiza (estado estático)
- **THEN** el marcado estático contiene `border border-border` en las tarjetas (superficies `bg-white`)
- **AND** no se usan clases `rounded*` ni `shadow*` en las tarjetas de contenido

### Requirement: Page content comes from typed config and presentational components

El contenido de la página SHALL vivir en `apps/web/src/lib/config/representaciones-page.ts`, tipado por contratos en `apps/web/src/lib/types/representaciones-page.ts` (sin `any`). La página SHALL ser un componente "dumb" que compone secciones presentacionales alimentadas por ese config; SHALL NOT incluir lógica de negocio en el frontmatter.

#### Scenario: Content is typed and centralized

- **WHEN** se inspeccionan `apps/web/src/pages/representaciones.astro` y sus componentes
- **THEN** los textos de las cuatro secciones provienen de `lib/config/representaciones-page.ts`
- **AND** el config está tipado con tipos exportados desde `lib/types/representaciones-page.ts`
- **AND** no se usa `any` en los contratos

### Requirement: Page is responsive (mobile-first)

La página SHALL ser mobile-first: las tarjetas de marca SHALL apilar panel de wordmark y contenido en mobile y ponerse en fila desde `md`; la sección de distribuidores SHALL apilarse en mobile y usar dos columnas desde `lg`; la sección de pillars SHALL usar una columna en mobile y cuatro columnas desde `lg`.

#### Scenario: Brand cards stack on mobile and row on md+

- **WHEN** la tarjeta de marca se renderiza con los puntos de quiebre de Tailwind
- **THEN** la disposición base es en columna (`flex-col`)
- **AND** a partir de `md` pasa a fila (`md:flex-row`)

#### Scenario: Distributors and pillars reflow in a grid

- **WHEN** las secciones de distribuidores y de pillars se renderizan
- **THEN** la grilla de distribuidores es de una columna en mobile y `lg:grid-cols-2`
- **AND** la grilla de pillars es de una columna en mobile y `lg:grid-cols-4`
