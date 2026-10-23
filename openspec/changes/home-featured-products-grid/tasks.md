# Tasks — home-featured-products-grid

> Contrato normativo: `specs/destacados-section/spec.md` (delta).
> Decisiones técnicas: `design.md`.
> Código en inglés, artefactos y comentarios de negocio en español.
> TDD: cada tarea de código va precedida de su test fallido.

## 1. Contrato de tipos y mapeo (base)

- [x] 1.1 En `apps/web/src/lib/types/products-page.ts`, añadir el campo
  opcional `destacado?: boolean` a `ProductoCardApi` dentro del bloque
  "Card-only extras" (el backend ya lo envía; ver design.md § Decision 2 y
  el riesgo de fidelidad de contrato). Test TDD fallido previo en
  `src/lib/types/__tests__/` que verifique la shape estructural del tipo.
- [x] 1.2 En `apps/web/src/lib/types/destacados-section.ts`, cambiar
  `FeaturedProduct`: `imagen: ImageMetadata` → `imageUrl: string` y ajustar la
  documentación del contrato (URL remota de `galeria[0]`, alt con fallback al
  título, sin `assets/img/`, sin campos de precio). Actualizar el test TDD
  fallido de `DestacadosSectionProps`/`FeaturedProduct` en
  `src/lib/types/__tests__/destacados-section.test.ts` y editar el bloque de
  comentarios histórico.
- [x] 1.3 En `apps/web/src/lib/config/destacados-section.ts`, dejar
  `DESTACADOS_SECTION_CONTENT` como copy de cabecera (`headline`,
  `ctaText`, `ctaHref`) tipada como `Omit<DestacadosSectionProps,
  'products'>`, eliminando `FEATURED_PRODUCTS` y las importaciones de
  `assets/img/`. Reescribir el test
  `src/lib/config/__tests__/destacados-section.test.ts` (TDD: primero versión
  nueva esperando solo 3 campos; el test actual del array de 4 es el que
  falla y se elimina).
- [x] 1.4 Crear el helper puro `toFeaturedProduct(product: ProductoCardApi):
  FeaturedProduct` en `apps/web/src/lib/products/toFeaturedProduct.ts`
  (mapping campo a campo según design.md § Decision 3:
  `imageUrl = galeria[0]?.url ?? ''`,
  `imagenAlt = galeria[0]?.alt || titulo`). Test TDD fallido previo
  `toFeaturedProduct.test.ts` cubriendo: mapeo completo, `galeria=[]`
  (`imageUrl=''`, alt=titulo) y ausencia de campos de precio.

## 2. Transporte API — `getFeaturedProducts()`

- [x] 2.1 Test TDD fallido en
  `apps/web/src/lib/api/__tests__/featuredProducts.test.ts` (basarse en
  `products.test.ts`): resuelve la lista de `GET /products?destacado=true`
  con envelope `data`/`meta`.
- [x] 2.2 Test TDD fallido: cache a nivel módulo (una sola llamada HTTP por
  build aunque se invoque varias veces).
- [x] 2.3 Test TDD fallido: degradación a `[]` con `console.warn` cuando la
  API no responde y `REQUIRE_API` no activa; y rechazo con error `SC-env-04`
  cuando `REQUIRE_API=true` y la API no responde (paridad con
  `catalogFailFast.test.ts`).
- [x] 2.4 Implementar `getFeaturedProducts()` en
  `apps/web/src/lib/api/products.ts` con `fetch` build-time a
  `/products?destacado=true&limit=100&page=1`, cache módulo y reutilización de
  los helpers de `apiBaseUrl.ts` (`resolveApiBaseUrl`,
  `assertCatalogSourceAvailable`, `warnCatalogFallback`). Sin loop de
  paginación (design.md § Decision 1).

## 3. Página home — fetch, slice y mapeo

- [x] 3.1 Test TDD fallido de la página (`src/pages/__tests__/`): el
  frontmatter de `index.astro` llama a `getFeaturedProducts()`, mapea con
  `toFeaturedProduct`, corta con `slice(0, 8)` y pasa `products` a
  `DestacadosSection` junto a la copy de `DESTACADOS_SECTION_CONTENT`.
  Casos: > 8 destacados → 8 props; 0 destacados → 0 props; dependencia
  `getPublicProducts()` no consumida para esta sección.
