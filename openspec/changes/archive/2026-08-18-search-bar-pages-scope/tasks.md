## 1. Types & Component contract (TDD RED)

- [x] 1.1 Escribir tests unitarios en `apps/web/src/components/__tests__/SearchForm.test.ts` (AstroContainer) para `secondaryBg: true`: el wrapper `role="search"` lleva `bg-secondary`, NO lleva `bg-white`/`border-b`/`border-border`, y NO contiene hex literal `#1F2D40`; los controles `<select>`/`<input>` llevan `bg-white` y el botón `bg-primary`.
- [x] 1.2 Escribir tests para `showCategorySelect: false`: NO se renderiza `<select name="categoriaId">`, SÍ se renderizan `<input type="search">` y `<button type="submit">`, y el `<input>` lleva `md:flex-1`.
- [x] 1.3 Escribir test que confirme que el render por defecto (sin nuevos props) sigue idéntico al snapshot existente (regresión: los nuevos props tienen defaults que no alteran el HTML actual).

## 2. SearchForm implementation (TDD GREEN)

- [x] 2.1 Extender `apps/web/src/lib/types/search-form.ts`: `SearchFormProps` += `readonly secondaryBg?: boolean` y `readonly showCategorySelect?: boolean`.
- [x] 2.2 En `apps/web/src/components/SearchForm.astro`: añadir props `secondaryBg = false` y `showCategorySelect = true`; actualizar `class:list` del wrapper a `transparent ? 'bg-transparent' : secondaryBg ? 'bg-secondary' : 'bg-white border-b border-border'`.
- [x] 2.3 En `SearchForm.astro`: renderizar el bloque `<div class="w-full md:w-56">…<select name="categoriaId">…</select></div>` solo si `showCategorySelect` es `true` (el `<input>` ya usa `md:flex-1` y se expande solo).
- [x] 2.4 Ejecutar `npm run test --workspace=apps/web` y confirmar que los tests del paso 1 pasan (GREEN).

## 3. Layout prop propagation (TDD RED → GREEN)

- [x] 3.1 Escribir test unitario en `apps/web/src/layouts/__tests__/Layout.test.ts`: con `showSearch={false}` el HTML NO contiene `role="search"`; con `searchSecondary={true}` y `showSearch` habilitado el wrapper lleva `bg-secondary`.
- [x] 3.2 En `apps/web/src/layouts/Layout.astro`: añadir props `searchSecondary?: boolean = false` y `searchShowCategorySelect?: boolean = true`; incluirlas en `searchFormProps` (`secondaryBg: searchSecondary`, `showCategorySelect: searchShowCategorySelect`) y pasarlas a `<SearchForm>`.
- [x] 3.3 Ejecutar los tests de Layout y confirmar GREEN.

## 4. Páginas existentes

- [x] 4.1 `apps/web/src/pages/productos/index.astro`: `<Layout … searchSecondary={true} searchShowCategorySelect={false} />` (navy + sin select).
- [x] 4.2 `apps/web/src/pages/cotizacion.astro`: `<Layout … searchSecondary={true} />` (navy, select visible).
- [x] 4.3 `apps/web/src/pages/productos/[slug].astro`: añadir `searchSecondary={true}` a AMBAS ramas `<Layout>` (encontrado / no encontrado); el select queda visible por defecto.

## 5. Nuevas páginas Servicios y Marcas

- [x] 5.1 Crear `apps/web/src/pages/servicios.astro`: `<Layout title="Servicios — Riff" description="…" showSearch searchSecondary>` + `<main class="container py-16"><h1 class="text-3xl font-heading font-bold text-secondary">Servicios</h1></main>` (placeholder para contenido futuro; Header/Footer/SiteCredits los aporta Layout).
- [x] 5.2 Crear `apps/web/src/pages/marcas.astro`: `<Layout title="Marcas — Riff" description="…" showSearch={false}>` + `<main class="container py-16"><h1 class="text-3xl font-heading font-bold text-secondary">Marcas</h1></main>` (placeholder; sin buscador).

