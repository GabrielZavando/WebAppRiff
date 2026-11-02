## 1. Fase roja — tests unitarios

- [x] 1.1 Actualizar `apps/web/src/components/__tests__/Header.test.ts` para exigir `sm:h-24`, `sm:flex sm:items-center`, `max-h-full`, `lg:max-h-none` y la ausencia de `sm:max-h-none`; añadir el caso de barra compacta con la variante `[@media(max-height:400px)]:h-12` bien formada.
- [x] 1.2 Actualizar `apps/web/src/components/__tests__/SearchForm.test.ts` para exigir `sm:w-64` y `sm:shrink-0` en el contenedor del select, `sm:flex-1` + `min-w-0` en el input y la distribución de ancho a 640px.
- [x] 1.3 Actualizar `apps/web/src/components/__tests__/HeroBanner.test.ts` para exigir en el CTA secundario `bg-white`, `text-secondary`, `border-2 border-white`, `hover:bg-secondary` y `hover:text-white`; añadir la assertion de `sm:pr-24` y `sm:pb-32` en el wrapper.
- [x] 1.4 Actualizar `apps/web/src/components/__tests__/PanelHome.test.ts` al nuevo esquema `border border-primary divide-y` + filas `grid-cols-2 divide-x`, retirando la assertion de `grid-cols-2 grid-rows-2 gap-px`; añadir `data-stats-row` a las filas.
- [x] 1.5 Actualizar `apps/web/src/components/__tests__/ServicesSection.test.ts` para exigir `sm:grid-cols-2` y eliminar la assertion que prohíbe esa clase.
- [x] 1.6 Actualizar `apps/web/src/components/__tests__/NosotrosTeamSection.test.ts` para exigir `grid-cols-1 sm:grid-cols-3` y la ausencia de `md:grid-cols-2` como primer breakpoint multiculumna.
- [x] 1.7 Verificar que los tests nuevos fallan antes de tocar los componentes (`npm run test --workspace apps/web` o el script equivalente del workspace).

## 2. Fase roja — tests e2e

- [x] 2.1 Añadir/ajustar `apps/web/e2e/site-header.spec.ts` con un caso a `640×800` que mida el logo (ancho > 160px, ≥ 8px de aire arriba y abajo) y el header sin desborde.
- [x] 2.2 Añadir/ajustar `apps/web/e2e/search-form.spec.ts` con un caso a `640×800` que mida el select (≥ 256px) y verifique que "Todas las categorías" no se trunca y el input ocupa el resto.
- [x] 2.3 Añadir a `apps/web/e2e/hero-banner.spec.ts` un caso a `640×800` para el CTA secundario (fondo blanco, texto navy, borde 2px, contraste AA) y otro que verifique que `h1`, subtítulo, descripción y CTAs no quedan debajo de `.whatsapp-fab` / `.phone-fab` en `640×800` y `640×360`.
- [x] 2.4 Actualizar `apps/web/e2e/panel-home.spec.ts` para localizar las filas con `[data-stats-row]`, verificar tres trazos de 1px (marco + divisores) y que no haya bordes duplicados de 2px a `640×800`.
- [x] 2.5 Actualizar `apps/web/e2e/services-section.spec.ts`: 2 columnas desde `640×800` y 1 columna por debajo de 640px.
- [x] 2.6 Añadir cobertura a `apps/web/e2e/solution-section.spec.ts` y al e2e de destacados para confirmar 2 columnas exactas a `640×800` (sin cambio de clases).
- [x] 2.7 Añadir a `apps/web/e2e/responsive-layout.spec.ts` los viewports `640×360` y `640×800` y verificar ausencia de scroll horizontal en `/` y en las grillas de productos, servicios y equipo.
- [x] 2.8 Verificar que los e2e nuevos fallan antes de implementar (o documentar el fallo esperado si el e2e requiere el build de producción).

## 3. Header

- [x] 3.1 En `Header.astro`, cambiar la barra interna a `h-16 sm:h-24 lg:h-20` y el enlace del logo a `h-16 sm:h-24 lg:h-20` con `sm:flex sm:items-center lg:block`.
- [x] 3.2 Ajustar la imagen del logo a `max-w-[160px] max-h-full sm:max-w-[240px] sm:w-auto lg:max-h-none` (retirar `sm:max-h-none`; `sm:w-auto` preserva la proporción al recortar la altura).
- [x] 3.3 Corregir las variantes mal formadas `[@media(max-height:400px):h-12]` a `[@media(max-height:400px)]:h-12` en la barra interna y en el enlace del logo.
- [x] 3.4 Recentrar la hamburguesa con `sm:top-9 lg:top-6` y `[@media(max-height:400px)]:top-1`.
- [x] 3.5 Verificar en `Header.test.ts` que el logo queda contenido y centrado y que ningún test de escritorio cambia de comportamiento.

## 4. Buscador

- [x] 4.1 En `SearchForm.astro`, cambiar el contenedor del select a `col-span-2 w-full sm:w-64 sm:shrink-0 min-w-0` manteniendo el ancho compacto de altura corta.
- [x] 4.2 Confirmar que el contenedor del input conserva `w-full sm:flex-1 min-w-0` y que el botón sigue `shrink-0`.
- [x] 4.3 Verificar a 640px que el select no se comprime y que el input ocupa el espacio restante.

