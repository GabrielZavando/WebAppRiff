## 1. Buscador (`SearchForm.astro`) — tests primero

- [x] 1.1 Actualizar `apps/web/src/components/__tests__/SearchForm.test.ts`: sustituir la aserción del `<span class="hidden sm:inline">BUSCAR</span>` por la del `<span class="hidden">` (sin variante `sm:`), añadir la aserción de `sm:max-w-[60px]` y de `px-4` (sin `sm:px-8`/`px-6`) en el botón, y la aserción de `sm:flex-1 min-w-0` en el contenedor del `<select>` (sin `sm:w-64` ni `sm:shrink-0`)
- [x] 1.2 Actualizar `apps/web/e2e/search-form.spec.ts`: aserción de clases del botón, ancho máximo de 60px en `>= 640px`, nombre accesible "BUSCAR" en todos los breakpoints, `<span>` oculto en todos los breakpoints, y reparto equitativo select/input (diferencia ≤ 2px) con ancho de select ≥ 256px en `640×800` y `640×375`
- [x] 1.3 Ejecutar los tests afectados y confirmar que fallan por el comportamiento aún no implementado (TDD)

## 2. Buscador — implementación

- [x] 2.1 En `apps/web/src/components/SearchForm.astro`, cambiar el botón submit a `px-4 sm:max-w-[60px]` (eliminar `sm:px-8`) y ocultar la etiqueta con `<span class="hidden">`, conservando `aria-label="BUSCAR"` y el ícono `lucide:search` decorativo
- [x] 2.2 En el mismo componente, cambiar el contenedor del `<select>` a `sm:flex-1 sm:min-w-0` (eliminar `sm:w-64` y `sm:shrink-0`) y mantener `sm:flex-1 min-w-0` en el contenedor del `<input>`
- [x] 2.3 Actualizar los comentarios de layout del componente para reflejar el comportamiento nuevo (botón solo-ícono y reparto equitativo)
- [x] 2.4 Regenerar el snapshot `apps/web/src/components/__tests__/__snapshots__/SearchForm.test.ts.snap` y reejecutar los unit tests de `apps/web`

## 3. "Servicios especializados" (`ServicesSection.astro`) — tests primero

- [x] 3.1 Actualizar `apps/web/src/components/__tests__/ServicesSection.test.ts`: sustituir el bloque "card layout (horizontal, mobile-first)" por aserciones de layout vertical (`flex-col`, sin `sm:flex-row`), imagen `w-full` sin `sm:w-2/5`,ratio 5:4 conservado y orden del DOM imagen → `<h4>` → `<p>` → CTA
- [x] 3.2 Actualizar `apps/web/e2e/services-section.spec.ts`: sustituir el test de layout horizontal por verificaciones de layout vertical a `640×800` y en escritorio (imagen a ancho completo, título/descripción/CTA apilados, sin overflow)
- [x] 3.3 Ejecutar los tests afectados y confirmar que fallan por el comportamiento aún no implementado (TDD)

## 4. "Servicios especializados" — implementación

- [x] 4.1 En `apps/web/src/components/ServicesSection.astro`, eliminar `sm:flex-row` del `<article>` y `sm:w-2/5` de la imagen (conservando `w-full aspect-[5/4]`)
- [x] 4.2 Verificar que el orden del DOM es imagen → título → descripción → CTA y que el CTA conserva `mt-4` y `self-start` en el flujo vertical
- [x] 4.3 Actualizar el comentario de layout del componente (Decision 7: tarjeta vertical en todos los breakpoints)
- [x] 4.4 Regenerar el snapshot `apps/web/src/components/__tests__/__snapshots__/ServicesSection.test.ts.snap` y reejecutar los unit tests de `apps/web`

## 5. "Liderazgo & Experiencia" (`NosotrosTeamSection.astro`) — tests primero

- [x] 5.1 Añadir en `apps/web/src/components/__tests__/NosotrosTeamSection.test.ts` las aserciones de tamaño de fuente del overlay: nombre con `text-xl` en base y `sm:text-lg`, cargo con `text-xs` en base y `sm:text-[0.625rem]`
- [x] 5.2 Añadir en `apps/web/e2e/responsive-layout.spec.ts` la verificación de que el texto superpuesto de las tarjetas de equipo se renderiza con el tamaño reducido en `640×800` y no desborda la tarjeta
- [x] 5.3 Ejecutar los tests afectados y confirmar que fallan por el comportamiento aún no implementado (TDD)

## 6. "Liderazgo & Experiencia" — implementación

- [x] 6.1 En `apps/web/src/components/NosotrosTeamSection.astro`, cambiar el nombre del overlay a `text-xl sm:text-lg` y el cargo a `text-xs sm:text-[0.625rem]`, conservando tokens, pesos y `uppercase tracking-wider`
- [x] 6.2 Actualizar el comentario de layout del componente para documentar la reducción de tipografía en `sm`
- [x] 6.3 Reejecutar los unit tests de `apps/web`

## 7. Validación final

- [x] 7.1 Ejecutar `npm run lint --workspace=apps/web` y `npm run typecheck --workspace=apps/web`
- [x] 7.2 Ejecutar `npm run test --workspace=apps/web` (unit tests y snapshots)
- [x] 7.3 Ejecutar `npm run test:smoke --workspace=apps/web` (e2e Playwright) o el subconjunto de specs afectados
- [x] 7.4 Ejecutar `npx openspec validate --all --strict` y `make ci` (o los targets equivalentes) para el gate completo

## 8. Copy del placeholder del buscador — tests primero

- [x] 8.1 Actualizar `apps/web/src/lib/config/__tests__/search-form.test.ts` y `apps/web/src/lib/types/__tests__/search-form.test.ts` para esperar el placeholder "¿Qué estás buscando?"
- [x] 8.2 Actualizar `apps/web/src/components/__tests__/SearchForm.test.ts` y `apps/web/e2e/search-form.spec.ts` para esperar el placeholder "¿Qué estás buscando?"
- [x] 8.3 Ejecutar los tests afectados y confirmar que fallan por el copy aún no implementado (TDD)

## 9. Copy del placeholder del buscador — implementación

- [x] 9.1 Cambiar `SEARCH_FORM_DEFAULTS.inputPlaceholder` en `apps/web/src/lib/config/search-form.ts` a "¿Qué estás buscando?"
- [x] 9.2 Actualizar el doc-comment de `SearchFormConfig.inputPlaceholder` en `apps/web/src/lib/types/search-form.ts` y el valor de ejemplo de `SEARCH_PLACEHOLDER` en `apps/web/.env.example`
- [x] 9.3 Regenerar el snapshot `apps/web/src/components/__tests__/__snapshots__/SearchForm.test.ts.snap` y reejecutar los unit tests de `apps/web`

## 10. Validación final del ajuste de copy

- [x] 10.1 Ejecutar `npm run lint --workspace=apps/web` y `npm run typecheck --workspace=apps/web`
- [x] 10.2 Ejecutar `npm run test --workspace=apps/web` y el e2e de `search-form.spec.ts`
- [x] 10.3 Ejecutar `npx openspec validate --all --strict` y `make ci`
