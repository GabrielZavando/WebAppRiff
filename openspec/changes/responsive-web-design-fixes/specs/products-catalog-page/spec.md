# products-catalog-page Specification

## MODIFIED Requirements

### Requirement: View toggle (grid / list)

The page SHALL render a `ViewModeToggle` in the header that exposes two
anchors, `?view=grid` and `?view=list`, preserving the rest of the URL state.
The active view SHALL carry `aria-current="true"` and SHALL be visually
distinguished. The default SHALL be `grid`. In list mode, the results area SHALL
reuse the `ProductCard` component and switch its layout through the
`catalog-list-mode` class applied to the results grid by the client runtime; the
`ProductListItem` component SHALL NOT be required by this capability, since the
list layout is a variant of `ProductCard` and not a separate component.
(MODIFIED in `responsive-web-design-fixes` — se alinea el requisito con la
implementación real, `ProductCard` + `catalog-list-mode`.)

#### Scenario: View toggle renders both options
- **WHEN** the page is rendered with `?view=list`
- **THEN** the list anchor has `aria-current="true"` and the grid anchor is
  rendered without it
- **AND** the results area uses the list-row layout (the `ProductCard` cards
  inside the grid carrying the `catalog-list-mode` class)

#### Scenario: La vista lista se activa desde el runtime
- **WHEN** el runtime cliente aplica los filtros con `view=list`
- **THEN** el grid de resultados `#catalog-grid` recibe la clase `catalog-list-mode`
- **AND** las tarjetas `.catalog-card` dentro de él adoptan el layout de fila

### Requirement: Product card content (mobile-first, user-defined)

Each `ProductCard` SHALL render, in this exact vertical order:

1. **Image** from `galeria[0].url` with `alt`, `loading="lazy"`,
   `decoding="async"` and a fixed `aspect-ratio` to avoid CLS. When `galeria`
   is empty, a placeholder image is rendered.
2. **Title** (`titulo`) as the card title (heading).
3. **Category chip** with the product's category name resolved server-side at
   build time from the cached categories list
   (`categorias.find(c => c.id === producto.categoriaId).nombre`), rendered as
   a small uppercase chip. When the category is not found, the chip SHALL be
   omitted.
4. **Short description** (`descripcionBreve`) truncated to approximately 2
   lines.
5. A **CTA row with exactly two anchors, side by side at every breakpoint**:
   - `Cotizar` → `/cotizacion?producto=<slug>` (primary visual treatment).
   - `Ver detalles` → `/productos/<slug>` (secondary visual treatment).

The card SHALL NOT render the "COD:" badge, the attribute mini-grid, a separate
price block or a stock badge. The CTA row SHALL sit side-by-side (never stacked
vertically) at every breakpoint, so the primary action (`Cotizar`) is always
one tap away on a phone. Each CTA SHALL have a bounded width (e.g. `max-width`
plus `flex-1`/`basis`) so the row never grows beyond the width of the card,
and the row SHALL be allowed to wrap when the available width is smaller than
the combined intrinsic width of both buttons. (MODIFIED in
`responsive-web-design-fixes` — la fila de CTAs deja de crecer hasta ~407px por
botón.)

#### Scenario: Card renders the user-defined order
- **WHEN** `ProductCard` receives a product with
  `galeria[0].url="https://..."`, `galeria[0].alt="..."`,
  `titulo="Flujómetro Universal"`, `categoriaId="cat-fluidos"`,
  `descripcionBreve="Medidor electromagnético..."`, `slug="flujometro-universal"`,
  and the categories list contains `{ id: "cat-fluidos", nombre: "Medición de Fluidos" }`
- **THEN** the rendered HTML contains, in order:
  1. the `<img>` with `alt`, `loading="lazy"`, and a fixed aspect ratio;
  2. an `<h*>` with the title;
  3. the category chip text "MEDICIÓN DE FLUIDOS";
  4. the short description, truncated to ~2 lines;
  5. two anchors in a single row:
     - `Cotizar` → `/cotizacion?producto=flujometro-universal` (primary classes)
     - `Ver detalles` → `/productos/flujometro-universal` (secondary classes)