- [x] 3.2 Editar `apps/web/src/pages/index.astro`:
  `DestacadosSection` recibe `{ headline, ctaText, ctaHref, products:
  destacados }` (sustituir el spread `{...DESTACADOS_SECTION_CONTENT}`). No
  tocar el orden de secciones ni el resto del frontmatter.

## 4. Componente — imagen remota y placeholder sin icono

- [x] 4.1 Test TDD fallido: la imagen de tarjeta renderiza `<img
  loading="lazy" decoding="async" class="w-full aspect-square object-contain">`
  con `src` = `imageUrl` remota (`https://…`) y `alt` = `imagenAlt` no vacío;
  `src` nunca resuelve a `assets/img/`. Actualizar a la vez
  `destacados-section-test-utils.ts` y el helper de props para construir
  tarjetas de ejemplo 0..8 (reemplazando `DESTACADOS_SECTION_CONTENT` como
  props por defecto).
- [x] 4.2 Test TDD fallido: cuando `imageUrl === ''` el mat renderiza sin
  `<img>` y sin `<svg>` (fondo blanco, aspecto cuadrado reservado).
- [x] 4.3 Editar `apps/web/src/components/DestacadosSection.astro`: quitar el
  import de `astro:assets` `<Image>` y renderizar el `<img>` remoto + estado
  vacío según design.md § Decision 4/5; actualizar el bloque de comentarios
  del frontmatter (la sección sigue dumb, sin `fetch` ni `import.meta.env`).
- [x] 4.4 Regenerar snapshot `DestacadosSection.test.ts.snap` y reescribir el
  describe de imagen (el actual valida `/_image?href=...` de astro:assets) y
  el describe de tokens (`aspect-square` sigue cumpliendo "no rounded-*").

## 5. Grid y outline 0..8 (verificación de flujo)

- [x] 5.1 Test TDD fallido: la grilla mantiene exactamente
  `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` y `gap-6 md:gap-8` sin clases
  condicionales, y renderiza exactamente N `<article>` con N = length de
  `products` (0, 1, 4, 5, 8).
- [x] 5.2 Test TDD fallido del outline dinámico: con N destacados la sección
  emite 1 `<h3>` y N `<h4>` (0 también); sin `<h1>`/`<h2>` y sin iconos, con
  el mat de "sin imagen" sin svg (Decision 5).
- [x] 5.3 Ajustar los tests E2E que fijan "4 `<h4>`" de DestacadosSection
  (`apps/web/e2e/services-section.spec.ts:178` y
  `apps/web/e2e/solution-section.spec.ts:181`) al outline dinámico (8 + N en
  la página completa o equivalente según mock local usado).

## 6. Integración y verificación final

- [x] 6.1 Verificar build real con la API disponible y marcando 9 productos
  `destacado:true` en el panel: la home renderiza exactamente 8 tarjetas, en
  orden del backend, con flujo a segunda fila (inspección manual / smoke del
  HTML generado).
  - Validación (decision del usuario vía 3b): no se muta la base real (el
    backend de staging corre con ADC/Firestore y tiene 0 destacados); se usa
    el build e2e contra el stub (`e2e/fixtures/api-data.json` con 9
    `destacado:true`,uno con `galeria[0]` remota de Storage). Tests e2e
    añadidos en `solution-section.spec.ts` (describe "DestacadosSection"):
    9 destacados del backend → exactamente 8 `<article>` (cap `slice(0, 8)`),
    grilla `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` intacta en desktop
    (4 columnas × 2 filas alineadas) y primera tarjeta con `<img>` remota
    `loading="lazy"` + `alt`. Suite e2e chromium completa: 107/107.
- [x] 6.2 Verificar degradación: build sin backend (y `REQUIRE_API` sin
  activar) → home renderiza sección con grid vacía; build con
  `REQUIRE_API=true` sin backend → error `SC-env-04` esperado.
- [x] 6.3 Ejecutar la batería del workspace web (`npm run lint` + `npm run
  typecheck` + `npm run test` en `apps/web`) y `npx openspec validate --all
  --strict`.
- [x] 6.4 Confirmar que ningún test sigue referenciando `FEATURED_PRODUCTS` o
  el contrato `imagen` (`grep -r "FEATURED_PRODUCTS\|ImageMetadata" apps/web/src`),
  y actualizar el comentario de `destacados-section.ts:13` que menciona los 4
  products.
