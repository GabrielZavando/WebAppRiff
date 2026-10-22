# Design — Carrusel infinito de logos de clientes

## Context

La página `/nosotros` compone seis componentes presentacionales (dumb) alimentados por
`NOSOTROS_PAGE_CONTENT` (`apps/web/src/lib/config/nosotros-page.ts`). La sección final
(`NosotrosClients.astro`) renderiza hoy un encabezado, una **grilla estática de 8 nombres**
(`ClientCard = { name, subtitle }`, `grid-cols-2 sm:grid-cols-4 lg:grid-cols-8`) y el banner
de cierre con CTAs.

El cliente entregó **41 logos reales** en `apps/web/src/assets/img/slider/` (39 `.png` + 2
`.jpeg`), hoy sin uso. El objetivo es reemplazar la grilla por un carrusel infinito, lento,
que pause al hover y escale el logo con aceleración por GPU, sirviendo los logos como WebP
generado en build time.

Restricciones del proyecto relevantes:

- `docs/frontend-standards.md` § Imágenes: assets en `src/assets/img/`, importados con alias
  `@`, renderizados con `<Image>`/`<Picture>` de `astro:assets`; prohibido `@astrojs/image`.
- `docs/frontend-standards.md` § Principios Astro: componente = una responsabilidad; el
  frontmatter no concentra lógica de negocio no trivial; componentes dumb separados de la
  configuración.
- `openspec/specs/nosotros-page/spec.md`: SC-207 (clientes + banner), SC-210 (sin hex ni
  `rounded*`), SC-211 (responsive), SC-212 (alt no vacío, jerarquía).
- `openspec/specs/image-assets/spec.md`: pipeline astro:assets + sharp.
- Sitio `output: 'static'` (`apps/web/astro.config.mjs`): toda optimización ocurre en build.
- Precedente de CSS animations: `<style>` scoped en `Toast.astro` (`@keyframes toast-in`).
- Precedente de JS vanilla (solo si hiciera falta): módulos TS testeados en `src/lib/` +
  `<script>` en el `.astro` (`lib/scroll/createHeaderScrollState.ts`, `Layout.astro`).

## Goals / Non-Goals

**Goals:**

- Reemplazar la grilla de 8 nombres por un carrusel con los 41 logos, orden alfabético por
  nombre de empresa.
- Loop infinito continuo de derecha a izquierda, 120 s por ciclo, sin JavaScript.
- Pausa al hover del carrusel y reanudación al retirar el cursor.
- Cada logo visible completo (sin recorte), con altura uniforme y ancho proporcional a su
  relación de aspecto, sobre una tarjeta blanca con padding.
- En escritorio la tarjeta mide 120 px de alto incluyendo el padding.
- Al hover, el logo completo escala ≈1.05 dentro de su tarjeta blanca sin recortarse,
  compuesto por GPU (`scale3d` + `will-change`), sin la propiedad CSS `scale` estándar.
- Logos servidos como WebP en build time vía `astro:assets`, `loading="lazy"` y `alt`
  explícito.
- `prefers-reduced-motion: reduce` detiene la animación (logos estáticos).
- Mantener intactos encabezado y banner de cierre.

**Non-Goals:**

- Drag/swipe, pausa por touch, controles de navegación manual o paginación.
- Normalización de color de los logos (grayscale/duotone) no solicitada.
- Cambios en backend, API, base de datos o dependencias nuevas.
- Cambios en el orden o la selección de clientes más allá de los 41 assets entregados.

## Decisions

### D1 — Carrusel CSS puro con track duplicado (marquee)

Se implementa con un viewport `overflow-hidden` y un track `flex` que contiene **dos copias
idénticas** de la lista de logos. La animación va de `translate3d(0,0,0)` a
`translate3d(-50%,0,0)` con `linear infinite`: al terminar, la segunda copia ocupa exactamente
la posición inicial de la primera, produciendo un loop sin salto.

- **Alternativa descartada**: loop por JavaScript (`requestAnimationFrame` o repetición de
  nodos). Añade JS al bundle, trabajo en el main thread y complejidad de test; no es necesario
  para los requisitos.
- **Detalle crítico (seam)**: el espaciado se aplica como `margin-right` en **cada** ítem
  (incluido el último), no como `gap` del flex. Así ambas mitades miden exactamente lo mismo y
  `-50%` coincide con una copia completa. Un `gap` dejaría una costura de un gap en el loop.

### D2 — Pausa al hover con `animation-play-state`

