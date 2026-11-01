## 1. Header — tests primero

- [x] 1.1 Actualizar `apps/web/src/components/__tests__/Header.test.ts` para exigir: ausencia de `pb-4`, presencia de `py-2` y `lg:pt-0 lg:pb-2`, barra interna `h-16 lg:h-20`, logo alineado a la izquierda/centrado verticalmente, y hamburguesa con `top-5 lg:top-6`. Verificar que los tests fallan.
- [x] 1.2 Añadir/ajustar un test que lea `apps/web/src/styles/header-scroll.css` y verifique que no existen reglas de shrink del logo (`max-width: 150px`, `height: 100px` en scroll) ni transición de `.site-logo`. Verificar que falla.
- [x] 1.3 Actualizar `apps/web/e2e/site-header-scroll.spec.ts` para afirmar que el logo mantiene 160px (móvil) y 240px (desktop) tras el scroll, en lugar de encogerse. Verificar que falla.

## 2. Header — implementación

- [x] 2.1 Ajustar `apps/web/src/components/Header.astro`: reemplazar `pb-4` por `py-2 lg:pt-0 lg:pb-2`, conservar `h-16 lg:h-20` en la barra interna y `overflow-visible` en el enlace del logo, y cambiar la hamburguesa a `top-5 lg:top-6`.
- [x] 2.2 Editar `apps/web/src/styles/header-scroll.css`: eliminar el shrink móvil y desktop de `.site-logo`, su transición y su entrada en `prefers-reduced-motion`, manteniendo intactos `.site-header::after`, `.site-search` y `.header-scroll-shell`.
- [x] 2.3 Ejecutar `npm run test --workspace apps/web` (o el runner de `apps/web`) y confirmar que los tests de Header y scroll pasan.

## 3. Buscador — tests primero

- [x] 3.1 Actualizar `apps/web/src/components/__tests__/SearchForm.test.ts` para exigir: grilla móvil `grid-cols-[minmax(0,1fr)_auto]`, `col-span-2` en el select, `min-w-0` en el input, `shrink-0` en el botón, `gap-y-3` sin gap horizontal input-botón, y restauración `sm:flex-row`/`sm:gap-px`.
- [x] 3.2 Añadir a `SearchForm.test.ts` las aserciones del botón móvil: solo ícono, texto oculto, `aria-label="BUSCAR"`, ícono `aria-hidden="true"`, y texto visible/`gap-2`/`px-8` desde `sm`. Verificar que los tests fallan.
- [x] 3.3 Actualizar `apps/web/e2e/search-form.spec.ts`: en 375×667 validar select en su fila y input + botón en la misma fila pegados; actualizar las aserciones de ancho completo y de nombre accesible del botón. Verificar que falla.

## 4. Buscador — implementación

- [x] 4.1 Modificar `apps/web/src/components/SearchForm.astro`: cambiar el layout móvil a la grilla de dos columnas, mover las variantes `md:` de layout a `sm:`, y ajustar el botón (solo ícono en móvil, `aria-label="BUSCAR"`, texto `hidden sm:inline`, `px-4 sm:px-8`).
- [x] 4.2 Verificar que el override de viewports cortos (`[@media(max-height:400px)]`) sigue dejando los tres controles en una fila y que el submit canónico no cambia.
- [x] 4.3 Ejecutar los tests de `SearchForm` y el e2e de buscador; confirmar que pasan.

## 5. Hero — tests primero

- [x] 5.1 Actualizar `apps/web/src/components/__tests__/HeroBanner.test.ts` para exigir `items-start`, `w-1/2` y `sm:w-auto` en los CTAs, además de la restauración `sm:flex-row`. Verificar que falla.
- [x] 5.2 Actualizar `apps/web/e2e/hero-banner.spec.ts` (5.7) para validar que cada CTA mide 50% del contenedor, comparte el borde izquierdo y queda apilado en 375×667. Verificar que falla.

## 6. Hero — implementación

- [x] 6.1 Modificar `apps/web/src/components/HeroBanner.astro`: contenedor `flex flex-col items-start gap-3 sm:flex-row`, CTAs `w-1/2 sm:w-auto` y padding móvil `px-4 sm:px-8` para evitar desborde a 320px.
- [x] 6.2 Ejecutar los tests de `HeroBanner` y el e2e de hero; confirmar que pasan.

## 7. Responsive-layout y presupuesto de altura

- [x] 7.1 Actualizar/verificar `apps/web/e2e/responsive-layout.spec.ts`: sin scroll horizontal en 320×568, 375×667 y 568×320; wrapper sticky ≤ 50% de altura en 568×320; header y buscador con el nuevo layout.
- [x] 7.2 Ejecutar el e2e de responsive-layout y corregir cualquier regresión de containment.

## 8. Snapshots y suite unitaria

- [x] 8.1 Revisar y actualizar los snapshots de `Header.test.ts.snap`, `SearchForm.test.ts.snap` y `HeroBanner.test.ts.snap` (`npm run test --workspace apps/web -- -u`), verificando que los diffs correspondan solo a los cambios aprobados.
- [x] 8.2 Ejecutar la suite unitaria completa de `apps/web` y confirmar que no quedan fallos.

## 9. Gates de calidad

- [x] 9.1 Ejecutar `make lint` y `make typecheck` (o los scripts equivalentes del workspace) y corregir hallazgos.
- [x] 9.2 Ejecutar `make test` y el e2e de los specs afectados (`site-header-scroll`, `search-form`, `hero-banner`, `responsive-layout`).
- [x] 9.3 Ejecutar `npx openspec validate --all --strict` y confirmar que el change y las specs son válidos.

## 10. Fix post-apply — sticky header + buscador

- [x] 10.1 Actualizar `apps/web/src/layouts/__tests__/Layout.test.ts` para exigir `overflow-x-clip` en `<html>`/`<body>` y prohibir `overflow-x-hidden`; verificar que falla.
- [x] 10.2 Actualizar `apps/web/e2e/site-header-scroll.spec.ts` para validar que el wrapper sticky sigue en `top: 0` tras el scroll y que `<html>`/`<body>` computan `overflow-x: clip`; verificar que falla.
- [x] 10.3 Modificar `apps/web/src/layouts/Layout.astro`: cambiar `overflow-x:hidden` del `<html>` y `overflow-x-hidden` del `<body>` por `overflow-x:clip` / `overflow-x-clip`, conservando el recorte horizontal y el scroll vertical.
- [x] 10.4 Actualizar el comentario de `apps/web/e2e/responsive-layout.spec.ts` para reflejar el nuevo recorte `clip` y ejecutar responsive-layout sin overflow horizontal.
- [x] 10.5 Ejecutar unit tests, e2e afectados, lint, typecheck y `npx openspec validate --all --strict`.

## 11. Fix post-apply — menú hamburguesa tras View Transitions

- [x] 11.1 Añadir un e2e en `apps/web/e2e/site-header.spec.ts` que navegue de `/` a `/servicios` con un enlace interno, espere `astro:page-load` y verifique que el botón hamburguesa abre el menú; verificar que falla.
- [x] 11.2 Extraer un initializer idempotente en el script de `apps/web/src/components/Header.astro`, ejecutarlo al cargar y registrarlo en `astro:page-load` una sola vez.
- [x] 11.3 Rebuild de `apps/web`, ejecutar el e2e nuevo y el spec completo de site-header; confirmar que pasan.
- [x] 11.4 Ejecutar `make ci` y confirmar lint, typecheck, tests, audit y OpenSpec en verde (o reportar fallos preexistentes ajenos).
