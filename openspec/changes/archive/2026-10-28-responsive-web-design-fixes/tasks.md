## 1. Infraestructura de tests de layout responsivo

- [x] 1.1 Crear `apps/web/e2e/responsive-layout.spec.ts` con una tabla de viewports (`320×568`, `375×667`, `568×320`, `768×1024`, `1024×768`, `1204×800`, `1280×800`) y las páginas representativas (`/`, `/productos`, `/productos?view=list`, `/productos/{slug}`, `/representaciones`)
- [x] 1.2 Implementar en ese spec un helper `expectNoHorizontalOverflow(page)` que compare `document.documentElement.scrollWidth` contra `document.documentElement.clientWidth` con tolerancia de 1px y falle el test cuando la diferencia la supere
- [x] 1.3 Implementar un helper `expectWithinViewport(page, selector)` que verifique, vía `boundingBox()`, que el elemento queda dentro del ancho del viewport (con la misma tolerancia de 1px)
- [x] 1.4 Añadir el test que recorre la matriz de viewports verificando la ausencia de scroll horizontal en todas las páginas representativas (debe fallar antes de las correcciones)
- [x] 1.5 Verificar que el spec se incluye en `npm run test:smoke --workspace=apps/web` (`playwright test --project=chromium`)

## 2. Navegación de escritorio sin desborde (1024–1279px)

- [x] 2.1 Actualizar `apps/web/src/components/__tests__/Header.test.ts` para exigir el nuevo contrato de visibilidad (`hidden xl:flex` en el nav de escritorio y `xl:hidden` en el toggle y el overlay) — test fallido primero
- [x] 2.2 Cambiar en `apps/web/src/components/Header.astro` el nav de escritorio a `hidden xl:flex` y el botón hamburguesa y el overlay a `xl:hidden`
- [x] 2.3 Compactar el nav en el rango `lg`→`xl` (gap entre ítems, padding horizontal de los ítems y del CTA) y reducir el ancho máximo del logo en ese rango, de modo que el conjunto logo + nav + CTA quepa a 1024px
- [x] 2.4 Añadir al spec E2E `responsive-layout.spec.ts` la aserción de que el header no desborda en `1024×768` y `1204×800` y de que el menú de escritorio es visible desde `1280×800`
- [x] 2.5 Ajustar los asserts existentes de `apps/web/e2e/site-header.spec.ts` y `apps/web/e2e/site-header-scroll.spec.ts` al nuevo breakpoint `xl`

## 3. Compactación del shell sticky en viewports de baja altura (568×320)

- [x] 3.1 Añadir a `apps/web/e2e/responsive-layout.spec.ts` el test que mide la altura del wrapper sticky `.header-scroll-shell` en `568×320` y exige que no supere el 50% de la altura del viewport — test fallido primero
- [x] 3.2 Reducir el padding vertical y la altura de la barra interna del `<header>` en `Header.astro` mediante la variante `[@media(max-height:400px)]:` (menor que `pb-10` en portrait)
- [x] 3.3 Reducir el padding vertical del contenedor interno de `SearchForm.astro` mediante `[@media(max-height:400px)]:` y mantener los tres controles en una sola fila con ancho acotado en el selector de categoría
- [x] 3.4 Añadir `min-w-0` a los controles flexibles del buscador para que el input pueda encogerse sin forzar scroll horizontal
- [x] 3.5 Verificar en el E2E que el buscador no supera el 25% de la altura del viewport a `568×320` y que el grupo sticky no supera el 50%
- [x] 3.6 Ajustar `apps/web/e2e/search-form.spec.ts` para cubrir el layout compactado en viewports de baja altura sin romper las aserciones existentes de desktop y mobile

## 4. Tipografía responsiva del home (hero + stats del panel)

