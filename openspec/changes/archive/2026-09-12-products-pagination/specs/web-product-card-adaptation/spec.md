## ADDED Requirements

### Requirement: ProductoCardApi type for card-projection data
The web application SHALL define a `ProductoCardApi` type that is compatible with `ProductoApi` (assignable) but has optional fields for those not present in card projections: `descripcionLarga`, `atributos`, `fichaTecnica`, `stock`, `actualizadoEn`, `idExterno` SHALL be optional (may be undefined). Required fields: id, sku, titulo, slug, descripcionBreve, categoriaId, subcategoriaId, precio, galeria, creadoEn.

#### Scenario: ProductoCardApi is assignable to ProductoApi
- **WHEN** `ProductoCardApi` is used where `ProductoApi` is expected (e.g. `applyProductFilters`)
- **THEN** TypeScript strict mode accepts the assignment without errors
- **AND** `applyProductFilters` functions correctly over the available fields (titulo, descripcionBreve, sku, slug, categoriaId, subcategoriaId, precio.valor, creadoEn)

#### Scenario: Catalog page renders with card-projection data
- **WHEN** `astro build` runs and `getPublicProducts()` returns card-projection items
- **THEN** the products embedded in `#catalog-data` JSON are of type `ProductoCardApi`
- **AND** the product grid renders correctly with titulo, descripcionBreve, galeria[0]

### Requirement: Product detail fetches per slug without catalog cache reuse
The `getProductBySlug` function SHALL NOT reuse the `cached` array populated by `getPublicProducts()` (which now contains card-projection data without descripcionLarga, atributos, fichaTecnica). It SHALL always perform an independent fetch to `GET /api/v1/products/slug/{slug}` to retrieve the complete entity.

#### Scenario: Detail page fetches independently
- **WHEN** `getProductBySlug('bomba-centrifuga-500')` is called
- **THEN** the function does NOT look up `cached` (the catalog cache)
- **AND** it performs a `fetch` to `GET /api/v1/products/slug/bomba-centrifuga-500`
- **AND** the returned entity has all fields (descripcionLarga, atributos, fichaTecnica, galeria completa)

#### Scenario: Detail page falls back to standalone fetch when not in catalog
- **WHEN** `getProductBySlug('unknown-product')` is called and the product does not exist
- **THEN** the function performs a fetch to the slug endpoint
- **AND** returns `null` (product not found, renders 404)

### Requirement: toProductCardModel accepts ProductoCardApi
The `toProductCardModel` function SHALL accept `ProductoCardApi` as input (not just `ProductoApi`). The function logic does not change — it only uses fields present in both types (titulo, descripcionBreve, slug, galeria[0], categoriaId, subcategoriaId).

#### Scenario: Card model mapping with lean input
- **WHEN** `toProductCardModel` receives a `ProductoCardApi` with `galeria: [{url: '...', alt: '...'}]`
- **THEN** it returns a valid `ProductCardModel` with `imageUrl`, `titulo`, `slug`, etc.
- **AND** `galeria[0]` access works correctly even when galeria is a single-item array
