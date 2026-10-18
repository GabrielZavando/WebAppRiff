# Spec Delta

## MODIFIED Requirements

### Requirement: Build-time data sources

The page SHALL obtain the COMPLETE public catalog at build time by calling
`GET /api/v1/products` (public, only `publicado: true`) through
`apps/web/src/lib/api/products.ts`, paginating in blocks of `limit=100` and
reading `meta.total` until every published product is loaded. It SHALL obtain the
active subcategories via `GET /api/v1/subcategories?activa=true`. Both modules
SHALL cache their result at module scope and return `[]` on any fetch or parse
error so `astro build` never fails.

#### Scenario: Products fetched and cached per build
- **WHEN** `astro build` runs and `pages/productos/index.astro` is rendered
- **THEN** `getPublicProducts()` paginates `GET /api/v1/products` with `limit=100`
  until `meta.total` published products are collected, caching the full array at
  module scope (no per-page refetch)
- **AND** the returned `data` includes products beyond the API default limit of 24

#### Scenario: API unreachable at build time
- **WHEN** `GET /api/v1/products` returns a non-2xx response or the network request throws
- **THEN** `getPublicProducts()` resolves to `[]`
- **AND** `console.warn` is emitted
- **AND** `astro build` exits successfully

#### Scenario: Subcategories fetched at build time and filtered locally
- **WHEN** `astro build` runs and the page needs the active subcategories
- **THEN** the module fetches `GET /api/v1/subcategories?activa=true` exactly
  once per build (module-level cache) and returns the full active list
- **AND** `getActiveSubcategories(categoriaId)` returns the subset whose
  `categoriaId` matches, computed from the cached list (no extra HTTP call)
- **AND** on fetch/parse error the fallback is `[]`
