## 1. Types & Config

- [x] 1.1 Crear `apps/web/src/lib/types/solution-section.ts` con `SolutionIconName` (union literal: `'gauge' | 'droplet' | 'flask-conical' | 'settings-2'`), `Solution` (`{ readonly slug: string; readonly title: string; readonly description: string; readonly image: ImageMetadata; readonly imageAlt: string; readonly icon: SolutionIconName; readonly href: string }`) y `SolutionSectionProps` (`{ readonly eyebrow: string; readonly headline: string; readonly description: string; readonly solutions: readonly Solution[] }`). El tipo `ImageMetadata` viene de `astro:assets` (import type). Todos los campos readonly.
- [x] 1.2 Crear `apps/web/src/lib/config/solution-section.ts` importando las 4 WebP de `@/assets/img/solucion-{medicion,agua,quimicos,control}.webp` (usando `import medicionImg from '@/assets/img/solucion-medicion.webp'` y el patrón análogo para las otras 3) y exportando `SOLUTIONS_DATA: readonly Solution[]` con 4 entries en orden: `{ slug: 'medicion-de-fluidos', title: 'Medición de Fluidos', description: '<copy del PNG>', image: medicionImg, imageAlt: 'Equipos de medición de fluidos en planta industrial', icon: 'gauge', href: '/soluciones' }`, `{ slug: 'tratamiento-de-agua', title: 'Tratamiento de Agua', description: '<copy del PNG>', image: aguaImg, imageAlt: 'Sistema de tratamiento de agua industrial', icon: 'droplet', href: '/soluciones' }`, `{ slug: 'productos-quimicos', title: 'Productos Químicos', description: '<copy del PNG>', image: quimicosImg, imageAlt: 'Estantería de productos químicos industriales', icon: 'flask-conical', href: '/soluciones' }`, `{ slug: 'control-y-accesorios', title: 'Control y Accesorios', description: '<copy del PNG>', image: controlImg, imageAlt: 'Manifold de válvulas y manómetros de control industrial', icon: 'settings-2', href: '/soluciones' }`. Exportar también `SOLUTION_SECTION_CONTENT: Readonly<SolutionSectionProps>` con `eyebrow: 'PORTAFOLIO'`, `headline: 'Nuestras Soluciones'`, `description: 'Sistemas integrales para el control preciso de fluidos y procesos químicos industriales.'`, `solutions: SOLUTIONS_DATA`.
- [x] 1.3 Test unitario `apps/web/src/lib/config/__tests__/solution-section.test.ts`: `SOLUTION_SECTION_CONTENT.solutions` tiene longitud exactamente `4`
- [x] 1.4 Test unitario: `SOLUTION_SECTION_CONTENT.eyebrow === 'PORTAFOLIO'`, `headline === 'Nuestras Soluciones'`, `description` es string no vacío
- [x] 1.5 Test unitario: los títulos en orden son exactamente `['Medición de Fluidos', 'Tratamiento de Agua', 'Productos Químicos', 'Control y Accesorios']`
- [x] 1.6 Test unitario: cada `SOLUTIONS_DATA[i].href === '/soluciones'`
- [x] 1.7 Test unitario: los iconos en orden son exactamente `['gauge', 'droplet', 'flask-conical', 'settings-2']` y cada uno pertenece al tipo `SolutionIconName`
- [x] 1.8 Test unitario: cada `SOLUTIONS_DATA[i].imageAlt` es string no vacío Y distinto de `SOLUTIONS_DATA[i].title` (no repite el título como ALT)
- [x] 1.9 Test unitario: cada `SOLUTIONS_DATA[i]` tiene `image` que es un `ImageMetadata` (typeof === 'object' con `src` property)
- [x] 1.10 Test unitario: cada `SOLUTIONS_DATA[i].slug` cumple el regex `/^[a-z0-9-]+$/` (kebab-case estricto)

## 2. Componente SolutionSection.astro (TDD)

