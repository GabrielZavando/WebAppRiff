## Context

El home de Riff tiene 5 secciones: HeroBanner (h1+h2), PanelHome (h2 + 2×2 stats), SolutionSection (h3 + 4 h4), ServicesSection (h3 + 4 h4), DestacadosSection (h3 + 4 h4). El cliente entregó un mockup de una sección final "pilares" con dos columnas full-bleed, cada una con una fotografía de fondo y un overlay oscuro. Este es el **primer componente del proyecto que combina background images con overlays** — los componentes existentes o bien son secciones planas con color de fondo (SolutionSection, ServicesSection, DestacadosSection) o usan layout de dos columnas sin imágenes de fondo (PanelHome).

La sección debe cerrar el home con una propuesta institucional: columna izquierda con la promesa de valor y CTA de contacto; columna derecha con los 4 pilares de excelencia.

## Goals / Non-Goals

**Goals:**
- Componente dumb presentacional siguiendo el patrón `SolutionSection`/`DestacadosSection` (props tipadas, config hardcodeada, tests TDD)
- Layout de dos columnas 50/50 full-bleed (sin wrapper `container` centrado)
- Fondo izquierdo: foto `sostenibilidad-edificios.jpg` + overlay navy `bg-secondary/80`; fondo derecho: sólido `bg-primary-deep` (token `#006874`) — POST-APPLY FIX 2026-08-09: la foto `planta-tratamiento-ecologica.webp` se elimina de la columna derecha por feedback del cliente
- Tipo `PilarIconName` closed union (patrón `SolutionIconName`)
- Iconos Lucide via `astro-icon` (set único del proyecto)
- Heading outline coherente: h2 (columna izquierda) + h3 (columna derecha), home pasa a 1/3/4/12
- Compatible SSG (build-time), sin fetching ni estado
- Tests Vitest (componente + config + types) + snapshot + e2e de outline actualizados

**Non-Goals:**
- Implementar la ruta `/contacto` (solo se apunta el href; la ruta es trabajo futuro)
- Modificar el modelo de datos ni la API
- Animaciones, parallax o interacciones JS
- Responsive alternativo: las columnas se apilan en mobile (`grid-cols-1`) y son 50/50 en `lg`
- Migración a CMS (el contenido queda hardcodeado, como las demás secciones)

## Decisions

### Decision 1: Componente dumb con props tipadas (patrón de las secciones hermanas)
- **Elección**: `PilaresSection.astro` recibe `PilaresSectionProps` via `Astro.props`; todo el contenido se inyecta desde `index.astro` con spread de `PILARES_SECTION_CONTENT`.
- **Alternativas consideradas**: (a) componente smart que fetch de la API → rechazado: el sitio es SSG estático y ninguna sección del home hace fetching; (b) lectura de env vars en el componente → rechazado: viola la regla de dumb component.
- **Razón**: consistencia total con SolutionSection/ServicesSection/DestacadosSection; permite tests de contrato con `AstroContainer.renderToString` y migración futura a CMS sin tocar el componente.

### Decision 2: Layout full-bleed de dos columnas sin container centrado
- **Elección**: `<section>` sin clase `container`; grid `grid-cols-1 lg:grid-cols-2`; la columna IZQUIERDA es `relative` con imagen de fondo `absolute inset-0 w-full h-full object-cover`, overlay `absolute inset-0 bg-secondary/80`, y contenido `relative z-10` con padding `p-8 md:p-12 lg:p-16`; la columna DERECHA es un bloque plano con `bg-primary-deep` y el mismo padding interno (POST-APPLY FIX 2026-08-09: la derecha ya no tiene foto — ver Decision 3).
- **Alternativas consideradas**: (a) container centrado con max-width → rechazado: el mockup muestra las fotos edge-to-edge; (b) `background-image` CSS en vez de `<Image>` de astro:assets → rechazado: viola la convención `image-assets` del proyecto (astro:assets + sharp).
- **Razón**: el mockup es explícito (fotos full-bleed); `<Image>` da optimización WebP/AVIF, lazy loading y dimensiones explícitas automáticamente.

