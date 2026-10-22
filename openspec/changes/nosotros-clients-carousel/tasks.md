## 1. Configuración de logos y tipos (TDD)

- [x] 1.1 Crear `apps/web/src/lib/config/__tests__/nosotros-clients.test.ts` (falla): `CLIENT_LOGOS` tiene exactamente 41 entradas, está ordenado alfabéticamente por `alt`, los `alt` son únicos y no vacíos, y `CLIENTS_CAROUSEL_DURATION_SECONDS` vale 120.
- [x] 1.2 En `apps/web/src/lib/types/nosotros-page.ts`, introducir `ClientLogo { image: ImageMetadata; alt: string }` y retirar `ClientCard`; actualizar `NosotrosClientsProps` de `clients` a `logos`.
- [x] 1.3 Crear `apps/web/src/lib/config/nosotros-clients.ts` con los 41 imports de `@/assets/img/slider/*` (39 `.png` + 2 `.jpeg`), el mapa explícito archivo → nombre de empresa, el array en orden alfabético y la constante de duración (120 s). Verificar los nombres ambiguos con el cliente (D-Open-Questions).

## 2. Componente del carrusel (TDD)

- [x] 2.1 Crear `apps/web/src/components/__tests__/NosotrosClientsCarousel.test.ts` (falla): renderiza 2 copias de los 41 logos; la segunda copia lleva `aria-hidden="true"`; cada `<img>` tiene `alt` no vacío, `loading="lazy"` y `src` optimizado por astro:assets (no ruta cruda); sin `rounded*` ni hex; el `<style>` contiene `scale3d`, `will-change: transform`, `animation-play-state: paused`, `prefers-reduced-motion` y la duración de 120 s.
- [x] 2.2 Implementar `apps/web/src/components/NosotrosClientsCarousel.astro`: viewport `overflow-hidden` + track duplicado, `@keyframes` de `translate3d(0 → -50%)` `linear infinite`, espaciado por `margin-right` en cada ítem (sin `gap`, D1), pausa por hover (D2), escala `scale3d(1.05,1.05,1)` + `will-change` en hover/focus sin la propiedad `scale` (D3), `animation: none` con `prefers-reduced-motion` (D4), `<Image format="webp" loading="lazy">` en celdas `object-contain` (D5), duración vía custom property desde `durationSeconds`.
- [x] 2.3 Verificar en el test que el efecto hover NO usa la utilidad `scale-105` ni la propiedad CSS `scale`.

## 3. Integración en la sección de clientes

- [x] 3.1 Actualizar `apps/web/src/components/__tests__/NosotrosClients.test.ts` (falla): retirar las aserciones de la grilla de 8 nombres/bajadas (SC-207/SC-211 antiguos), exigir el carrusel con 41 logos y conservar las aserciones del banner (título, CTA `/contacto`, `tel:`, sin `rounded`/hex/shadow en botones, Lucide).
- [x] 3.2 Actualizar `apps/web/src/components/NosotrosClients.astro` para renderizar `<NosotrosClientsCarousel logos={logos} durationSeconds={...} />` y eliminar el grid de tiles.
- [x] 3.3 Actualizar `apps/web/src/lib/config/nosotros-page.ts`: quitar el array de 8 clientes y exponer `logos: CLIENT_LOGOS` en `NOSOTROS_PAGE_CONTENT.clients`, manteniendo encabezado y banner.

## 4. Verificación

- [x] 4.1 Verificación visual responsive (móvil/tablet/desktop): sin costura en el loop, pausa y reanudación al hover, escala fluida, sin scroll horizontal, logos legibles sobre `bg-secondary`.
- [x] 4.2 Confirmar que el build SSG emite los 41 logos como `.webp` con hash en `dist/_astro/` y que el HTML referencia las rutas optimizadas (no las crudas).
- [x] 4.3 Ejecutar `make ci` (openspec validate --all --strict + lint + typecheck + test + audit) y dejar el gate en verde.

## 5. Ajustes de UX post-verificación (TDD)

- [x] 5.1 Actualizar tests (fallan): constante de 120 s; cada `<img>` con `width` proporcional a la relación de aspecto del asset a altura uniforme (sin recorte por `fit: cover`); celda de ancho automático; hover con `scale3d` sobre la imagen del logo y holgura vertical del viewport para que el logo ampliado desborde la celda sin recortarse.
- [x] 5.2 Reducir la velocidad a la mitad: `CLIENTS_CAROUSEL_DURATION_SECONDS = 120` y fallbacks del componente a 120 s.
- [x] 5.3 Generar las variantes recortadas al contenido en `apps/web/src/assets/img/slider/trimmed/` (`sharp.trim({ threshold: 10 })`) y renderizar cada logo con ancho proporcional a su aspecto real (`Math.round(image.width / image.height * LOGO_HEIGHT)`) en celdas sin ancho fijo, para mostrarlo completo.
- [x] 5.4 Mover el `scale3d` del hover de la celda `<li>` a la imagen del logo y añadir `padding-block` al viewport, de modo que el logo completo se amplíe desbordando la celda blanca sin recortes.
- [x] 5.5 Verificación visual responsive + build + `make ci` en verde.

## 6. Ajuste de tarjetas: padding, fondo blanco y altura desktop (TDD)

- [x] 6.1 Actualizar tests (fallan): cada `<li>` lleva `bg-white`; CSS con padding `0.75rem` (móvil) y `1rem` (escritorio); altura `6.5rem` móvil y `7.5rem` (120 px incluyendo padding) desde `min-width: 768px`; el `<Image>` mantiene proporción y una altura uniforme.
- [x] 6.2 Aplicar fondo blanco y padding a cada tarjeta, y las alturas responsive en `NosotrosClientsCarousel.astro`.
- [x] 6.3 Ajustar la altura de render de los logos para que el contenido se vea nítido con el nuevo padding.
- [x] 6.4 Verificación visual desktop/móvil (120 px incluyendo padding, fondo blanco, hover) + build + `make ci` en verde.