- [x] 2.1 Escribir `apps/web/src/components/__tests__/SolutionSection.test.ts` (AstroContainer) con constante `baseProps: SolutionSectionProps` usando los valores de `SOLUTION_SECTION_CONTENT` (importar desde `lib/config/solution-section`). Incluir helper `stripHtmlComments` y `countOccurrences` (mismo patrón que `PanelHome.test.ts`).
- [x] 2.2 Test: el render produce un `<section>` como elemento más externo
- [x] 2.3 Test: el `<section>` lleva una clase de padding vertical (`py-16` o `md:py-24` — sección del body con aire)
- [x] 2.4 Test: el header del `<section>` contiene un grid con `grid-cols-1` y `lg:grid-cols-2` (responsive header)
- [x] 2.5 Test: el header contiene un `<span>` (eyebrow) con texto "PORTAFOLIO", clase `uppercase`, clase de color accent (`text-accent`), y NO es un heading
- [x] 2.6 Test: el header contiene un `<h3>` con el texto del headline verbatim ("Nuestras Soluciones"), clase `text-secondary` y clase `font-heading`
- [x] 2.7 Test: el header contiene un `<div>` (barra teal) con clase `h-1`, clase `w-16`, clase `bg-primary`, y aparece después del `<h3>` en el HTML
- [x] 2.8 Test: el header contiene un `<p>` (descripción) con el texto verbatim y clase `text-text-2`
- [x] 2.9 Test: existe un grid de cards con clases `grid-cols-1`, `sm:grid-cols-2` y `lg:grid-cols-4`
- [x] 2.10 Test: el grid de cards contiene exactamente 4 elementos `<article>` (cards)
- [x] 2.11 Test: cada `<article>` contiene un `<div>` con clase `bg-primary` que a su vez contiene un `<svg>` (badge con icono Lucide)
- [x] 2.12 Test: cada `<article>` contiene un `<img>` o `<picture>` con `loading="lazy"` y un `alt` no vacío
- [x] 2.13 Test: cada `<article>` contiene un `<h4>` con el título verbatim, clase `text-secondary` y clase `font-heading`
- [x] 2.14 Test: cada `<article>` contiene un `<p>` (descripción) con clase `text-text-2`
- [x] 2.15 Test: cada `<article>` contiene un `<a href="/soluciones">` con texto que incluye "SABER MÁS", clase `text-primary` y contiene un `<svg>` (icono `lucide:arrow-right`) con `aria-hidden="true"`
- [x] 2.16 Test: el HTML renderizado NO contiene `<h1>` ni `<h2>` (la home usa `<h1>` HeroBanner + `<h2>` PanelHome; SolutionSection añade solo `<h3>` + `<h4>`)
- [x] 2.17 Test: el HTML renderizado contiene exactamente un `<h3>` y exactamente 4 `<h4>` (uno por card)
- [x] 2.18 Test: el HTML renderizado NO contiene literales hex (`/#[0-9a-fA-F]{3,8}/` regex)
- [x] 2.19 Test: el HTML renderizado NO contiene tokens `brand-*` deprecados (`bg-brand-teal`, `text-brand-navy`, `text-brand-orange`, etc.)
- [x] 2.20 Test: el `<h3>` headline NO lleva `aria-hidden="true"` ni `tabindex="-1"`
- [x] 2.21 Test: el icono arrow dentro del link lleva `aria-hidden="true"` (es decorativo, el texto "SABER MÁS" es el nombre accesible)
- [x] 2.22 Test: cada `<a>` "SABER MÁS" NO lleva `tabindex="-1"` ni `aria-hidden="true"`
- [x] 2.23 Test: el frontmatter del `SolutionSection.astro` NO contiene la cadena literal `import.meta.env`
- [x] 2.24 Test: el frontmatter del `SolutionSection.astro` NO contiene la cadena literal `fetch(`
- [x] 2.25 Test: el eyebrow `<span>` lleva clase `text-accent` (naranja — no se permite `text-secondary` ni `text-primary`)
- [x] 2.26 Test: snapshot del HTML renderizado con las `baseProps` (regresión visual)
- [x] 2.27 Crear `apps/web/src/components/SolutionSection.astro` con props tipadas `SolutionSectionProps`, frontmatter sin lógica de negocio no trivial (solo destructuring de props + import de `Icon` desde `astro-icon/components` + `Image` desde `astro:assets`). Estructura JSX completa: `<section class="py-16 md:py-24 bg-bg">` → `<div class="container mx-auto px-4 sm:px-6 lg:px-8">` → **header** (`<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-12">`) con mitad izquierda (`<div>` con `<span class="block text-xs font-heading font-semibold uppercase tracking-wider text-accent">{eyebrow}</span>`, `<h3 class="mt-2 text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-secondary">{headline}</h3>`, `<div class="h-1 w-16 bg-primary mt-3"></div>`) y mitad derecha (`<p class="text-base text-text-2 lg:pt-2">{description}</p>`); **grid de cards** (`<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">`) mapeando `solutions` con `<article class="relative bg-white shadow-1 hover:shadow-3 transition-shadow">` → badge (`<div class="absolute top-3 left-3 bg-primary p-2 z-10"><Icon name={`lucide:${solution.icon}`} class="h-5 w-5 text-white" /></div>`), imagen (`<Image src={solution.image} alt={solution.imageAlt} widths={[400, 800]} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" loading="lazy" class="w-full aspect-[4/3] object-cover" />`), contenido (`<div class="p-5"><h4 class="text-lg font-heading font-semibold text-secondary">{solution.title}</h4><p class="mt-2 text-sm font-body text-text-2 line-clamp-3">{solution.description}</p><a href={solution.href} class="mt-4 inline-flex items-center gap-1 font-heading font-semibold uppercase text-xs tracking-wide text-primary hover:text-primary-dark transition-colors">SABER MÁS <Icon name="lucide:arrow-right" class="h-3 w-3" aria-hidden="true" /></a></div>`)
- [x] 2.28 Verificar que las utilidades `bg-bg`, `shadow-1`, `shadow-3`, `text-accent`, `text-text-2`, `font-heading`, `font-body`, `text-primary`, `text-primary-dark`, `text-secondary`, `bg-primary` están disponibles en `globals.css` (ya existen en `@theme` desde `design-system-revision` — solo confirmar consumo)
- [x] 2.29 POST-APPLY UPDATE (alineación con el sistema de diseño): el CTA "SABER MÁS" de cada card debe renderizarse como **botón sólido primario** del sistema (mismo patrón que HeroBanner "VER SERVICIOS" / Header "SOLICITAR COTIZACIÓN" / PanelHome "SOLICITAR ASESORÍA TÉCNICA"): `mt-4 inline-flex items-center gap-1 bg-primary hover:bg-primary-dark text-white font-heading font-semibold uppercase text-xs tracking-wide px-6 py-3 transition-colors` (flat, sin `rounded-*`). El text link original (`text-primary hover:text-primary-dark` sin fondo) NO está alineado con el sistema de diseño. Actualizar spec.md (Requirement "responsive grid of solution cards" + scenario "Each card link renders...") y design.md (Decisions 4 y 8, Non-Goal hover) ANTES de tocar código; actualizar el test unitario 2.15 y el snapshot 2.26 + E2E 5.5; regenerar snapshot con `-u`

