## 1. HeroBanner.astro — Subtítulo y descripción

- [x] 1.1 Cambiar clase del subtítulo (h2) de `text-xl md:text-2xl` a `text-base md:text-lg lg:text-xl` en la línea 51 (POST-APPLY: el cliente pidió un tamaño menor también en tablet/desktop).
- [x] 1.2 Agregar `hidden sm:block` al párrafo descriptivo (p) en la línea 54 para ocultarlo en base (< 640px) y mostrar desde `sm:`.
- [x] 1.3 Reducir el titular (h1) de `text-4xl sm:text-5xl md:text-7xl` a `text-3xl sm:text-4xl md:text-6xl` (POST-APPLY: "Innovación que Fluye" debía ser más pequeño).

## 2. ServicesSection.astro — Aspect ratio 5:4

- [x] 2.1 Cambiar `aspect-square` a `aspect-[5/4]` en la línea 79 (clase del componente Image).

## 3. DestacadosSection.astro — Aspect ratio 5:4

- [x] 3.1 Cambiar `aspect-square` a `aspect-[5/4]` en la línea 74 (clase del elemento img).

## 4. NosotrosTeamSection.astro — Descripción fuera del overlay

- [x] 4.1 POST-APPLY: eliminar el párrafo de descripción (líneas 106-108) del overlay en TODOS los breakpoints; el overlay muestra solo Nombre y Cargo.
- [x] 4.2 POST-APPLY: actualizar `NosotrosTeamSection.test.ts` para exigir que la descripción NO se renderice en el overlay.
- [x] 4.3 POST-APPLY: verificar que `NosotrosTeamGrid.astro` (página "Nosotros") sigue renderizando `member.description`.

## 5. Validación visual y pruebas

- [x] 5.1 Verificar cambios en HeroBanner: subtítulo reducido y descripción oculta en móvil (< 640px); ambos visibles en sm+.
- [x] 5.2 Verificar ServicesSection: imágenes mantienen aspect ratio 5:4 en todos los breakpoints.
- [x] 5.3 Verificar DestacadosSection: imágenes mantienen aspect ratio 5:4 en todos los breakpoints.
- [x] 5.4 Verificar NosotrosTeamSection: solo Nombre y Cargo visibles (POST-APPLY: en todos los breakpoints).
- [x] 5.5 Ejecutar `make lint` y `make typecheck` para validar que no hay regresiones.
- [x] 5.6 Ejecutar `npx openspec validate --all --strict` para validar especs.

## 6. POST-APPLY — Verificación de la ocultación de la descripción del equipo

- [x] 6.1 Confirmar en el HTML compilado (`apps/web/dist/index.html`) que el párrafo de descripción del equipo incluía `hidden sm:block` (estado intermedio, ya obsoleto tras el POST-APPLY 4.1).
- [x] 6.2 Confirmar en el CSS compilado que `.hidden{display:none}` existe y que `.sm\:block{display:block}` está dentro de `@media (width>=640px)`.

## 7. POST-APPLY — Tests y snapshots (ajustes de tipografía y overlay)

- [x] 7.1 `HeroBanner.test.ts`: actualizar la aserción del `<h1>` a `text-3xl sm:text-4xl md:text-6xl` y añadir la del `<h2>` (`text-base md:text-lg lg:text-xl`).
- [x] 7.2 `HeroBanner.test.ts`: añadir aserción de `hidden sm:block` en la descripción.
- [x] 7.3 `DestacadosSection.test.ts`: exigir `aspect-[5/4]` (y no `aspect-square`) en el mat de cada imagen.
- [x] 7.4 `ServicesSection.test.ts`: añadir aserción de `aspect-[5/4]` en cada imagen de tarjeta.
- [x] 7.5 Actualizar los snapshots de `HeroBanner`, `ServicesSection` y `DestacadosSection`.
- [x] 7.6 Ejecutar `make test` (48 + 118 + 1 archivos, 1656 tests) — todo en verde.