## 6. Doc menor

- [x] 6.1 Actualizar el comentario obsoleto en `apps/web/src/components/__tests__/ServicesSection.test.ts` (y/o `lib/config/services-section.ts`) que describe `/servicios` como "a 404 page today … the route will exist in the future servicios-page change", indicando que la ruta ahora existe.

## 7. Tests E2E (Playwright)

- [x] 7.1 En `apps/web/e2e/search-form.spec.ts` (o spec nueva): en `/productos` el `role="search"` es visible, su wrapper tiene `background-color: rgb(31, 45, 64)` en reposo, y NO existe `combobox`/`<select name="categoriaId">`; el `searchbox` y el botón `BUSCAR` sí existen.
- [x] 7.2 E2E: en `/servicios` el `role="search"` es visible y el wrapper tiene `background-color: rgb(31, 45, 64)`; en `/cotizacion` y `/productos/{slug}` el `role="search"` es visible (navy) y el `<select name="categoriaId">` SÍ está presente.
- [x] 7.3 E2E: `page.goto('/servicios')` y `page.goto('/marcas')` retornan status 200; `/marcas` NO contiene `role="search"`.

## 8. Verificación & Cleanup

- [x] 8.1 `npm run build --workspace=apps/web` → success
- [x] 8.2 `npm run typecheck --workspace=apps/web` → success
- [x] 8.3 `npm run lint --workspace=apps/web` → success
- [x] 8.4 `npm run test --workspace=apps/web` → all pass (unit + AstroContainer + snapshot)
- [x] 8.5 `npm run test:smoke --workspace=apps/web` (o equivalente E2E) → pass
- [x] 8.6 `npx openspec validate search-bar-pages-scope` → valid
- [x] 8.7 `npx openspec status --change search-bar-pages-scope` → todos los artefactos completos
- [x] 8.8 Ejecutar `npm run test --workspace=apps/admin` (o al menos `apps/admin/src/styles/__tests__/sync.test.ts`) para confirmar que la paridad de tokens no se rompió (no se añadieron tokens).

## 9. Navy variant usa el gradiente del header (fix post-apply)

El header (y TopHeader) usan `bg-linear-to-r from-secondary to-secondary-light`; el buscador navy plano (`bg-secondary`) quedaba pegado y se veía mal. Se cambia la variante navy del buscador para reusar el mismo gradiente que el header, de modo que ambas superficies adyacentes se fundan.

- [x] 9.1 Actualizar `apps/web/src/components/__tests__/SearchForm.test.ts`: el caso `secondaryBg: true` (y el test "keeps white controls") DEBEN esperar `bg-linear-to-r from-secondary to-secondary-light` en el wrapper y NO `bg-secondary` plano ni `bg-white` (RED).
- [x] 9.2 Actualizar `apps/web/src/layouts/__tests__/Layout.test.ts`: el test navy DEBE esperar `bg-linear-to-r from-secondary to-secondary-light` y NO `bg-secondary` (RED).
- [x] 9.3 En `apps/web/src/components/SearchForm.astro`: cambiar la rama `secondaryBg` del `class:list` del wrapper a `'bg-linear-to-r from-secondary to-secondary-light'` (GREEN).
- [x] 9.4 Actualizar `apps/web/e2e/search-form.spec.ts`: los asserts `toContain('bg-secondary')` de las páginas navy (`/productos`, `/servicios`, `/cotizacion`, `/productos/{slug}`) DEBEN esperar `bg-linear-to-r` y `from-secondary` (o `to-secondary-light`) en su lugar (GREEN).
- [x] 9.5 Re-ejecutar unit + E2E y `npm run build` para confirmar GREEN y sin regresiones.
- [x] 9.6 Re-ejecutar `npx openspec validate search-bar-pages-scope`.
