## Context

El sitio público Astro (apps/web/) se encuentra en Fase A (bootstrap). Ya existen `TopHeader.astro` (utility bar, archivado en `2026-08-02-top-header`) y `Header.astro` (header principal con navegación de 5 items + CTA, archivado en `2026-08-02-site-header`), ambos integrados en `Layout.astro`. El layout actual renderiza `<TopHeader /> → <Header /> → <slot />`.

La imagen de referencia `docs/design/components/SearchForm.png` muestra la barra de búsqueda que va debajo del header: una franja blanca con un `<select>` "Todas las categorías" a la izquierda (con caret hacia abajo), un `<input type="search">` placeholder "¿Qué solución está buscando?" en el centro, y un botón "BUSCAR" con fondo `brand-orange` a la derecha.

El contrato de búsqueda del backend ya está definido en `docs/api-spec.yml` (`GET /api/v1/products?search=...&categoriaId=...`), pero la página `/productos` que consume esa API todavía no existe en el sitio público — se construirá en el change futuro `product-catalog`. Este change entrega el formulario que produce la URL canónica `/productos?q=<query>&categoriaId=<id>` mediante submit nativo HTML; la página de destino entra como placeholder mínimo para evitar 404 durante el MVP.

Decisiones confirmadas con el cliente:
- Submit nativo HTML (`<form method="get" action="/productos">`): cero JS de submit, navegación estándar HTTP GET, máxima accesibilidad y compatibilidad con SSG.
- Categorías hardcoded en `lib/config/search-form.ts` (mismo patrón que `NAVIGATION_ITEMS` del site-header). El fetch dinámico desde Firestore entra en el change `product-catalog` cuando la página `/productos` consuma el API real.
- "Todas las categorías" es una opción real del `<select>` con `value=""` (limpia el filtro de categoría en la URL resultante).
- Layout mobile (< 768px): stack vertical (select full-width → input full-width → botón full-width).
- Sin iconos adicionales (lupa, etc.) — solo el caret nativo del `<select>` y el texto "BUSCAR" del botón.

## Goals / Non-Goals

**Goals:**
- Componente `SearchForm.astro` presentacional puro (dumb): recibe `categories`, `config`, `initialQuery?`, `initialCategoriaId?` por props; sin fetching ni estado de dominio
- Lógica de construcción de URL (`buildSearchHref`) extraída a `lib/config/search-form.ts` para testearla aislada (SRP Astro: frontmatter sin lógica de negocio no trivial)
- Submit nativo HTML: el navegador construye la query string con `name`/`value` de los campos; cero JS de hydration
- URL canónica de resultados: `/productos?q=<trimmed>&categoriaId=<id>` omitiendo campos vacíos (no `?q=&categoriaId=`). Implementado vía `formaction`/`onsubmit` mínimo que arma la URL limpia — ver Decisión 4
- Tests Vitest (unit + AstroContainer + snapshot) y E2E Playwright cubriendo desktop/mobile/accesibilidad
- Single landmark `<header>` preservado (el SearchForm va en un `<div role="search">` separado, no introduce un nuevo `<header>`)

**Non-Goals:**
- NO se crea la página `/productos` completa — solo un placeholder mínimo para que el flujo end-to-end funcione; el catálogo real entra en el change `product-catalog`
- NO se carga la lista de categorías desde Firestore — hardcoded por ahora, consistente con `NAVIGATION_ITEMS`
- NO se añaden filtros adicionales (rango de precio, destacado, subcategoría, etc.) — solo categoría + texto libre
- NO se implementa autocomplete / typeahead / dropdown de sugerencias — submit nativo HTML; una mejora futura podría añadirlo
- NO se modifica la spec `site-header` (sus Non-Goals ya declaran "NO búsqueda en el header"; este change coloca el SearchForm fuera del landmark `<header>` del header)
- NO se hace shrink-on-scroll del SearchForm — comportamiento estático
- NO se añade un icono de lupa al input (mantener paridad visual con la imagen de referencia)

## Decisions

1. **Dumb presentational component**: `SearchForm.astro` no hace fetching ni lee `import.meta.env`. `Layout.astro` importa `CATEGORY_OPTIONS` y `SEARCH_FORM_CONFIG`, computa las props iniciales (opcional, desde `Astro.url.searchParams` para preservar estado al volver de `/productos`), y las pasa al componente. Cumple SRP de `frontend-standards.md` § "Principios de Diseño — Astro".

2. **Lógica de URL en `lib/`**: `buildSearchHref(query, categoriaId)` en `lib/config/search-form.ts`. Reglas: trim de espacios en `query`; si `query` trimado es vacío, se omite; si `categoriaId` es vacío, se omite. Retorna string como `/productos?q=foo&categoriaId=bar`, `/productos?q=foo`, `/productos?categoriaId=bar`, o `/productos` (sin query string). Testeable aislado sin montar el componente.

