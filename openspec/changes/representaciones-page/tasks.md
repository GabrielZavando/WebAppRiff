## 1. Preparación de contenido tipado (TDD)

- [x] 1.1 Escribir el test fallido de `lib/config/__tests__/representaciones-page.test.ts` que valide la forma del contenido (hero con eyebrow/headline/highlight/párrafo/3 métricas; 5 marcas con chip/categoría/descripción; 2 distribuidores con badges/bullets/garantías; 4 pillars con índice/título/descripción).
- [x] 1.2 Crear `apps/web/src/lib/types/representaciones-page.ts` con los contratos tipados (`RepresentacionesHeroContent`, `RepresentacionBrand`, `Distribuidor`, `ValueProp`, `RepresentacionesPageContent`), sin `any`.
- [x] 1.3 Crear `apps/web/src/lib/config/representaciones-page.ts` con el contenido extraído de `docs/design/components/representaciones/reference.html` (hero, 5 marcas, 2 distribuidores, 4 pillars).
- [x] 1.4 Verificar que el test de 1.1 pase (`npm test` en `apps/web`).

## 2. Componentes presentacionales (TDD)

- [x] 2.1 Test de `RepresentacionesHero.astro`: fondo `bg-secondary`, eyebrow, `<h1>` con subfrase "Representación Exclusiva" en `<span class="text-primary">`, párrafo y exactamente 3 métricas (`05`, `02`, `100%`).
- [x] 2.2 Implementar `apps/web/src/components/RepresentacionesHero.astro` (patrón de grilla decorativo con tokens o fallback plano; `aria-hidden`).
- [x] 2.3 Test de `RepresentacionBrandCard.astro`: wordmark en contenedor `data-brand-logo`, chip de origen, `<h3>`, categoría en `text-primary`, párrafo; layout `flex-col md:flex-row` con panel `md:w-64`.
- [x] 2.4 Implementar `apps/web/src/components/RepresentacionBrandCard.astro`.
- [x] 2.5 Test de `DistribuidorCard.astro`: wordmark, badge, ícono Lucide, `<h3>`, párrafo, exactamente 3 bullets con `lucide:check`, leyenda de garantía.
- [x] 2.6 Implementar `apps/web/src/components/DistribuidorCard.astro`.
- [x] 2.7 Test de `ValuePropCard.astro`: ícono Lucide, etiqueta indexada, `<h4>`, párrafo.
- [x] 2.8 Implementar `apps/web/src/components/ValuePropCard.astro`.

## 3. Página `/representaciones`

- [x] 3.1 Escribir el test fallido `apps/web/src/pages/__tests__/representaciones.test.ts` (chrome presente, sin `role="search"`, sin `banner_home`/`tratamiento-agua`, 5 marcas, 2 distribuidores, 4 pillars, íconos `lucide:*`, sin hex/`brand-*`/`rounded`/`shadow`).
- [x] 3.2 Crear `apps/web/src/pages/representaciones.astro` componiendo las 4 secciones dentro de `<Layout title="Representaciones — Riff" description="…" showSearch={false}>`.
- [x] 3.3 Eliminar `apps/web/src/pages/marcas.astro`.
- [x] 3.4 Verificar que el test de 3.1 pase.

## 4. Renombre del menú de navegación

- [x] 4.1 Escribir/actualizar el test fallido en `lib/config/__tests__/navigation.test.ts` para `{ label: 'Representaciones', href: '/representaciones' }` y ausencia de `Marcas`/`/marcas`.
- [x] 4.2 Actualizar `apps/web/src/lib/config/navigation.ts` (`NAVIGATION_ITEMS`).
- [x] 4.3 Actualizar `apps/web/src/components/__tests__/Header.test.ts` (labels, hrefs, conteos) y regenerar el snapshot `Header.test.ts.snap`; revisar el diff.

## 5. Tests e2e y validación integral

- [x] 5.1 Actualizar `apps/web/e2e/site-header.spec.ts` (`NAV_ITEMS` → incluir "Representaciones" y quitar "Marcas").
- [x] 5.2 Actualizar `apps/web/e2e/search-form.spec.ts` reemplazando el caso `/marcas` por `/representaciones` (página sin barra de búsqueda).
- [x] 5.3 Ejecutar `make lint` y `make typecheck` y corregir hallazgos.
- [x] 5.4 Ejecutar `make test` (unit + smoke/e2e aplicable).
- [x] 5.5 Ejecutar `npx openspec validate representaciones-page --strict` y corregir.
- [x] 5.6 Ejecutar `make ci` (gate completo) y el build de verificación (`npm run build` en `apps/web`).
- [x] 5.7 Revisión visual contra `docs/design/components/representaciones/reference.png` (desktop y mobile) y ajuste de espaciados/tipografía.