El viewport expone el estado hover (clase `group` de Tailwind) y el track declara
`animation-play-state: paused` al hover (clase utilitaria en `<style>` o arbitraria
`group-hover:[animation-play-state:paused]`). Al retirar el cursor, el navegador reanuda la
animación desde el punto exacto; no se requiere reiniciar ni JS.

- **Alternativa descartada**: pausar añadiendo/quitando una clase con JS. Innecesario.
- **Limitación aceptada**: en touch no existe hover, por lo que el carrusel sigue animándose
  (comportamiento estándar de marquee). Pausar en touch queda fuera de alcance.

### D3 — Escala del logo con `scale3d` y promoción a GPU

Cada tarjeta blanca incluye padding alrededor del logo. El `scale3d(1.05, 1.05, 1)` se
aplica a la **imagen** del logo en `:hover`/`:focus-visible` (vía
`.clients-carousel__item:hover .clients-carousel__logo`), con
`transition: transform 200ms ease-out` y `will-change: transform`. La tarjeta conserva su
tamaño y fondo blanco; la imagen ampliada crece dentro del padding sin recortarse.

- El viewport añade una holgura vertical (`padding-block`) para que el logo ampliado no sea
  recortado por el `overflow-hidden`; ese recorte se mantiene solo para el desborde
  horizontal del marquee.
- Se usa **`scale3d` dentro de `transform`**, no la propiedad CSS independiente `scale`
  (que es lo que generan utilidades como `scale-105` en Tailwind v4). Esto garantiza que el
  navegador trate el cambio como transform compositable.
- `will-change: transform` se declara en la imagen en hover/focus (no permanentemente en los
  82 ítems) para evitar crear decenas de capas de compositor en reposo; el track, que sí anima
  permanentemente, lleva su propio `will-change: transform` (una sola capa).
- **Alternativa descartada**: `hover:scale-105` de Tailwind, porque emite la propiedad `scale`
  y no cumple el requisito explícito de delegar en `scale3d`/GPU.
- **Alternativa descartada**: escalar la celda `<li>`; agranda también la caja blanca, de modo
  que el logo nunca desborda su contenedor.

### D4 — `prefers-reduced-motion` detiene la animación

`@media (prefers-reduced-motion: reduce)` fija `animation: none` en el track. Los logos quedan
visibles y estáticos; el hover/scale sigue funcionando (es una interacción puntual, no
movimiento continuo).

### D5 — WebP en build time vía `<Image>` con ancho proporcional

Los 41 archivos se importan en un módulo de configuración
(`apps/web/src/lib/config/nosotros-clients.ts`) y se renderizan con
`<Image src={logo.image} alt={logo.alt} width={...} height={80} format="webp" loading="lazy">`.
Con `output: 'static'`, sharp re-encodea en build y emite archivos `.webp` con hash en
`dist/_astro/`; el HTML referencia la ruta optimizada, nunca el asset crudo.

- **Recorte del margen interno**: 33 de los 41 assets son lienzos 400×400 (o con márgenes
  amplios) donde el logo ocupa una fracción del alto. Se generan variantes recortadas al
  contenido en `slider/trimmed/*.png` con `sharp.trim({ threshold: 10 })`, y la config importa
  esas variantes. Así la altura uniforme de 80 px corresponde al logo visible y el ancho sale
  de su proporción real (p. ej. Andina pasa de 400×400 a 295×50).
- **Altura uniforme y ancho por relación de aspecto**: el `width` de cada `<Image>` se calcula
  con `Math.round((image.width / image.height) * LOGO_HEIGHT)`. El `fit` por defecto de Astro
  es `cover`, que recortaría el logo al forzar una caja 160×80; al generar cada imagen con su
  proporción intrínseca, el logo se muestra completo y sin distorsión.
- **Tarjeta blanca con padding y ancho automático**: el `<li>` tiene fondo blanco, padding
  (`0.75rem` móvil / `1rem` escritorio) y un ancho que se ajusta al logo. La altura es
  `6.5rem` en móvil y `7.5rem` (120 px) desde `min-width: 768px`, incluyendo el padding;
  el logo ocupa toda la altura del contenido (80 px / 88 px) sin recortarse.
- **Alternativa descartada**: `<Picture>` con AVIF. Los logos son pequeños; WebP es suficiente
  y es el formato pedido explícitamente.

### D6 — Configuración dedicada y orden alfabético

Nuevo `apps/web/src/lib/config/nosotros-clients.ts`:

