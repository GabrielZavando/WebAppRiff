## Why

La auditoría de Responsive Web Design detectó desbordes horizontales y recortes de contenido en el sitio público de Riff que impiden la lectura y la navegación en viewports reales: el menú de escritorio desborda entre 1024px y ~1204px, los títulos y cifras del home, de representaciones, del detalle de producto y del catálogo desbordan en 320–375px, y el shell sticky (header + buscador) consume ~96% del alto en landscape pequeño (568×320). Estos defectos producen scroll horizontal — una falla grave de usabilidad y de posicionamiento — y deben corregirse antes de dar el sitio por cerrado.

## What Changes

- **Navegación de escritorio sin desborde (1024–1204px):** el menú de escritorio pasa a mostrarse desde `xl` (1280px) en lugar de `lg` (1024px), y en el rango `lg`→`xl` se compacta (gap, padding horizontal y tamaño tipográfico del nav y del CTA) de modo que el conjunto logo + navegación + CTA quepa dentro del ancho del viewport sin scroll horizontal. Por debajo de 1280px el menú colapsa a la hamburguesa con overlay a pantalla completa.
- **Tipografía responsiva del hero del home:** el `<h1>` del hero pasa de `text-5xl` fijo en móvil a una escala responsiva (`text-3xl`/`text-4xl` base → `md:text-7xl`) y aplica `break-words`, de modo que las palabras largas no generen scroll horizontal a 320px.
- **Stats de `PanelHome` contenidas:** las celdas del grid 2×2 de estadísticas ajustan padding y escala tipográfica en viewports estrechos para que valores como `30.000+` no se salgan de su tarjeta a 320–375px.
- **Hero de Representaciones responsivo:** el `<h1>` del hero y el heading de la sección de marcas dejan de usar tamaños fijos que desbordan; escalan por breakpoint y `break-words`.
- **Título del detalle de producto responsivo:** el `<h1>` de `text-5xl` fijo pasa a una escala responsiva (`text-3xl md:text-5xl`) con `break-words`, sin scroll horizontal en 320px.
- **Vista lista del catálogo sin desborde:** la imagen de la tarjeta en modo lista deja de tener ancho fijo de 192px y se adapta al ancho disponible; la fila de CTAs deja de crecer hasta ~407px por botón y pasa a fluir con ancho máximo y wrapping controlado. La spec `products-catalog-page` se alinea con la implementación real (`ProductCard` + clase `catalog-list-mode`) en lugar de exigir `ProductListItem`.
- **Shell sticky compacto en viewports de baja altura:** el header y la barra de búsqueda reducen su padding vertical y compactan sus controles cuando la altura del viewport es <= 400px (por ejemplo `568×320`), de modo que el grupo sticky ocupe como máximo ~50% del alto visible en lugar de ~96%. La compactación no aplica a los viewports de escritorio con orientación landscape y altura mayor (por ejemplo `1440×900`). El menú móvil se ajusta para que no se recorte 4px.
- **Cobertura E2E de viewports:** se agrega una suite Playwright que verifica, en los viewports afectados (320×568, 375×667, 568×320, 1024×768, 1204×800, 1280×800), que no existe scroll horizontal y que cada elemento corregido está contenido dentro de su contenedor.

## Capabilities

### New Capabilities

- `responsive-layout`: contrato transversal de layout responsivo del sitio público — matriz de viewports soportados, invariante de "sin scroll horizontal" y presupuesto de alto del shell sticky en viewports de baja altura.

### Modified Capabilities

- `site-header`: breakpoint del menú de escritorio (`lg` → `xl`), compactación de la navegación en el rango `lg`→`xl`, padding del header en viewports de baja altura y breakpoint del overlay móvil.
- `hero-banner`: escala tipográfica responsiva del `<h1>` en móvil y prevention de desborde por palabras largas.
- `panel-home`: contención de las celdas de estadísticas (padding y escala de valores) en viewports estrechos.
- `product-detail-page`: escala tipográfica responsiva del `<h1>` del producto y prevention de desborde horizontal.
- `products-catalog-page`: layout de la vista lista (imagen y fila de CTAs) y alineación del requisito de la vista lista con `ProductCard`/`catalog-list-mode`.
- `representaciones-page`: escala responsiva del hero y del heading de la sección de marcas.
- `search-form`: compactación de la barra de búsqueda en viewports de baja altura (altura <= 400px) y de la densidad del control de categoría.
- `site-header-scroll`: presupuesto de alto del grupo sticky (header + búsqueda) en viewports de baja altura.
- `web-e2e-critical-flows`: suite E2E de viewports que verifica ausencia de scroll horizontal y contención de los elementos corregidos.

## Impact

- **Código frontend (Astro/Tailwind v4, `apps/web`):** `src/components/Header.astro`, `src/components/HeroBanner.astro`, `src/components/PanelHome.astro`, `src/components/RepresentacionesHero.astro`, `src/components/ProductCard.astro`, `src/components/SearchForm.astro`, `src/pages/productos/index.astro` (CSS `catalog-list-mode`), `src/pages/productos/[slug].astro`, `src/pages/representaciones.astro`, `src/layouts/Layout.astro`, `src/styles/header-scroll.css`.
- **Tests:** tests unitarios de componentes (`apps/web/src/components/__tests__/`) y nueva suite E2E Playwright (`apps/web/e2e/responsive-layout.spec.ts`) con viewports múltiples; los E2E existentes de `hero-banner`, `panel-home`, `site-header` y `catalog-flow` se ajustan a los nuevos valores de breakpoint/tipografía.
- **Sin cambios de API, contratos de datos, dependencias ni infraestructura.** No se modifica la capability `web-product-card-adaptation` ni los contratos del backend.
- **Riesgo de regresión:** el cambio del breakpoint del menú de escritorio altera el comportamiento visible de la navegación entre 1024px y 1279px (hamburguesa en lugar de menú horizontal); la compactación en `lg`→`xl` mitiga la pérdida de navegación visible desde 1024px.