- [x] 4.1 Actualizar `apps/web/e2e/hero-banner.spec.ts` para exigir la escala tipográfica responsiva del `<h1>` (base móvil menor que `text-5xl`, con `md:text-7xl`) y la monotonía del `font-size` computado entre `320×568`, `375×667`, `768×1024` y `1280×800` — test fallido primero
- [x] 4.2 Cambiar el `<h1>` de `apps/web/src/components/HeroBanner.astro` a la escala responsiva acordada (`text-3xl`/`text-4xl` base → `md:text-7xl`) y añadir `break-words`
- [x] 4.3 Actualizar `apps/web/e2e/panel-home.spec.ts` para exigir que el valor `30.000+` quede dentro de su celda a `320×568` y `375×667` y que su `font-size` escale — test fallido primero
- [x] 4.4 Ajustar en `apps/web/src/components/PanelHome.astro` el padding de las celdas de estadísticas (base móvil reducida, escalando a `md:`/`lg:`) y el tamaño de fuente de los valores, añade `min-w-0` y quiebre de palabra
- [x] 4.5 Verificar en el E2E que el `<h1>` del hero y las cuatro celdas del panel quedan contenidos dentro del viewport en toda la matriz

## 5. Representaciones y detalle de producto

- [x] 5.1 Añadir al E2E las aserciones de que el `<h1>` del hero de representaciones y el `<h2>` de la sección de marcas quedan dentro del viewport a `320×568` y `375×667` — test fallido primero
- [x] 5.2 Escalar por breakpoint el `<h1>` de `apps/web/src/components/RepresentacionesHero.astro` y añadir `break-words`; revisar `leading-none` para que la frase "Representación Exclusiva" no se recorte
- [x] 5.3 Ajustar el `<h2>` de la sección de marcas en `apps/web/src/pages/representaciones.astro` para que escale por breakpoint y aplique quiebre de palabra
- [x] 5.4 Añadir al E2E la aserción de que el `<h1>` del detalle de producto queda dentro de su columna a `320×568` y `375×667` — test fallido primero
- [x] 5.5 Cambiar el `<h1>` de `apps/web/src/pages/productos/[slug].astro` de `text-5xl` fijo a `text-3xl md:text-5xl` y añadir `break-words`
- [x] 5.6 Ajustar `apps/web/e2e/catalog-flow.spec.ts` para verificar el título del detalle de producto en el viewport estrecho sin romper las aserciones existentes de CTA

## 6. Vista lista del catálogo sin desborde

- [x] 6.1 Añadir al E2E las aserciones de que la tarjeta `.catalog-card` en `view=list` no supera el ancho de `#catalog-grid` y de que cada CTA tiene un ancho acotado — test fallido primero
- [x] 6.2 Sustituir el ancho fijo `width: 12rem` de la imagen en el bloque `catalog-list-mode` de `apps/web/src/pages/productos/index.astro` por un ancho adaptativo, apilando la imagen sobre el contenido cuando el ancho disponible es pequeño
- [x] 6.3 Ajustar la fila de CTAs de `apps/web/src/components/ProductCard.astro` para que admita wrapping y tenga un ancho máximo por botón, manteniendo los dos CTAs accesibles y accionables en móvil
- [x] 6.4 Actualizar el test unitario de `ProductCard` (si existe) para fijar el nuevo comportamiento del layout de la fila de CTAs
- [x] 6.5 Verificar en el E2E la ausencia de scroll horizontal en `/productos?view=list` a `320×568`, `375×667` y `768×1024`

## 7. Validación final

- [x] 7.1 Ejecutar `npx openspec validate --all --strict` y confirmar que el change y las specs quedan válidos
- [x] 7.2 Ejecutar `make lint` y `make typecheck` sin errores
- [x] 7.3 Ejecutar `make test` (Vitest, workspaces) en verde
- [x] 7.4 Ejecutar `npm run test:smoke --workspace=apps/web` (Playwright) en verde con la nueva suite de viewports
- [x] 7.5 Revisar que ningún componente quedó con un tamaño tipográfico fijo que pueda desbordar en los viewports de la matriz y que no se introdujeron dependencias ni cambios de API