### Decision 3: Fondos por columna — foto + overlay navy `bg-secondary/80` (izquierda), sólido `bg-primary-deep` (derecha)
- **Elección**: columna izquierda: foto `sostenibilidad-edificios.jpg` + overlay `absolute inset-0 bg-secondary/80` (token `#1F2D40`); columna derecha: fondo plano `bg-primary-deep` (token `#006874`), SIN foto ni overlay.
- **POST-APPLY FIX #1 (2026-08-09)**: la primera implementación usó `bg-secondary-dark/80` en AMBAS columnas. El cliente indicó que las capas de color no corresponden al mockup: la capa izquierda es navy `#1F2D40` y la derecha es teal `#41B3C4` (confirmado por muestreo de píxeles del mockup: zona izquierda ≈ #202B40–#444F62 navy, zona derecha ≈ #0E6C6E–#116F77 teal). Se aplicó `bg-secondary/80` (izq) + `bg-primary/80` (der).
- **POST-APPLY FIX #2 (2026-08-09)**: tras revisión visual, el cliente reportó que la columna con la foto `planta-tratamiento-ecologica.webp` "no se ve nada de bien" y pidió: ELIMINAR la imagen de fondo de la columna derecha y reemplazarla por el color `#006874` (fondo sólido). `#006874` ya existe como token `--color-primary-deep` en ambos globals.css (añadido en el change destacados-section), así que la columna derecha pasa a `bg-primary-deep` sin imagen ni overlay; `rightImage`/`rightImageAlt` salen del contrato de props.
- **Alternativas consideradas**: (a) negro puro `bg-black/70` → rechazado: hex/token no canónico; (b) `bg-secondary-dark/80` por ambas → rechazado tras el feedback del cliente; (c) otro token teal existente para la derecha → rechazado: `bg-primary-deep` (#006874) es el valor exacto pedido por el cliente y ya es canónico.
- **Razón**: cada columna hereda una familia de color distinta del design system (navy secondary para la propuesta institucional, teal deep para los pilares); el fondo sólido de la derecha elimina el problema visual de la foto y mantiene contraste AA del texto blanco sobre `#006874` (ratio ≈ 8:1).

### Decision 4: Jerarquía de headings h2 (izquierda) + h3 (derecha)
- **Elección**: columna izquierda usa `<h2>` para "Comprometidos con la Optimización de Recursos"; columna derecha usa `<h3>` para "Nuestros Pilares de Excelencia". El eyebrow es `<span>` decorativo.
- **Alternativas consideradas**: (a) ambos `<h3>` → rechazado: el headline institucional es tan prominente como el de PanelHome (h2); (b) ambos `<h2>` → rechazado: infla el outline de la home.
- **Razón**: el home pasa de 1/2/3/12 a 1/3/4/12, coherente con la jerarquía existente (h1 HeroBanner → h2 secciones principales → h3 secciones portfolio → h4 cards). Los e2e de outline se actualizan (tarea 5).

### Decision 5: `PilarIconName` como closed union (patrón `SolutionIconName`)
- **Elección**: `export type PilarIconName = 'recycle' | 'clock' | 'monitor' | 'headphones'` en `lib/types/pilares-section.ts`.
- **Alternativas consideradas**: `string` libre → rechazado: un typo (`'recicle'`) fallaría en runtime con icono vacío; el union cerrado rompe en compile time.
- **Razón**: patrón ya validado en SolutionSection (design.md Decision 11 de ese change); los 4 iconos fueron verificados contra `@iconify-json/lucide/icons.json`.

### Decision 6: CTA accent sólido "HABLEMOS DE TU PROYECTO" → `/contacto`
- **Elección**: `<a>` con `bg-accent text-white hover:bg-accent-dark font-heading font-semibold uppercase text-xs tracking-wide px-6 py-3 transition-colors`, href `/contacto`.
- **Alternativas consideradas**: (a) CTA navy `bg-secondary` (como PanelHome) → rechazado: el mockup muestra el botón naranja accent; (b) outline accent → rechazado: el mockup es un botón sólido.
- **Razón**: el mockup es explícito; `#F26A21` con texto blanco cumple WCAG AA (ratio ~4.6:1, verificado por e2e de contrast). La ruta `/contacto` es futura: el href se deja apuntando a ella (como hicieron `/servicios` antes de existir).

### Decision 7: Estructura de pillar item — icon + label, sin número
- **Elección**: cada pillar es un `<div>` con `<Icon name={`lucide:${pilar.icon}`} class="h-6 w-6 text-primary" aria-hidden="true" />` y `<span class="text-white font-heading">`.
- **POST-APPLY FIX (2026-08-09)**: la primera implementación usó iconos `text-accent` (naranja); el cliente pidió iconos en `#41B3C4` → token `text-primary`. Coherente con el nuevo fondo `bg-primary-deep` (teal oscuro): los iconos teal claro destacan sobre el fondo sólido.
- **Alternativas consideradas**: (a) iconos blancos → rechazado: el mockup muestra iconos teal; (b) iconos accent naranja → rechazado tras el feedback del cliente; (c) `<ul><li>` semántico → descartado en favor de `<div>` porque el mockup no es una lista ordenada y el patrón de las secciones hermanas usa `<div>`/`<article>`.
- **Razón**: coherencia con el mockup y con el uso de `astro-icon` de SolutionSection (`aria-hidden="true"` para iconos decorativos).

### Decision 8: Contenido hardcodeado en `lib/config/pilares-section.ts`
- **Elección**: constante `PILARES_SECTION_CONTENT: Readonly<PilaresSectionProps>` con eyebrow "Sostenibilidad y Eficiencia", headline "Comprometidos con la Optimización de Recursos", descripción institucional, CTA "HABLEMOS DE TU PROYECTO" → `/contacto`, rightEyebrow "Estándares de Calidad" (POST-APPLY FIX 2026-08-09: pedido por el cliente para espejar la estructura de la columna izquierda, color `text-primary`), rightHeadline "Nuestros Pilares de Excelencia", rightDescription, 4 pilares (Sostenibilidad/recycle, Proyectos a tiempo/clock, Tecnología de Vanguardia/monitor, Soporte Técnico Especializado/headphones), `leftImage` = `sostenibilidad-edificios.jpg`. `rightImage`/`rightImageAlt` se ELIMINAN del contrato (POST-APPLY FIX 2026-08-09: la columna derecha es fondo sólido `bg-primary-deep`).
- **Alternativas consideradas**: CMS/API → rechazado: MVP hardcodeado como todas las secciones del home.
- **Razón**: single source of truth testeable; la migración CMS futura solo toca config.

## Risks / Trade-offs

- **[Risk] Overlay navy `#1F2D40` al 80% puede oscurecer más la foto izquierda** → Mitigación: el 80% deja ver la fotografía; ajustes a `/70` serían un cambio menor.
- **[Risk] Fondo sólido `#006874` (derecha) podría verse "plano" vs el resto del home** → Mitigación: aceptado — es el pedido explícito del cliente; los iconos `text-primary` dan contraste; el párrafo `text-white/80` mantiene AA sobre `#006874` (ratio ≈ 8:1).
- **[Risk] Ruta `/contacto` inexistente (404)** → Mitigación: aceptado explícitamente (mismo caso que `/servicios` al inicio); el href es el contrato, la ruta llega en un change futuro.
- **[Trade-off] Columnas apiladas en mobile (grid-cols-1)** → La foto izquierda y el bloque teal derecho se ven en secuencia vertical; aceptado por mobile-first del proyecto.
- **[Trade-off] Sin container centrado** → El contenido de texto no se alinea con el grid del resto del sitio; el mockup lo exige (full-bleed) y el padding interno (`p-8 md:p-12 lg:p-16`) mantiene legibilidad.
- **[Trade-off] La foto `planta-tratamiento-ecologica.webp` queda sin uso en `assets/img/`** → Aceptado: es un asset del cliente que puede reutilizarse en el futuro (p. ej. página de sostenibilidad); no se borra del repo.

## Open Questions

- (ninguna pendiente — posiciones, imágenes, CTA y textos definidos con el cliente)