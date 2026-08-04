## 1. Types & Config

- [x] 1.1 Crear `apps/web/src/lib/types/search-form.ts` con `CategoryOption` (`{ readonly id: string; readonly label: string }`) y `SearchFormProps` (`{ readonly categories: readonly CategoryOption[]; readonly config: SearchFormConfig; readonly initialQuery?: string; readonly initialCategoriaId?: string }`) y `SearchFormConfig` (`{ readonly action: string; readonly submitLabel: string; readonly inputPlaceholder: string; readonly inputName: string; readonly selectName: string }`)
- [x] 1.2 Crear `apps/web/src/lib/config/search-form.ts` con `CATEGORY_OPTIONS` (default "Todas las categorías" con `id: ""` + 3 categorías placeholder del dominio Riff), `SEARCH_FORM_CONFIG` defaults, y `getSearchFormConfig()` leyendo `SEARCH_RESULTS_PATH`, `SEARCH_SUBMIT_LABEL`, `SEARCH_PLACEHOLDER` de `import.meta.env` con fallback
- [x] 1.3 Crear `buildSearchHref(query, categoriaId, action)` en `apps/web/src/lib/config/search-form.ts` (trim de `query`, omite campos vacíos, URL-encodes valores, retorna string canónico)
- [x] 1.4 Test unitario `apps/web/src/lib/config/__tests__/search-form.test.ts`: `buildSearchHref("taladro", "herramientas", "/productos")` → `/productos?q=taladro&categoriaId=herramientas`
- [x] 1.5 Test unitario: `buildSearchHref("taladro", "", "/productos")` → `/productos?q=taladro`
- [x] 1.6 Test unitario: `buildSearchHref("", "herramientas", "/productos")` → `/productos?categoriaId=herramientas`
- [x] 1.7 Test unitario: `buildSearchHref("", "", "/productos")` → `/productos` (sin query string)
- [x] 1.8 Test unitario: `buildSearchHref("   ", "herramientas", "/productos")` → `/productos?categoriaId=herramientas` (whitespace-only query omitido)
- [x] 1.9 Test unitario: `buildSearchHref("taladro & sierra", "herramientas", "/productos")` → `/productos?q=taladro+%26+sierra&categoriaId=herramientas` (URL-encoded)
- [x] 1.10 Test unitario: `buildSearchHref("foo", "bar", "/catalogo")` → `/catalogo?q=foo&categoriaId=bar` (custom action)
- [x] 1.11 Test unitario: `getSearchFormConfig()` sin env vars retorna defaults `{ action: "/productos", submitLabel: "BUSCAR", inputPlaceholder: "¿Qué solución está buscando?", inputName: "q", selectName: "categoriaId" }`
- [x] 1.12 Test unitario: `getSearchFormConfig()` con `SEARCH_RESULTS_PATH="/catalogo"` y `SEARCH_SUBMIT_LABEL="IR"` retorna los overrides manteniendo los demás defaults
- [x] 1.13 Test unitario: `CATEGORY_OPTIONS[0]` es `{ id: "", label: "Todas las categorías" }` y el resto tienen `id` no vacío

## 2. Tailwind & Env (si aplica)

- [x] 2.1 Verificar que `brand-orange` ya existe en `apps/web/src/styles/globals.css` (añadido en `2026-08-02-site-header`). No requiere nuevos tokens CSS.
- [x] 2.2 Extender `apps/web/.env.example` con `SEARCH_RESULTS_PATH`, `SEARCH_SUBMIT_LABEL`, `SEARCH_PLACEHOLDER` (todas opcionales con defaults documentados)

## 3. Componente SearchForm.astro (TDD)

- [x] 3.1 Escribir `apps/web/src/components/__tests__/SearchForm.test.ts` (AstroContainer): renderiza un `<div role="search" aria-label="Buscar productos">` envolviendo el `<form>`
- [x] 3.2 Test: el `<select>` tiene `name="categoriaId"` y renderiza "Todas las categorías" como primera `<option selected>` con `value=""`
- [x] 3.3 Test: las `<option>` se renderizan en el orden de `categories` con `value={id}` y texto `{label}`
- [x] 3.4 Test: cuando `initialCategoriaId="herramientas"` coincide con una opción, esa opción queda `selected` y la primera NO queda `selected`
- [x] 3.5 Test: el `<input type="search">` tiene `name="q"` y `placeholder="¿Qué solución está buscando?"` (o el override de config)
- [x] 3.6 Test: el `<input>` tiene un `<label for="<input-id>">` con texto no vacío
- [x] 3.7 Test: cuando `initialQuery="taladro"`, el input tiene `value="taladro"`
- [x] 3.8 Test: el `<button type="submit">` tiene texto "BUSCAR" y una clase que contiene `bg-brand-orange`
- [x] 3.9 Test: el `<form>` tiene `method="get"` y `action="/productos"` (o el override de config)
- [x] 3.10 Test: el `<select>` tiene un `<label for="<select-id>">` con texto no vacío
- [x] 3.11 Test: el markup del formulario desktop usa layout flex-row (clase `md:flex-row` o equivalente)
- [x] 3.12 Test: el markup del formulario mobile usa layout flex-col (clase `flex-col`) y cada control es full-width
- [x] 3.13 Test: el componente NO introduce un `<header>` (regla de landmark único del site-header)
- [x] 3.14 Test: snapshot del HTML renderizado (regresión visual)
- [x] 3.15 Crear `apps/web/src/components/SearchForm.astro` (estructura: `<div role="search"> → <form method="get" action={config.action}> → <label>+<select>` + `<label>+<input type="search">` + `<button type="submit">`, props tipadas `SearchFormProps`)
- [x] 3.16 Implementar layout responsivo: `flex flex-col md:flex-row gap-3` en el `<form>`, full-width en mobile (`w-full`) y input expandible en desktop (`md:flex-1`)
- [x] 3.17 Implementar el `<script is:inline>` (~12 líneas) que en el evento `submit` leer los valores del select+input, calcular la URL final con la lógica espejo de `buildSearchHref`, y navegar vía `window.location.href`. El handler debe `preventDefault()` del submit nativo solo si construye la URL limpia. Progressive enhancement: si el script no carga, el form nativo funciona con URL no-canónica.