## 5. Hero

- [x] 5.1 En `HeroBanner.astro`, cambiar el CTA de variante secundaria a `border-2 border-white bg-white text-secondary hover:bg-secondary hover:text-white`.
- [x] 5.2 Añadir `sm:pr-24` y `sm:pb-32` al wrapper de contenido, manteniendo `pt-4 pb-16 md:pt-8 md:pb-24 lg:pt-24 lg:pb-32`.
- [x] 5.3 Validar que los CTAs siguen dentro del contenedor y no generan scroll horizontal a 640px.

## 6. Grillas de productos y equipo

- [x] 6.1 En `ServicesSection.astro`, cambiar la grilla a `grid grid-cols-1 sm:grid-cols-2 gap-6`.
- [x] 6.2 En `NosotrosTeamSection.astro`, cambiar la grilla a `grid grid-cols-1 gap-6 sm:grid-cols-3`.
- [x] 6.3 Confirmar que `SolutionSection.astro` y `DestacadosSection.astro` mantienen `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` sin cambios.
- [x] 6.4 Validar a 640px que las tres grillas muestran 2/2/3 columnas y que ningún texto desborda su tarjeta.

## 7. Estadísticas del panel

- [x] 7.1 Reestructurar la mitad derecha de `PanelHome.astro` en el wrapper `stats-grid-wrap flex-1` con el contenedor `grid grid-rows-2 h-full w-full border border-primary divide-y divide-primary` y dos filas `grid grid-cols-2 divide-x divide-primary` con `data-stats-row`.
- [x] 7.2 Mantener las celdas `bg-white p-4 md:p-8 lg:p-12 flex flex-col justify-center min-w-0` y retirar el `background-color` primario de `.stats-grid-wrap`.
- [x] 7.3 Ajustar los locators/e2e que dependían de `div.grid-cols-2` único y verificar los tres trazos de 1px.

## 8. Snapshots y verificación

- [x] 8.1 Regenerar los snapshots de `Header`, `SearchForm`, `HeroBanner`, `PanelHome`, `ServicesSection` y `NosotrosTeamSection`.
- [x] 8.2 Ejecutar `make lint`, `make typecheck` y `make test` sin errores.
- [x] 8.3 Ejecutar los e2e de `site-header`, `search-form`, `hero-banner`, `panel-home`, `services-section`, `solution-section` y `responsive-layout`.
- [x] 8.4 Ejecutar `npx openspec validate --all --strict` y corregir cualquier desviación.
- [x] 8.5 Revisar visualmente a `640×800` y `640×360`; si equipo o servicios quedan ilegibles, aplicar el fallback documentado y actualizar los artefactos antes de continuar.

## 9. Cierre

- [x] 9.1 Revisar con el cliente el reporte y las Open Questions del `design.md` antes de `/opsx-apply` (confirmado: header 112px, servicios 2 columnas, equipo 3 columnas, drift de Soluciones diferido).
- [ ] 9.2 Archivar el change con `/opsx-archive` una vez implementado y verificado.

## 10. Revisión post-apply — landscape de teléfono grande (640×375)

- [x] 10.1 Actualizar `specs/site-header`, `specs/search-form` y `design.md` para acotar el modo compacto de altura a anchos `< 640px` y documentar el caso 640×375.
- [x] 10.2 Ajustar en fase roja `Header.test.ts` y `SearchForm.test.ts` para exigir las variantes `max-sm:[@media(max-height:400px)]` y el `sm:w-64` aun en altura corta.
- [x] 10.3 Ajustar los e2e de `site-header`, `search-form` y `responsive-layout` para 640×375 (header 112px, logo >160px, select ≥256px, sticky ≤50%) y 568×320 (compacto).
- [x] 10.4 Acotar las variantes compactas del header (`py-0`, `h-12`, cap de logo 100px, `top-1`) y el `w-44` del select con `max-sm:`.
- [x] 10.5 Regenerar snapshots de `Header` y `SearchForm` y ejecutar los unit tests del workspace web.
- [x] 10.6 Rebuild de producción, e2e targeted y `make ci` completos.
- [x] 10.7 Revisar visualmente 640×375, 640×800 y 568×320; reportar antes de archivar.

## 11. Breakpoints en px (root font-size independiente)

- [x] 11.1 Añadir `--breakpoint-*` en px al `@theme` de `apps/web/src/styles/globals.css` y `apps/admin/src/styles/globals.css`.
- [x] 11.2 Verificar que el CSS generado emita `@media (width >= 640px)` para `sm` (no `40rem`).
- [x] 11.3 Verificar con Playwright a `html { font-size: 18px }` y ancho 640px que las grillas den 2/2/2/3.
- [x] 11.4 Rebuild de producción + `make ci` completo.
- [ ] 11.5 Revisar visualmente con el cliente a 640px y archivar (`/opsx-archive`, tarea 9.2 pendiente).