3. **Submit nativo HTML + pequeño script de sanitización**: el `<form>` usa `method="get"` y `action={config.action}` (default `/productos`). El navegador nativo construiría `?q=<valor>&categoriaId=<valor>` enviando TODOS los campos (incluidos los vacíos: `?q=&categoriaId=`). Para lograr la URL limpia (campos vacíos omitidos), se añade un `<script is:inline>` mínimo (~12 líneas) que en el evento `submit` lee los valores del `<select>` y `<input>`, calcula la URL final con `buildSearchHref` lógica espejo en JS, y navega vía `window.location.href`. Alternativas consideradas y descartadas:
   - **Acepta los campos vacíos (`?q=&categoriaId=`)**: el backend los trata como no-filtro, pero rompe la URL canónica (mala SEO/UX, URLs inconsistentes al compartir).
   - **Deshabilitar el campo vacío antes del submit**: frágil, requiere sincronizar el estado del `<select>` con su propio `disabled`.
   - **Inyectar `<input type="hidden">` dinámicos**: más complejo que el script y no mejoraba la accesibilidad.
   Se descarta el approach puramente declarativo porque el contracto de URL limpia es prioridad. **El script es progressive enhancement**: si JS está deshabilitado, el form nativo sigue funcionando con URLs no-canónicas (`?q=&categoriaId=`), suficiente para el MVP.

4. **`<div role="search">` separado, no un nuevo landmark `<header>`**: el SearchForm se envuelve en un `<div role="search" aria-label="Buscar productos">`. Cumple WAI-ARIA y preserva la regla de "un solo `<header>` por página" de la spec `site-header`. No se añade `<section>` ni `<nav>`.

5. **Categorías hardcoded, `CATEGORY_OPTIONS` + helpers**: la primera opción es `{ id: "", label: "Todas las categorías" }` (seleccionable, limpia el filtro). Las demás son ejemplos placeholder del dominio Riff con IDs estables (ej. `herramientas`, `seguridad`, `electricidad`). La categoría default `sin-categoria` ya existe en el backend (`docs/api-spec.yml` la menciona) pero no se expone en el `<select>` aquí — "Todas las categorías" es equivalente a "sin filtro de categoría". Si el cliente entrega la lista real de categorías, se cambia en un solo lugar.

6. **Config tipada `SEARCH_FORM_CONFIG`**: `{ action: '/productos', submitLabel: 'BUSCAR', inputPlaceholder: '¿Qué solución está buscando?', inputName: 'q', selectName: 'categoriaId' }`. Lee `SEARCH_RESULTS_PATH`, `SEARCH_SUBMIT_LABEL` y `SEARCH_PLACEHOLDER` opcionales desde `import.meta.env` con defaults (igual que `getCtaConfig()` del site-header). Si el cliente cambia el texto del botón o el placeholder, se cambia en un solo lugar.

7. **Placeholder de página `/productos/index.astro`**: mínimo `<Layout title="Resultados de búsqueda">` con un heading "Resultados de búsqueda" y un `<p>` indicando que el catálogo se mostrará aquí. Se reemplaza en el change `product-catalog`. Misma estrategia que `cotizacion.astro` en el change `site-header`.

## Risks / Trade-offs

- **Risk**: Página `/productos` como placeholder da UX incompleta al usuario que hace submit hoy → **Mitigation**: el placeholder muestra claramente "el catálogo se mostrará aquí" + link de vuelta al home; el change `product-catalog` está priorizado siguiente en el backlog.
- **Risk**: Olvidar el `<script is:inline>` y romper la URL limpia en navegadores sin JS → **Mitigation**: el script es progressive enhancement; tests E2E validan AMBOS caminos (con JS → URL limpia; sin JS → URL no-canónica pero funcional). Documentado en design.
- **Risk**: Categorías hardcoded divergen de las categorías reales en Firestore → **Mitigation**: `CATEGORY_OPTIONS` es un array de pares `{id, label}` editable en un solo lugar,(sin tipado complejo); cuando el change `product-catalog` consuma el API real, se reemplaza el array hardcoded por un fetch en el frontmatter del Layout (o en la página `/productos`).
- **Risk**: Pérdida del estado del `<select>` al volver de `/productos` a una página con SearchForm → **Mitigation**: `SearchForm` acepta `initialQuery` y `initialCategoriaId` opcionales; `Layout` los lee de `Astro.url.searchParams` y los pasa como `selected` del `<select>` y `value` del `<input>`. Cubierto por scenario de spec.
- **Trade-off**: Script de sanitización (Decisión 3) vs submit puramente declarativo → se prioriza URL canónica (SEO compartible) sobre simplicidad; el script es ~12 líneas, progressive enhancement y testeado en JS/no-JS.
- **Trade-off**: Categorias hardcoded (no configurables) → simplicidad y tipos estrictos; pocas categorías iniciales no justifican config externa ni fetch en SSG.

## Migration Plan

- No requiere migración de datos ni cambios de API (`docs/api-spec.yml` invariante).
- Deploy: build SSG estándar (misma pipeline que Fase A). SearchForm nuevo + placeholder `/productos` entran juntos en un solo cambio.
- Rollback: revertir el commit del change `search-form` — el `Layout.astro` vuelve a renderizar `<TopHeader /> → <Header /> → <slot />` y el placeholder `/productos` se elimina.

## Open Questions

- ¿Lista real de categorías del catálogo Riff? Hoy se usan 3 categorías placeholder del dominio (herramientas, seguridad, electricidad) más "Todas las categorías" como default. El cliente las puede reemplazar en `CATEGORY_OPTIONS` en un solo lugar antes del change `product-catalog`.
- ¿Texto final del botón BUSCAR y del placeholder? Hoy se usan los de la imagen de referencia (`BUSCAR` y `¿Qué solución está buscando?`). El cliente puede confirmarlos antes de archivar o ajustarlos vía `SEARCH_SUBMIT_LABEL` / `SEARCH_PLACEHOLDER` en `.env`.
