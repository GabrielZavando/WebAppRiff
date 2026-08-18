## Context

El sitio público Astro (apps/web/) ya tiene `SearchForm.astro` integrado en `Layout.astro` y visible por defecto en casi todas las páginas (`showSearch` default `true`, oculto solo en Contacto). El producto requiere tres ajustes de alcance y estilo:

1. **Alcance del buscador**: mostrarse solo en Inicio, Productos, Servicios, Cotización y la ficha de producto; ocultarse en Contacto, Marcas y rutas futuras sin opt-in.
2. **Fondo navy con gradiente del header**: en Productos, Servicios, Cotización y ficha de producto el fondo del buscador debe ser el mismo gradiente linear del header en reposo — `bg-linear-to-r from-secondary to-secondary-light` (de `--color-secondary` #1F2D40 a `--color-secondary-light` #35455E) — para que el buscador y el header adyacentes se fundan visualmente en una sola superficie. Se reusan exactamente las mismas utilities que `<Header>`, sin hex literal ni nuevo token.
3. **Ocultar select de categorías en Productos**: la página `/productos` ya tiene su propio filtro lateral (`ProductsFiltersSidebar`), así que el `<select name="categoriaId">` global debe omitirse ahí (se mantiene en Servicios, Cotización, ficha de producto e Inicio).

Además, las rutas `/servicios` y `/marcas` hoy dan 404 (el menú apunta a ellas). Este change las crea como páginas reales con el shell de `Layout` (TopHeader + Header + Footer + SiteCredits) y un `<main>` placeholder para llenar en sesiones futuras; `/servicios` opta al buscador navy y `/marcas` lo oculta.

Decisiones confirmadas con el cliente:
- La ficha de producto (`/productos/{slug}`) mantiene el buscador y lo muestra con fondo navy + select de categorías visible.
- `/servicios` y `/marcas` usan `Layout` (Header/Footer provistos por el shell) y un `<main>` placeholder; el contenido real entra en una próxima sesión.

## Goals / Non-Goals

**Goals:**
- `SearchForm.astro` sigue siendo un componente presentacional (dumb); acepta dos nuevos props booleanos: `secondaryBg` (fondo navy) y `showCategorySelect` (visibilidad del select).
- `Layout.astro` orquesta la visibilidad por página vía `showSearch`, `searchSecondary` y `searchShowCategorySelect`, propagándolos a `SearchForm` a través de `searchFormProps`.
- Crear `/servicios` y `/marcas` como páginas no-404 con shell de Layout.
- Reusar el mismo gradiente `bg-linear-to-r from-secondary to-secondary-light` que `<Header>`/`<TopHeader>`; sin hex literal en `class` (frontend-standards), sin nuevos tokens → sin impacto en la paridad de tokens con `apps/admin/src/styles/globals.css`.

**Non-Goals:**
- NO se modifica la lógica de submit ni `buildSearchHref` (ya canónica).
- NO se crea la página `/productos` completa (ya existe como catálogo) ni el contenido real de Servicios/Marcas (queda para sesión futura).
- NO se cambia el comportamiento de scroll (`.site-search` sigue transicionando a navy al hacer scroll vía `header-scroll.css`); el nuevo `bg-secondary` es solo el estado en reposo.
- NO se alteran los controles internos (select/input `bg-white`, botón `bg-primary`); se conservan legibles sobre el navy, igual que en modo `transparent`.

## Decisions

1. **Gradiente del header para el navy**: el header usa `bg-linear-to-r from-secondary to-secondary-light` (de `--color-secondary` #1F2D40 a `--color-secondary-light` #35455E). El buscador reusa exactamente esas mismas utilities para que ambas superficies adyacentes compartan el mismo gradiente y se vean continuas. Cumple frontend-standards (prohibido hex literal en componentes) y no requiere sincronizar `apps/admin/src/styles/globals.css` (tokens ya paritarios).

2. **Tercera variante de wrapper vía prop booleana**: el wrapper `role="search"` elige con `class:list`: `transparent ? 'bg-transparent' : secondaryBg ? 'bg-linear-to-r from-secondary to-secondary-light' : 'bg-white border-b border-border'`. `transparent` (modo hero de Inicio) tiene precedencia sobre `secondaryBg`. Al pasar al gradiente del header se elimina `bg-white border-b border-border` (paridad con `transparent`, que tampoco lleva borde). La transición de scroll existente (`body.home[data-scrolled='true'] .site-search { background-color: var(--color-secondary); }`) sigue aplicando navy plano al hacer scroll en Inicio, así que no se duplica lógica; en las páginas navy el gradiente ya es el estado en reposo.

3. **`showCategorySelect` oculta solo el bloque `<select>`**: cuando es `false`, se omite el `<div class="w-full md:w-56">` con su `<label>` y `<select name="categoriaId">`. El `<input>` ya usa `md:flex-1`, por lo que se expande para ocupar el ancho que dejó el select; el botón queda igual. No cambia el render por defecto (default `true`), por lo que el snapshot existente de `SearchForm.test.ts` sigue válido.

4. **Visibilidad por opt-in en Layout, no por URL**: `Layout` conserva `showSearch` default `true` (las páginas existentes que lo muestran no requieren cambio), y las páginas que deben ocultarlo pasan `showSearch={false}` (Contacto ya lo hace; Marcas nuevo lo hará). Las tres páginas navy pasan `searchSecondary={true}`. Esto mantiene el principio de que la página declara su intención de layout (igual que el patrón existente `showSearch`/`hero`), evitando acoplar `Layout` a la lista de rutas.

5. **Páginas nuevas con shell de Layout**: `/servicios` y `/marcas` usan `<Layout>` directamente, aprovechando TopHeader, Header, Footer y SiteCredits. No se duplican componentes de Header/Footer en la página. Cada una aporta un `<main class="container py-16">` con un `<h1>` placeholder para el contenido futuro.

6. **Matriz de comportamiento resultante** (fuente de verdad para los scenarios):

| Ruta | Buscador | Fondo en reposo | Select categorías |
|------|----------|-----------------|-------------------|
| `/` (Inicio) | Sí | transparente (hero) | Sí |
| `/productos` | Sí | navy (gradiente del header) | NO |
| `/servicios` | Sí | navy | Sí |
| `/cotizacion` | Sí | navy | Sí |
| `/productos/{slug}` | Sí | navy | Sí |
| `/contacto` | NO | — | — |
| `/marcas` | NO | — | — |

## Risks / Trade-offs

- **Risk**: romper el snapshot de `SearchForm.test.ts` al añadir props → **Mitigation**: los nuevos props tienen defaults que reproducen el render actual; el test de snapshot por defecto queda intacto y se añaden tests específicos para las nuevas variantes.
- **Risk**: que el buscador siga apareciendo en rutas futuras por el default `true` → **Mitigation**: el requisito queda documentado en la spec; cualquier nueva página que no deba mostrarlo pasa `showSearch={false}` explícitamente (patrón ya usado por Contacto).
- **Risk**: inconsistencia visual al ocultar el select en `/productos` (input debe expandirse) → **Mitigation**: el `<input>` ya usa `md:flex-1`; se valida con E2E que el `searchbox` ocupa el ancho completo y el formulario mantiene una sola fila en desktop.
- **Risk**: contraste del buscador navy → **Mitigation**: los controles internos conservan `bg-white` (texto oscuro legible) y el botón `bg-primary`, igual que en modo `transparent` sobre el hero; no se introducen campos de texto claros sobre navy.
