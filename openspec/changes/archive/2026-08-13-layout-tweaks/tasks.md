## 1. Specs & Tests (TDD — fase roja)

- [x] 1.1 Actualizar `Header.test.ts`: reemplazar aserción `w-[330px]` por `max-w-[200px]` + `sm:max-w-[300px]` (y `w-full`)
- [x] 1.2 Actualizar `SearchForm.test.ts`: reemplazar aserción "sin padding horizontal" por `px-4` + `md:px-0`; mantener "no contiene px-6/px-8"
- [x] 1.3 Actualizar `HeroBanner.test.ts`: reemplazar aserción simétrica `py-16`/`md:py-24` por `pt-4`/`md:pt-8`/`lg:pt-12`
- [x] 1.4 Ejecutar `vitest` en `apps/web` y confirmar que fallan los tres tests de componente (rojo)

## 2. Implementación (TDD — fase verde)

- [x] 2.1 Editar `Header.astro`: cambiar clase del `<img>` logo a `block h-auto w-full max-w-[200px] sm:max-w-[300px]`
- [x] 2.2 Editar `SearchForm.astro`: agregar `px-4 md:px-0` al contenedor interno (`max-w-[860px] mx-auto py-4`)
- [x] 2.3 Editar `HeroBanner.astro`: cambiar padding del wrapper a `pt-4 pb-16 md:pt-8 md:pb-24 lg:pt-12 lg:pb-32`
- [x] 2.4 Ejecutar `vitest` en `apps/web` y confirmar que todos los tests pasan (verde)

## 3. Snapshots y verificación

- [x] 3.1 Regenerar snapshots con `vitest -u` en `apps/web`
- [x] 3.2 Ejecutar suite completa de `vitest` y confirmar que no hay regresiones (517 passed)
- [x] 3.3 Ejecutar lint/typecheck en `apps/web` (eslint 0 errores en tests; .astro lint-ignored por config de proyecto; componentes compilan vía AstroContainer)
- [x] 3.4 Verificación visual vía dev server (`npm run dev` en `apps/web`) en anchos móvil/tablet/desktop — revisión del cliente completada (aprobó estado final)

## 4. Fix: header más bajo en móvil (revisión en dispositivo)

- [x] 4.1 Actualizar `Header.test.ts`: añadir aserciones `h-20 lg:h-24` en el wrapper y `max-h-full lg:max-h-none` en el `<img>` del logo
- [x] 4.2 Editar `Header.astro`: contenedor y wrapper `<a>` de `h-24` → `h-20 lg:h-24`; agregar `max-h-full lg:max-h-none` al `<img>` del logo
- [x] 4.3 Ejecutar `vitest` en `apps/web` y confirmar que el test de Header pasa (verde)
- [x] 4.4 Regenerar snapshot de `Header.test.ts` (`vitest -u`) y verificar diff
- [x] 4.5 Re-verificar visualmente en móvil que el header es más bajo y el buscador sube — revisión del cliente completada

## 5. Tweak: SearchForm inner width 800px (post-apply)

- [x] 5.1 Actualizar `search-form/spec.md`: reemplazar `max-w-[860px]` por `max-w-[800px]` en requisito y escenario
- [x] 5.2 Actualizar `SearchForm.test.ts`: aserción de ancho `max-w-[860px]` → `max-w-[800px]` (rojo)
- [x] 5.3 Ejecutar `vitest` (solo SearchForm) y confirmar que falla la aserción de ancho (rojo)
- [x] 5.4 Editar `SearchForm.astro`: `max-w-[860px]` → `max-w-[800px]` (verde)
- [x] 5.5 Ejecutar `vitest` (solo SearchForm) y confirmar que pasa (verde)
- [x] 5.6 Regenerar snapshot `SearchForm.test.ts` (`vitest -u`)

## 6. Tweak: HeroBanner `<h1>` más grande (post-apply)

- [x] 6.1 Actualizar `hero-banner/spec.md`: escenarios de tipografía h1 `text-4xl` → `text-5xl`, `md:text-6xl` → `md:text-7xl`
- [x] 6.2 Actualizar `HeroBanner.test.ts`: aserciones `text-4xl`/`md:text-6xl` → `text-5xl`/`md:text-7xl` (rojo)
- [x] 6.3 Ejecutar `vitest` (solo HeroBanner) y confirmar que falla la aserción de tamaño (rojo)
- [x] 6.4 Editar `HeroBanner.astro`: `<h1 class="text-4xl md:text-6xl ...">` → `text-5xl md:text-7xl` (verde)
- [x] 6.5 Ejecutar `vitest` (solo HeroBanner) y confirmar que pasa (verde)
- [x] 6.6 Regenerar snapshot `HeroBanner.test.ts` (`vitest -u`)

## 7. Tweak: PanelHome overlap reducido a ~25% (post-apply)