- `CLIENT_LOGOS: readonly ClientLogo[]` — 41 entradas en **orden alfabético por nombre de
  empresa**; el orden del array es la fuente de verdad.
- `CLIENTS_CAROUSEL_DURATION_SECONDS = 120` — constante de duración del ciclo (mitad de
  velocidad que el valor inicial de 60 s, por ajuste de UX).
- Mapa explícito archivo → `alt` (nombre de empresa). No se deriva del filename por las
  inconsistencias detectadas (`dp-worl.png`, `sqm.png`, `Logo_EPV.png`, etc.).

`nosotros-page.ts` importa `CLIENT_LOGOS` y los expone en `NOSOTROS_PAGE_CONTENT.clients.logos`,
manteniendo el patrón "la página posee la config, los componentes solo renderizan".

- **Alternativa descartada**: importar los assets dentro del componente. Rompe el patrón dumb y
  la testabilidad de la config.

### D7 — Separación de componentes (SRP)

- Nuevo `NosotrosClientsCarousel.astro` (dumb): recibe `logos` y `durationSeconds`; renderiza
  viewport + track duplicado + `<style>` de animación. Testeable en aislamiento.
- `NosotrosClients.astro`: conserva encabezado y banner; sustituye el grid por
  `<NosotrosClientsCarousel logos={logos} durationSeconds={...} />`.

**Tipos**: `ClientCard` se elimina; se introduce
`ClientLogo { readonly image: ImageMetadata; readonly alt: string }`. `NosotrosClientsProps`
pasa de `clients: readonly ClientCard[]` a `logos: readonly ClientLogo[]`.

### D8 — Semántica y accesibilidad

- Dos copias de la lista (`<ul>`/`<li>` o contenedores equivalentes); la **segunda copia**
  lleva `aria-hidden="true"` para no duplicar contenido a lectores de pantalla.
- Cada `<img>` lleva `alt` no vacío (nombre de empresa) y `loading="lazy"`.
- El viewport lleva `role="group"` + `aria-label="Logos de clientes"` (nombre no vacío), sin
  convertirse en una región interactiva.
- Jerarquía: se mantiene el `<h2>` de la sección y el `<h3>` del banner (SC-212).

### D9 — Estilos y tokens

Todo el estilo usa tokens/utilities del proyecto (sin hex literales, sin `rounded*`, flat
design). La animación y el hover viven en un `<style>` scoped del componente (precedente
`Toast.astro`), con nombres de clase semánticos (`clients-carousel`, `clients-carousel__track`,
`clients-carousel__item`). La duración se inyecta como custom property
(`--clients-carousel-duration`) desde la constante de config.

## Risks / Trade-offs

- **83 `<img>` en el DOM (41 × 2 por la duplicación)** → markup algo más pesado; se acepta
  porque no hay JS y sharp cachea el mismo asset (un archivo por logo en `dist`).
- **Costura visible si el espaciado se implementa con `gap`** → se usa `margin-right` en cada
  ítem; test de estructura que verifica el patrón.
- **82 capas GPU si `will-change` se aplica en reposo a cada logo** → `will-change` solo en
  hover/focus del ítem; el track animado lleva la única capa permanente.
- **Logos con fondos/colores dispares sobre sección oscura** (`bg-secondary`)** → celda con
  fondo claro (`bg-white`) y `object-contain`; verificación visual en implementación.
- **Nombres de empresa ambiguos en algunos archivos** (`dp-worl.png`, `GS.png`, `Cementos.png`,
  `Ideal.png`, `Lobos.png`, `Petreos.png`, `SanPedro.png`) → el mapa de alt se define explícito
  y se confirma con el cliente durante la implementación; el test exige alts únicos y no vacíos.
- **Touch sin pausa** → aceptado como non-goal; el carrusel sigue siendo legible.

## Migration Plan

1. Añadir config + tipos + componente + tests (TDD: tests primero).
2. Actualizar `NosotrosClients.astro` y `nosotros-page.ts`.
3. `make ci` (openspec validate + lint + typecheck + test + audit) y rebuild SSG.
4. Rollback: revertir el commit; el sitio estático vuelve a la imagen anterior. Sin migración
   de datos ni cambios de infraestructura.

## Open Questions

- Confirmar el nombre visible exacto de los logos ambiguos (`dp-worl`, `GS`, `Cementos`,
  `Ideal`, `Lobos`, `Petreos`, `SanPedro`) antes de fijar los `alt` definitivos.
- Confirmar visualmente si la celda blanca es el mejor tratamiento para todos los logos o si
  algunos requieren fondo transparente.