## 3. Assets de imagen (placeholders)

- [x] 3.1 Crear 4 placeholders WebP en `apps/web/src/assets/img/` nombrados exactamente `solucion-medicion.webp`, `solucion-agua.webp`, `solucion-quimicos.webp`, `solucion-control.webp`. Cada placeholder: gradiente teal (de `--color-primary-light` `#D2EEF2` a `--color-primary` `#41B3C4`) con etiqueta identificatoria centrada en mayúsculas (ej. "MEDICIÓN DE FLUIDOS"). Dimensiones 800x600 (4:3 aspect ratio, ratio target del componente). Optimizados con `sharp` o herramienta análoga, peso < 50KB cada uno.
- [x] 3.2 Verificar que `astro:assets` y la dependencia `sharp` están configurados (declarados en `apps/web/package.json` y `astro.config.mjs`); confirmar queNO se usa `@astrojs/image` (deprecado y prohibido por frontend-standards § "Imágenes del sitio")
- [x] 3.3 Documentar como Known TODO al archivar: el cliente reemplazará los 4 placeholders WebP con fotos reales del catálogo antes del deploy a producción (mismo patrón que `panel-home` con sus tareas 4.13/4.14). El reemplazo es trivial (sustituir 4 archivos en `assets/img/`) y el pipeline `astro:assets` regenera los optimizados automáticamente. **NOTA post-apply: el cliente ya entregó las fotos reales — resuelto por la task 3.4, el Known TODO se elimina y ya no aplica como TODO de archivo**
- [x] 3.4 POST-APPLY UPDATE (fotos reales del cliente): reemplazar los imports de las 4 imágenes en `apps/web/src/lib/config/solution-section.ts`: `medicionImg` ← `@/assets/img/medicion-fluidos.webp`, `aguaImg` ← `@/assets/img/tratamiento-agua.webp`, `quimicosImg` ← `@/assets/img/productos-quimicos.webp`, `controlImg` ← `@/assets/img/control-accesorios.webp`. Borrar los 4 placeholders `solucion-*.webp` de `assets/img/`. Actualizar el test unitario 1.9/1.10 (assert de nombre de archivo esperado por card) y el snapshot 2.26 (regenerar con `-u` porque las rutas `/_astro/...` cambian). Los `imageAlt` descriptivos existentes se mantienen. Ejecutar E2E 5.7 (las 4 fotos cargan sin 404) y build para confirmar optimización

## 4. Integración en index.astro