- [x] 7.1 Crear `panel-home/spec.md` (MODIFIED): overlap ~25% con `-mt-4 md:-mt-6 lg:-mt-8`
- [x] 7.2 Actualizar `PanelHome.test.ts`: asertar `-mt-4 md:-mt-6 lg:-mt-8` (rojo)
- [x] 7.3 Ejecutar `vitest` (solo PanelHome) y confirmar que falla la aserción de margen (rojo)
- [x] 7.4 Editar `PanelHome.astro`: `-mt-8 md:-mt-12 lg:-mt-16` → `-mt-4 md:-mt-6 lg:-mt-8` (verde)
- [x] 7.5 Ejecutar `vitest` (solo PanelHome) y confirmar que pasa (verde)
- [x] 7.6 Regenerar snapshot `PanelHome.test.ts` (`vitest -u`)

## 8. Tweak: SearchForm inner width 760px (post-apply)

- [x] 8.1 Actualizar `search-form/spec.md`: `max-w-[800px]` → `max-w-[760px]`
- [x] 8.2 Actualizar `SearchForm.test.ts`: aserción `max-w-[800px]` → `max-w-[760px]` (rojo)
- [x] 8.3 Ejecutar `vitest` (solo SearchForm) y confirmar que falla la aserción de ancho (rojo)
- [x] 8.4 Editar `SearchForm.astro`: `max-w-[800px]` → `max-w-[760px]` (verde)
- [x] 8.5 Ejecutar `vitest` (solo SearchForm) y confirmar que pasa (verde)
- [x] 8.6 Regenerar snapshot `SearchForm.test.ts` (`vitest -u`)

## 9. Tweak: PanelHome overlap reducido a ~10% (post-apply)

- [x] 9.1 Actualizar `panel-home/spec.md`: overlap ~10% con `-mt-2 md:-mt-2 lg:-mt-3`
- [x] 9.2 Actualizar `PanelHome.test.ts`: asertar `-mt-2 md:-mt-2 lg:-mt-3` (rojo)
- [x] 9.3 Ejecutar `vitest` (solo PanelHome) y confirmar que falla la aserción de margen (rojo)
- [x] 9.4 Editar `PanelHome.astro`: `-mt-4 md:-mt-6 lg:-mt-8` → `-mt-2 md:-mt-2 lg:-mt-3` (verde)
- [x] 9.5 Ejecutar `vitest` (solo PanelHome) y confirmar que pasa (verde)
- [x] 9.6 Regenerar snapshot `PanelHome.test.ts` (`vitest -u`)

## 10. Tweak: PanelHome mínimo solapado en desktop (post-apply)

- [x] 10.1 Actualizar `panel-home/spec.md`: overlap mínimo en desktop con `-mt-2 md:-mt-2 lg:-mt-1`
- [x] 10.2 Actualizar `PanelHome.test.ts`: asertar `lg:-mt-1` (rojo)
- [x] 10.3 Ejecutar `vitest` (solo PanelHome) y confirmar que falla la aserción de margen (rojo)
- [x] 10.4 Editar `PanelHome.astro`: `lg:-mt-3` → `lg:-mt-1` (verde)
- [x] 10.5 Ejecutar `vitest` (solo PanelHome) y confirmar que pasa (verde)
- [x] 10.6 Regenerar snapshot `PanelHome.test.ts` (`vitest -u`)

## 11. Tweak: PanelHome menos padding en desktop (post-apply)

- [x] 11.1 Actualizar `panel-home/spec.md`: requisito de padding reducido `lg:p-12` (no `lg:p-16`) en left half
- [x] 11.2 Añadir test en `PanelHome.test.ts`: left half `lg:p-12` y no `lg:p-16` (rojo)
- [x] 11.3 Ejecutar `vitest` (solo PanelHome) y confirmar que falla la aserción de padding (rojo)
- [x] 11.4 Editar `PanelHome.astro`: left half `lg:p-16` → `lg:p-12` (verde)
- [x] 11.5 Ejecutar `vitest` (solo PanelHome) y confirmar que pasa (verde)
- [x] 11.6 Regenerar snapshot `PanelHome.test.ts` (`vitest -u`)

## 12. Tweak: PanelHome 24px de solapado en desktop (post-apply)

- [x] 12.1 Actualizar `panel-home/spec.md`: overlap de 24px en desktop con `lg:-mt-6`
- [x] 12.2 Actualizar `PanelHome.test.ts`: asertar `lg:-mt-6` (rojo)
- [x] 12.3 Ejecutar `vitest` (solo PanelHome) y confirmar que falla la aserción de margen (rojo)
- [x] 12.4 Editar `PanelHome.astro`: `lg:-mt-1` → `lg:-mt-6` (verde)
- [x] 12.5 Ejecutar `vitest` (solo PanelHome) y confirmar que pasa (verde)
- [x] 12.6 Regenerar snapshot `PanelHome.test.ts` (`vitest -u`)

## 13. Tweak: PanelHome 16px de solapado en desktop (post-apply)

