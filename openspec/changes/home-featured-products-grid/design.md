# Design — home-featured-products-grid

> Change: `home-featured-products-grid`. Motivación en `proposal.md`;
> comportamiento normativo en `specs/destacados-section/spec.md` (delta).

## Contexto

**Estado actual**

- `apps/web/src/components/DestacadosSection.astro` es un componente dumb que
  recibe por props `headline`, `ctaText`, `ctaHref` y `products` (array de
  `FeaturedProduct` con `imagen: ImageMetadata` local).
- `apps/web/src/lib/config/destacados-section.ts` hardcodea
  `DESTACADOS_SECTION_CONTENT` con exactamente 4 productos (2 de ellos con
  imágenes provisionales reutilizadas) importadas de `assets/img/`.
- `apps/web/src/pages/index.astro` hace spread de la constante.
- El backend ya soporta `GET /api/v1/products?destacado=true&limit=N&page=1`
  (`producto.controller.ts`): `buildFilter` mapea el query param `destacado`
  al filtro de repositorio, y `firestore.indexes.json` ya declara el índice
  compuesto `publicado ASC + destacado ASC + creadoEn DESC`. Para peticiones
  anónimas el read service fuerza `publicado: true` (catálogo público solo
  expone publicados). La proyección card de la API ya incluye el campo
  `destacado: boolean` (`toProductoCard`).
- El sitio web es SSG: la home se genera en `astro build` desde el backend y
  ejecutar fetches build-time es el patrón establecido
  (`getPublicProducts()` en `lib/api/products.ts`: paginación walk + cache
  módulo + fallback `[]` + fail-fast `SC-env-04` cuando `REQUIRE_API=true`).

**Precisión del orden de "los primeros 8"**: sin `sortBy` explícito, la
consulta del backend ordena por `creadoEn DESC` (índice compuesto existente).
"Los primeros 8" = los 8 primeros elementos del array que devuelve la API;
el frontend no reordena.

## Objetivos / Non-Goals

**Objetivos:**

- La sección muestra los productos que el panel marca con `destacado: true`.
- Tope visual de 8 aplicado en el frontend antes de pasar props (`slice`).
- Grid responsivo `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` con flujo auto
  a segunda fila para 5-8 productos, sin clases condicionales.
- Degradación segura: build nunca falla por esta sección (excepto política
  fail-fast explícita).

**Non-Goals:**

- No toca el backend (ni endpoint, ni índice, ni DTOs).
- No agrega paginación/scroll "ver más" en la sección: el tope es fijo (8).
- No migra otras secciones hardcodeadas (SoloSection, ServicesSection…).
- No cambia el pipeline de imágenes del resto del sitio ni de la ficha de
  producto: solo el card de DestacadosSection consume URLs remotas.

## Decisiones

### Decision 1 — Filtro server-side `destacado=true` + `slice(0, 8)` en el frontend

La conexión usa `GET /api/v1/products?destacado=true` (filtro definitorio en el
backend, la fuente de verdad del flag del panel) y el límite visual se aplica
donde debe: en el render del frontend, en el frontmatter de `index.astro`, con
`.slice(0, 8)` sobre la lista antes de mappear a props.

- **Alternativa descartada — solo `limit=8` al API**: delegaría el límite al
  backend y el requisito pide explícitamente el corte en la interfaz. Además,
  si la API devolviera más destacados por error de config, el frontend dejaría
  de ser el cinturón de seguridad.
- **Alternativa descartada — slice sin filtro server-side** (reusar
  `getPublicProducts()` y filtrar en JS): requiere parsear 71+ productos para
  quedarse con ≤ 8 y depende de que el campo `destacado` viaje en la
  proyección card sin contrato explícito en el backend para "destacados".
  El filtro server-side es la consulta indexada y documentada.
- La petición de destacados usa `limit=100&page=1` (una sola página: el total
  destacado nunca superará el tope del catálogo, ≤ 100 en max_limit del API),
  sin loop de paginación — diferencia deliberada respecto de
  `getPublicProducts()` que sí camina páginas.

### Decision 2 — `getFeaturedProducts()` en `lib/api/products.ts` siguiendo el patrón existente