- **AND** the card does NOT contain a "COD:" badge, an attributes mini-grid,
  a separate price block or a stock badge

#### Scenario: Category not found
- **WHEN** `ProductCard` receives a product with `categoriaId="sin-categoria"`
  and the categories list does NOT contain `"sin-categoria"`
- **THEN** the category chip is omitted
- **AND** the rest of the card renders normally

#### Scenario: La fila de CTAs no excede el ancho de la tarjeta
- **WHEN** la tarjeta se renderiza en el viewport `320×568` o `375×667`
- **THEN** el ancho de la fila de CTAs no supera el ancho disponible de la tarjeta
- **AND** el `boundingBox` de cada botón queda dentro del `boundingBox` de la tarjeta

### Requirement: Mobile-first layout

The products page SHALL be designed mobile-first: the default styles apply to
mobile viewports, and richer layouts are layered on at `sm` (≥640px) and `lg`
(≥1024px) breakpoints via Tailwind responsive prefixes. The `ProductCard` CTA
row SHALL sit side-by-side at every breakpoint (never stacked vertically). The
sidebar SHALL stack **above** the results on viewports `<lg` (always visible,
full width) and SHALL sit **on the left** of the results on `lg+`, in a
`lg:grid-cols-[260px_1fr]` two-column layout. In list mode (`catalog-list-mode`),
the card SHALL adapt to the available width: the image SHALL NOT have a fixed
192px (`12rem`) width — it SHALL be bounded by a percentage/max-width of the
card and SHALL stack above the content when the available width is small — and
the CTA row SHALL wrap within the card instead of forcing the card wider than
the viewport. (MODIFIED in `responsive-web-design-fixes` — se elimina el ancho
fijo de 192px y el desborde de la fila de CTAs en vista lista.)

#### Scenario: Mobile breakpoint
- **WHEN** the viewport is `<640px`
- **THEN** the products grid is `grid-cols-1`
- **AND** the card CTA row is `flex-row` (two buttons side by side)
- **AND** the sidebar stacks **above** the results grid (full width)

#### Scenario: Desktop breakpoint
- **WHEN** the viewport is `≥1024px`
- **THEN** the products grid is `lg:grid-cols-3`
- **AND** the page uses `lg:grid-cols-[260px_1fr]` (sidebar left, results right)

#### Scenario: La imagen de la vista lista se adapta al ancho
- **WHEN** el catálogo se renderiza con `view=list` en el viewport `320×568`
- **THEN** el ancho de la imagen de la tarjeta no es un valor fijo de `12rem` (192px)
- **AND** el ancho de la tarjeta no supera el ancho disponible del viewport

## ADDED Requirements

### Requirement: List view does not produce horizontal overflow

La vista lista del catálogo SHALL renderizarse sin scroll horizontal en los viewports `320×568`, `375×667` y `768×1024`. El ancho total de cada tarjeta en modo lista (imagen + contenido + CTAs) SHALL ser menor o igual al ancho disponible del contenedor de resultados.

#### Scenario: Sin scroll horizontal en vista lista móvil

- **WHEN** se carga `/productos?view=list` en el viewport `320×568`
- **THEN** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`
- **AND** el ancho de la tarjeta `.catalog-card` no supera el ancho del contenedor `#catalog-grid`

#### Scenario: Los botones no ocupan un ancho desmedido

- **WHEN** el catálogo se renderiza con `view=list` en un viewport de escritorio (`1280×800`)
- **THEN** el ancho de cada CTA de la tarjeta es menor o igual a la mitad del ancho disponible de la tarjeta
- **AND** el ancho de cada CTA no supera un máximo razonable (por ejemplo 200px) en la vista lista

#### Scenario: Contención en viewport intermedio

- **WHEN** el catálogo se renderiza con `view=list` en el viewport `768×1024`
- **THEN** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`