## 4. Página placeholder /productos

- [x] 4.1 Crear `apps/web/src/pages/productos/index.astro` (placeholder mínimo): `<Layout title="Resultados de búsqueda — Riff">` con `<h1>Resultados de búsqueda</h1>` y `<p>` indicando que el catálogo se mostrará aquí; link `<a href="/">Volver al inicio</a>`

## 5. Integración en Layout

- [x] 5.1 Actualizar `apps/web/src/layouts/Layout.astro`: importar `SearchForm`, `CATEGORY_OPTIONS` y `getSearchFormConfig`; computar `searchFormProps` leyendo `initialQuery` y `initialCategoriaId` desde `Astro.url.searchParams` (si existen); renderizar `<SearchForm {...searchFormProps} />` entre `<Header />` y `<slot />`
- [x] 5.2 Verificar que el HTML renderizado mantiene el orden DOM: `<TopHeader />` → `<header>` (site-header) → `<div role="search">` (SearchForm) → `<slot />`
- [x] 5.3 Verificar que la regla "un solo `<header>` por página" se mantiene tras añadir el SearchForm (regresión del change `site-header`)

## 6. Tests E2E (Playwright)

- [x] 6.1 E2E `apps/web/e2e/search-form.spec.ts`: en desktop (>= 768px) el `<div role="search">` es visible y contiene `<select>`, `<input>` y `<button>` en la misma fila (layout horizontal)
- [x] 6.2 E2E: en mobile (< 768px) los tres controles están stacked verticalmente (cada uno full-width)
- [x] 6.3 E2E: el `<select>` incluye "Todas las categorías" como primera opción y es seleccionable para limpiar el filtro
- [x] 6.4 E2E: el `<input>` tiene placeholder "¿Qué solución está buscando?"
- [x] 6.5 E2E: el botón "BUSCAR" tiene fondo `brand-orange` (verificar computed `background-color` igual a `#F97316` o contar la clase `bg-brand-orange`)
- [x] 6.6 E2E: llevar el input a "taladro", seleccionar la categoría "Herramientas" y hacer submit → `page.url` termina en `/productos?q=taladro&categoriaId=herramientas`
- [x] 6.7 E2E: dejar el input vacío, seleccionar "Herramientas" y hacer submit → `page.url` NO contiene `q=` y contiene `categoriaId=herramientas` (URL limpia con JS de sanitización activo)
- [x] 6.8 E2E: escribir "taladro" y dejar categoría en "Todas las categorías", submit → `page.url` termina en `/productos?q=taladro` (sin `categoriaId`)
- [x] 6.9 E2E: dejar input vacío y categoría en "Todas las categorías", submit → `page.url` es `/productos` sin query string
- [x] 6.10 E2E: el Tab_KEYBOARD focus cycle atraviesa select → input → button en orden
- [x] 6.11 E2E: presionar Enter con el input enfocado y con texto "taladro" → el form submita y la URL es la canónica
- [x] 6.12 E2E: `page.goto('/productos')` retorna 200 y contiene "Resultados de búsqueda" (placeholder sin 404)
- [x] 6.13 E2E: el conteo de `<header>` en el documento sigue siendo exactamente 1 (regresión landmark)
- [x] 6.14 E2E: la salida de la home muestra el orden DOM correcto: TopHeader → header → div[role="search"] → main/slot

## 7. Verificación & Cleanup

- [x] 7.1 `npm run build --workspace=apps/web` → success
- [x] 7.2 `npm run typecheck --workspace=apps/web` → success
- [x] 7.3 `npm run lint --workspace=apps/web` → success
- [x] 7.4 `npm run test --workspace=apps/web` → all pass (unit + AstroContainer + snapshot)
- [x] 7.5 `npm run test:smoke --workspace=apps/web` → E2E Playwright pass
- [x] 7.6 `openspec validate search-form` → valid
- [x] 7.7 `openspec status --change search-form --json` → todos los artefactos completos (`isComplete: true` o `applyRequires` cubierto)