Nueva función exportada con la firma
`getFeaturedProducts(): Promise<readonly ProductoCardApi[]>` que replica el
patrón de `getPublicProducts()`:

- Cache a nivel de módulo (una llamada HTTP por build).
- Degrada a `[]` con `console.warn` si la API falla y NO hay política fail-fast
  activa (helpers `assertCatalogSourceAvailable` / `warnCatalogFallback` /
  `resolveApiBaseUrl` reutilizados de `lib/api/apiBaseUrl.ts`; no se
  duplican).
- Respeta `REQUIRE_API=true` / `SC-env-04` (fail-fast, misma batería de reglas
  que el catálogo — ver `catalogFailFast.test.ts`).
- Tipa la respuesta contra el envelope `data`/`meta` (`api-products-pagination`).

Por qué en `products.ts` y no en un módulo nuevo: es un caso de uso del
recurso `products` y mantiene un solo archivo de transporte HTTP.

### Decision 3 — Nuevo contrato `FeaturedProduct` (modelo remoto) + mapeo puro en la home

Se modifica `lib/types/destacados-section.ts`:

```ts
export interface FeaturedProduct {
  readonly id: string;
  readonly titulo: string;
  readonly slug: string;
  readonly imageUrl: string;   // antes: imagen (ImageMetadata)
  readonly imagenAlt: string;  // derivado de galería, con fallback a titulo
}

export interface DestacadosSectionProps {
  readonly headline: string;
  readonly ctaText: string;
  readonly ctaHref: string;
  readonly products: readonly FeaturedProduct[];
}
```

El mapeo `ProductoCardApi → FeaturedProduct` vive en un helper puro y
determinista (`toFeaturedProduct`, nuevo en `lib/products/` o co-locado en la
página — se elige `lib/products/toFeaturedProduct.ts` para testearlo aislado y
seguir el patrón de `toProductCardModel.ts`):

- `titulo ← titulo`, `slug ← slug`, `id ← id`.
- `imageUrl ← galeria[0]?.url ?? ''`.
- `imagenAlt ← galeria[0]?.alt || titulo` (la galería del panel permite alt
  vacío; el fallback al título evita un `alt` vacío tras decidir que un alt
  especulativo es imposible de adivinar en build).

`DESTACADOS_SECTION_CONTENT` pierde la propiedad `products` (queda como
`Omit<DestacadosSectionProps, 'products'>` con solo la copy de cabecera) y deja
de importar imágenes de `assets/img/`. Esto es **BREAKING** interno
(`FeaturedProduct` cambia de firma), con consumidores acotados a
`index.astro`, los tests del componente y el snapshot.

### Decision 4 — Imagen de tarjeta con `<img>` directo (se sale de `astro:assets`)

Las imágenes de productos del panel son URLs públicas de Firebase Storage; no
son assets importables de `src/assets/`, por lo que el pipeline
`astro:assets`/sharp (hash `/_astro/…`, `width`/`height`, `widths`/`sizes`) no
aplica sin configurar `image.remotePatterns` y depender del servidor de
imágenes de Astro durante el build.

- **Elección**: `<img loading="lazy" decoding="async" src={imageUrl}
  class="w-full aspect-square object-contain">`, manteniendo el mat
  (`div p-4`) y la estética flat de la tarjeta. Este patrón ya existe en el
  sitio: `ProductCard.astro` del catálogo renderiza URLs remotas de Storage
  con `<img>` directo (`object-cover` ahí, `object-contain` aquí por el mat
  cuadrado de producto existente).
- **Alternativa descartada — `<Image>` con `remotePatterns` de Storage**:
  procesaría/optimizaría al build, pero acopla la sección al dominio/publicURL
  exacto de Storage (fragilidad de config), añade fetch de imagen por build,
  y rompe la paridad con el patrón ya establecido en catálogo por
  `web-product-card-adaptation`.
- Costo asumido: se pierden `srcset`/dimensiones explícitas de la tarjeta
  destacada (risgo menor de CLS, mitigado por la reserva de aspecto cuadrado
  `aspect-square` y por `min-h` del título).

Se conserva `loading="lazy"` (sección bajo el fold) y el `alt` descriptivo no
vacío (con fallback documentado en Decision 3).