- [x] 13.1 Actualizar `panel-home/spec.md`: overlap de 16px en desktop con `lg:-mt-4`
- [x] 13.2 Actualizar `PanelHome.test.ts`: asertar `lg:-mt-4` (rojo)
- [x] 13.3 Ejecutar `vitest` (solo PanelHome) y confirmar que falla la aserción de margen (rojo)
- [x] 13.4 Editar `PanelHome.astro`: `lg:-mt-6` → `lg:-mt-4` (verde)
- [x] 13.5 Ejecutar `vitest` (solo PanelHome) y confirmar que pasa (verde)
- [x] 13.6 Regenerar snapshot `PanelHome.test.ts` (`vitest -u`)

## 14. Tweak: PanelHome 16px DEBAJO del banner en desktop (gap, no solapa)

- [x] 14.1 Actualizar `panel-home/spec.md`: separación de 16px en desktop con `lg:mt-4` (gap, sin solapar)
- [x] 14.2 Actualizar `PanelHome.test.ts`: asertar `lg:mt-4` (rojo)
- [x] 14.3 Ejecutar `vitest` (solo PanelHome) y confirmar que falla la aserción de margen (rojo)
- [x] 14.4 Editar `PanelHome.astro`: `lg:-mt-4` → `lg:mt-4` (verde)
- [x] 14.5 Ejecutar `vitest` (solo PanelHome) y confirmar que pasa (verde)
- [x] 14.6 Regenerar snapshot `PanelHome.test.ts` (`vitest -u`)

## 15. Tweak: PanelHome gap de 8px en desktop (post-apply)

- [x] 15.1 Actualizar `panel-home/spec.md`: separación de 8px en desktop con `lg:mt-2`
- [x] 15.2 Actualizar `PanelHome.test.ts`: asertar `lg:mt-2` (rojo)
- [x] 15.3 Ejecutar `vitest` (solo PanelHome) y confirmar que falla la aserción de margen (rojo)
- [x] 15.4 Editar `PanelHome.astro`: `lg:mt-4` → `lg:mt-2` (verde)
- [x] 15.5 Ejecutar `vitest` (solo PanelHome) y confirmar que pasa (verde)
- [x] 15.6 Regenerar snapshot `PanelHome.test.ts` (`vitest -u`)

## 16. Tweak: PanelHome solapa 8px en desktop (post-apply)

- [x] 16.1 Actualizar `panel-home/spec.md`: solape de 8px en desktop con `lg:-mt-2`
- [x] 16.2 Actualizar `PanelHome.test.ts`: asertar `lg:-mt-2` (rojo)
- [x] 16.3 Ejecutar `vitest` (solo PanelHome) y confirmar que falla la aserción de margen (rojo)
- [x] 16.4 Editar `PanelHome.astro`: `lg:mt-2` → `lg:-mt-2` (verde)
- [x] 16.5 Ejecutar `vitest` (solo PanelHome) y confirmar que pasa (verde)
- [x] 16.6 Regenerar snapshot `PanelHome.test.ts` (`vitest -u`)

## 17. Tweak: PanelHome final — 8px GAP en desktop (`lg:mt-2`), cierra reversión de solapado (post-apply, manual→sync)

- [x] 17.1 Actualizar `panel-home/spec.md`: separación final 8px gap en desktop con `lg:mt-2` (sin solapar)
- [x] 17.2 Actualizar `PanelHome.test.ts`: asertar `lg:mt-2` (rojo)
- [x] 17.3 Ejecutar `vitest` (solo PanelHome) y confirmar que falla (rojo: snapshot con `lg:-mt-2`)
- [x] 17.4 El código ya tiene `lg:mt-2` (edición manual del cliente); verificar que coincide (verde)
- [x] 17.5 Ejecutar `vitest` (solo PanelHome) y confirmar que pasa (verde)
- [x] 17.6 Regenerar snapshot `PanelHome.test.ts` (`vitest -u`)

## 18. Tweak: HeroBanner contenido más abajo en desktop (`lg:pt-24`) (post-apply, manual→sync)

- [x] 18.1 Actualizar `hero-banner/spec.md`: top padding desktop `lg:pt-12` → `lg:pt-24`
- [x] 18.2 Actualizar `HeroBanner.test.ts`: asertar `lg:pt-24` (rojo)
- [x] 18.3 Ejecutar `vitest` (solo HeroBanner) y confirmar que falla (rojo)
- [x] 18.4 Editar `HeroBanner.astro`: `lg:pt-12` → `lg:pt-24` (verde, persiste edición manual del cliente)
- [x] 18.5 Ejecutar `vitest` (solo HeroBanner) y confirmar que pasa (verde)
- [x] 18.6 Regenerar snapshot `HeroBanner.test.ts` (`vitest -u`)

## 19. Cobertura de tests faltantes (panel-home S9/S10) + drift de docs (post-verify)

- [x] 19.1 Crear `HomeOrder.test.ts`: S9 (PanelHome después de HeroBanner en DOM, una sola vez) y S10 (HTML de HeroBanner idéntico solo vs dentro de `/`)
- [x] 19.2 Ejecutar `vitest` en `HomeOrder.test.ts` y confirmar que pasa (verde)
- [x] 19.3 Corregir drift: `search-form/spec.md` título de escenario `max-w-860px` → `max-w-760px`
- [x] 19.4 Corregir drift: comentario `SearchForm.astro` "860px" → "760px"

