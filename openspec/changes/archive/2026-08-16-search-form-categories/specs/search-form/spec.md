## MODIFIED Requirements

### Requirement: SearchForm categories are configured via a hardcoded constant
The category list rendered by `SearchForm` SHALL be derived at build time from the public endpoint `GET /api/v1/categories?activa=true` via the `getSearchFormCategories()` function in `lib/api/categories.ts`. The form action, submit label, input placeholder and field names SHALL continue to come from `getSearchFormConfig()` (overridable via environment variables with sensible defaults). The first option SHALL always be `{ id: "", label: "Todas las categorías" }`. The remaining options SHALL be mapped from active categories as `{ id, label: nombre }`, ordered by `orden` ascending and then by `nombre` ascending. If the API is unreachable at build time, `getSearchFormCategories()` SHALL fall back to returning only the default option so the static build never fails. The `SearchForm.astro` component SHALL remain a dumb presentational component that receives `categories` via props; the fetch SHALL NOT occur in the component frontmatter (it lives in `lib/api/categories.ts`).

#### Scenario: Categories are sourced from the backend at build time
- **WHEN** the SearchForm is rendered through `Layout.astro`
- **THEN** the `categories` prop is produced by `getSearchFormCategories()` (no longer the previously hardcoded `CATEGORY_OPTIONS` constant)
- **AND** the `Layout.astro` frontmatter performs no direct `fetch` or `import.meta.env` access (fetching lives in `lib/api/categories.ts`)

#### Scenario: Default option is first with empty id
- **WHEN** `getSearchFormCategories()` resolves categories
- **THEN** the first option is `{ id: "", label: "Todas las categorías" }`
- **AND** subsequent options have non-empty string `id`

#### Scenario: Active categories are mapped and sorted
- **WHEN** the API returns active categories `[{ orden: 2, nombre: "Seguridad" }, { orden: 1, nombre: "Herramientas" }]`
- **THEN** the rendered options after the default are `Herramientas` then `Seguridad` (ordered by `orden`, then `nombre`)

#### Scenario: Fallback when API is unavailable
- **WHEN** the fetch to the categories endpoint fails at build time
- **THEN** `getSearchFormCategories()` returns only `[{ id: "", label: "Todas las categorías" }]`
- **AND** the static build completes without error

#### Scenario: SEARCH_FORM_CONFIG falls back to defaults when env vars are missing
- **WHEN** `getSearchFormConfig()` is called without `SEARCH_RESULTS_PATH`, `SEARCH_SUBMIT_LABEL`, `SEARCH_PLACEHOLDER` set
- **THEN** it returns `{ action: "/productos", submitLabel: "BUSCAR", inputPlaceholder: "¿Qué productos estás buscando?", inputName: "q", selectName: "categoriaId" }`

#### Scenario: SEARCH_FORM_CONFIG honours env vars when present
- **WHEN** `getSearchFormConfig()` is called with `SEARCH_RESULTS_PATH="/catalogo"` and `SEARCH_SUBMIT_LABEL="IR"` set
- **THEN** it returns `{ action: "/catalogo", submitLabel: "IR", inputPlaceholder: "¿Qué productos estás buscando?", inputName: "q", selectName: "categoriaId" }`