### Decision 5 — Placeholder de imagen ausente SIN icono

Si `imageUrl === ''`, el mat renderiza el `<div class="p-4 aspect-square">`
vacío (fondo blanco del card, sin `<img>` y sin svg). Se descarta reusar el
`lucide:image-off` de `ProductCard.astro` para NO introducir `astro-icon` en
esta sección (rompería la regla del spec/main de iconos "no `<svg>`" y el test
que la verifica). El estado "sin imagen" queda visualmente como mat blanco
vacío; aceptable para un caso degradado que el editor del panel debería
corregir.

### Decision 6 — La grilla no cambia: clase única, flujo automático

La grilla ya cumple el requisito de maquetación
(`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8` en
`DestacadosSection.astro:68`). Con N entre 5 y 8, CSS Grid auto-placement
genera la segunda fila (4 por fila en desktop) sin clases condicionales ni
JS. El diseño no añade nada aquí: se limita a **actualizar los tests** que
atan la sección a exactamente 4 cards (`test-utils`, snapshot) para que
trabajen con props de 0..8 y los escenarios del delta (5-8 → 2 filas).

### Decision 7 — Idioma del delta spec

Los encabezados de requisitos MODIFIED/REMOVED copian verbatim los del spec
principal (requerido para el merge de archive); el texto nuevo va en español,
como pide `openspec/config.yaml`. Los requirements ADDED llevan título
español (deliberado: son bloques completamente nuevos).

## Riesgos / Trade-offs

- **[N=0: sección con grid vacía]** → El spec fija el escenario como degradación
  explícita (header + 0 cards), coherente con el catálogo público en build sin
  backend. La alternativa (ocultar la sección) cambiaría la jerarquía de
  headings del home y complica el outline test; se descarta por ahora.
- **[CLS en tarjetas sin srcset]** → Reserva de aspecto (`aspect-square` en el
  mat + `min-h-[4.5rem]` del título) mantiene alturas estables; el ancho real
  nunca excede 1/4 del contenedor en desktop.
- **[Peso de imágenes de Storage sin optimización]** → las galerías del panel
  ya se muestran sin optimizar en catálogo/ficha (patrón aceptado); la tarjeta
  destacada no agrava el caso. Futuro: `remotePatterns` de Storage si el
  cliente exige LCP superior.
- **[Test heredado "astro:assets" rompe]** → el test de imagen del componente
  verifica `/_image?href=...`; se reescribe contra la URL remota (y se
  regenera el snapshot).
- **[Slug inexistente / despublicado del card destacado]** → el CTA
  "Ver detalles" apunta a `/productos/{slug}`; si el producto se despublica
  tras el build, el link caería en 404 hasta el próximo build. Mitigación
  estructural existente: el despliegue reconstruye el sitio cuando se cambia
  el catálogo (webhook de rebuild de catálogo); no se agrega código para esto
  en este change.
- **[`destacado` sigue sin viajar en el tipo web]** → el fetch usa filtro
  server-side, así que el frontend no necesita leer el flag; opcionalmente se
  añade `destacado?: boolean` a `ProductoCardApi` como el resto de
  extras de card (`stock`, `actualizadoEn`) por fidelidad de contrato. Costo
  mínimo, permite el test de contrato.

## Plan de migración

1. Backend: nada (usar el endpoint ya existente).
2. Deploy del frontend (`apps/web` build + Cloud Run/Coolify pipeline actual):
   el build produce la home panel-driven.
3. Rollback: revert del commit del change y re-deploy del SSG (la constante
   eliminada vuelve con el revert); el propio build falla en fail-fast solo
   bajo `REQUIRE_API=true`, igual que hoy.
4. Datos: el cliente marca/desmarca `destacado` desde el panel; si hay menos
   de 5… la sección sigue mostrando la grilla (1 fila para ≤ 4).

## Open Questions

- Ninguno bloqueante. Punto asumido y documentado en el delta: el estado N=0
  renderiza header + grid vacía (propuesta de UX aceptada por simplicidad y
  simetría con el resto del sitio; si el cliente prefiere ocultar la sección
  vacía, es un cambio futuro pequeño).