- [x] 4.1 Actualizar `apps/web/src/pages/index.astro`: importar `SolutionSection` de `@/components/SolutionSection.astro` y `SOLUTION_SECTION_CONTENT` de `@/lib/config/solution-section`; añadir `<SolutionSection {...SOLUTION_SECTION_CONTENT} />` DESPUÉS del `<PanelHome {...PANEL_HOME_CONTENT} />` existente dentro del `<Layout>` slot
- [x] 4.2 Verificar que el orden DOM en `/` es: `<TopHeader />` → `<header>` (site-header) → `<div role="search">` (SearchForm) → `<section>` (HeroBanner) → `<section>` (PanelHome) → `<section>` (SolutionSection) — ni HeroBanner ni PanelHome se modifican
- [x] 4.3 Verificar que el documento renderizado contiene exactamente un `<header>` (no se introduce un nuevo landmark) y un solo `<h1>` (el del HeroBanner)

## 5. Tests E2E (Playwright)

- [x] 5.1 E2E `apps/web/e2e/solution-section.spec.ts`: en desktop (>= 1024px) el `<section>` del SolutionSection es visible y contiene un `<h3>` con el texto "Nuestras Soluciones"
- [x] 5.2 E2E: en desktop el grid de cards tiene 4 columnas (comprobar via bounding boxes que los 4 `<article>` están lado a lado en una sola fila, no apilados)
- [x] 5.3 E2E: en tablet (640-1023px, ej. 768px) el grid de cards tiene 2 columnas (2 filas de 2 cards)
- [x] 5.4 E2E: en mobile (< 640px, ej. 375px) el grid de cards tiene 1 columna (4 cards apiladas verticalmente)
- [x] 5.5 E2E: cada card visible contiene un badge teal (rgb(65, 179, 196)) con un SVG (icono Lucide), una imagen con `loading="lazy"` y `alt` no vacío, un `<h4>` con el título, un `<p>` con la descripción y un `<a href="/soluciones">` con texto "SABER MÁS"
- [x] 5.6 E2E: el documento contiene exactamente un `<h1>` (regresión SEO on-page — HeroBanner lo aporta), un `<h2>` (PanelHome) y un `<h3>` (SolutionSection) + 4 `<h4>` (cards)
- [x] 5.7 E2E: las 4 imágenes de las cards se cargan sin 404 (network response status === 200 o >= 200 < 300) — para los placeholders WebP en `src/assets/img/`
- [x] 5.8 E2E: preserva el orden DOM de la home TopHeader → header → div[role="search"] → section(hero) → section(panel) → section(solutions) (la sección nueva aparece después del PanelHome)
- [x] 5.9 E2E: WCAG AA Normal contraste — texto navy (`text-secondary` `#1F2D40`) del `<h4>` sobre fondo blanco de la card (>= 4.5:1)
- [x] 5.10 E2E: WCAG AA contraste del eyebrow naranja (`text-accent` `#F26A21`) sobre fondo blanco. Si NO cumple AA Normal (4.5:1) — el ratio calculado es ~3.34:1 — entonces validar que cumple AA Large (>= 3:1 con bold >= 14pt). Si no cumple AA Large, ajustar a `text-sm` (14px → AA Large aplica) o cambiar el token de la clase a `text-accent-dark` (`#D14E12`, ratio ~4.6:1). Documentar la decisión en `design.md` § Decisions como post-apply update (mismo patrón que `panel-home` Decision 10)
- [x] 5.11 E2E: el link "SABER MÁS" de cada card es focusable por teclado (Tab) y al activarlo navega a `/soluciones` (verificar `href` y comportamiento click)
- [x] 5.12 E2E: en hover sobre cada card, la sombra pasa de `shadow-1` a `shadow-3` (validar que `box-shadow` cambia en estado hover via `:hover`)

## 6. Verificación & Cleanup

- [x] 6.1 `npm run build --workspace=apps/web` → success
- [x] 6.2 `npm run typecheck --workspace=apps/web` → success
- [x] 6.3 `npm run lint --workspace=apps/web` → success
- [x] 6.4 `npm run test --workspace=apps/web` → all pass (unit + AstroContainer + snapshot)
- [x] 6.5 `npm run test:smoke --workspace=apps/web` → E2E Playwright pass
- [x] 6.6 `openspec validate solution-section` → valid
- [x] 6.7 `openspec status --change solution-section --json` → `isComplete: true` (applyRequires cubierto por las 6 secciones)

---

## Known TODOs (accepted at archive time)

The following items are intentionally left unchecked at archive. They will be
accepted as known TODOs by the user when archiving this change (the
implementation is functionally complete; these are external-action items that
depend on content delivery or post-archive verification):

- **Copy final de las cards** (relacionado con task 1.2): las descripciones de
  las 4 cards se extraen verbatim del PNG `docs/design/components/SolutionSection.png`
  (texto truncado visible en la imagen). El cliente entregará el copy definitivo
  completo antes del deploy; ajustable en un solo lugar (`lib/config/solution-section.ts`).

These adjustments, if requested by the client, can be made in follow-up
changes without re-opening `solution-section`.
