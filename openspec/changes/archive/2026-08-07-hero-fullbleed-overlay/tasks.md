# Tasks — hero-fullbleed-overlay (revisado por feedback del cliente)

> **Objetivo**: imagen de fondo + capa azul 0.8 cubriendo todo el viewport de la home; TopHeader/Header/SearchForm transparentes sobre la imagen; HeroBanner queda solo contenido. Páginas sin home conservan el layout sólido actual.

## 1. Shell hero en Layout

- [x] 1.1 Test (RED): escribir `apps/web/src/layouts/__tests__/Layout.test.ts` que renderice el Layout en modo `hero` y afirme que: (a) el documento contiene un wrapper `min-h-screen` → `overflow-hidden`, (b) el HTML contiene `<picture>` con fuente `.avif`/`.webp` de `banner_home`, (c) contiene `class="absolute inset-0 bg-secondary/80"` con `aria-hidden="true"`, y (d) un wrapper `relative z-10` precede a los componentes. El test debe fallar antes de la implementación.
- [x] 1.2 Implementar (GREEN): en `apps/web/src/layouts/Layout.astro`, añadir prop `hero?: boolean` (default `false`). En modo `hero`, renderizar el shell:
  - wrapper `<div class="relative min-h-screen overflow-hidden">`
  - `<Picture src={heroImage} ... class="absolute inset-0 h-full w-full object-cover">` (importar `@/assets/img/banner_home.webp`)
  - `<div class="absolute inset-0 bg-secondary/80" aria-hidden="true"></div>`
  - `<div class="relative z-10 flex flex-col">` con `TopHeader`/`Header`/`SearchForm`/slot.
  En modo default (`hero=false`), comportamiento actual sin shell.
  Ejecutar el test.

## 2. Modo transparente en los tres headers

- [x] 2.1 Test (RED): en `apps/web/src/components/__tests__/TopHeader.test.ts`, añadir test de `transparent=true` → `bg-transparent` presente y `from-secondary to-secondary-light` ausente; y test de default → gradiente presente.
- [x] 2.2 Implementar (GREEN): añadir `transparent?: boolean` en `TopHeader.astro` y condicionar la clase.
- [x] 2.3 Test (RED): en `Header.test.ts`, test de `transparent=true` → `<header>` con `bg-transparent` y sin `from-secondary to-secondary-light`; y default con gradiente.
- [x] 2.4 Implementar (GREEN): añadir `transparent?: boolean` en `Header.astro` y condicionar la clase (incluido el panel móvil).
- [x] 2.5 Test (RED): en `SearchForm.test.ts`, test de `transparent=true` → wrapper `role="search"` con `bg-transparent` (sin `bg-white`) manteniendo `input bg-white`; default con `bg-white`.
- [x] 2.6 Implementar (GREEN): añadir `transparent?: boolean` en `SearchForm.astro` y condicionar la clase del wrapper.

## 3. HeroBanner sin imagen (solo contenido)

- [x] 3.1 Test (RED): en `HeroBanner.test.ts`, eliminar/neutralizar los tests de background (`picture`, overlay, `bg-secondary/80`, `min-h-screen`) y añadir asserts que el HTML del HeroBanner NO contiene `<picture>` ni `bg-secondary/80`/`bg-secondary/60`. El test debe fallar mientras el componente siga con la imagen.
- [x] 3.2 Implementar (GREEN): quitar de `HeroBanner.astro`: el `import` del `Picture`/imagen, el `<Picture>`, el overlay `bg-secondary/80`, y las clases `md:min-h-screen md:flex md:flex-col md:justify-center` del `<section>`. El componente queda renderizando headline/sub/descripcion/CTAs. Ajustar el `<section>` para que no lleve background propio (e.g. `relative bg-transparent override`).

## 4. Integración de la home

- [x] 4.1 Test (RED→GREEN): la integración home se cubre con el test del `Layout` en modo `hero` (`Layout.test.ts`) — shell fullbleed `bg-secondary/80`, un único header, wrappers de TopHeader/Header/SearchForm con `bg-transparent`, HeroBanner sin `<picture>`, y `PanelHome` junto al slot. El HTML generado por `npm run build` confirma los mismos asserts sobre la home real (`dist/index.html`).
- [x] 4.2 Implementar (GREEN): actualizar `apps/web/src/pages/index.astro` para renderizar el Layout con `hero` (las props `transparent` las inyecta el propio Layout en modo `hero`).
- [x] 4.3 Regenerar snapshots afectados (`npx vitest run HeroBanner -u`, etc.) y revisar el diff manualmente.
- [x] 4.4 (Verificación `/verify`) Cerrar los asserts de escenario faltantes como tests TDD: `Layout.test.ts` afirma exactamente un `<header>` en el documento (home-hero-shell R1-S2); `SearchForm.test.ts` afirma que select/input mantienen `bg-white` y el botón `bg-accent` en transparent (search-form R2-S2); `TopHeader.test.ts` afirma que phone y social links siguen renderizados en transparent (top-header R1-S1). Suite: 211 tests verdes.

## 5. Verificación visual cross-viewport

- [ ] 5.1 Levantar `cd apps/web && npm run dev`, abrir `/` en 4 viewports (375×667, 768×1024, 1280×720, 1920×1080). Confirmar: imagen ocupa todo el viewport, capa azul 0.8 visible, TopHeader/Header/Search transparentes mostrando la imagen detrás, busqueda y contenedores legibles. Adjuntar 4 capturas en `docs/design/components/_verification/hero-fullbleed-overlay/` o referenciarlas en el PR. (El agente build valida vía HTTP + clases; la captura la hace el humano.) — **Pendiente humana confirmada por el cliente; las capturas se adjuntarán como follow-up del PR tras el archive.**

## 6. Limpieza y verificación final

- [x] 6.1 `cd apps/web && npm run build` (SSG) — sin warnings nuevos, variantes `.avif`/`.webp` emitidas en el shell.
- [x] 6.2 `git diff --stat` — confirmar que los únicos archivos cambiados son: `apps/web/src/layouts/Layout.astro`, `apps/web/src/pages/index.astro`, `apps/web/src/components/{HeroBanner,TopHeader,Header,SearchForm}.astro` y sus tests/snapshots. Confirmar que `PanelHome.astro`, `lib/config/*`, `lib/types/*` no aparecen.
- [x] 6.3 `cd apps/web && npm test` — suite completa verde (todos los archivos).
- [x] 6.4 (Fix post-apply, previo al archive) **Bug de scroll vertical bloqueado**: el `<body>` del modo hero usaba `overflow-hidden` (ambos ejes), que desactiva el scrolling del documento y recorta el contenido bajo el viewport (PanelHome). Fix TDD: `Layout.test.ts` exige `overflow-x-hidden` y prohíbe `overflow-hidden`; `Layout.astro` cambió a `overflow-x-hidden`. Spec `home-hero-shell` actualizado (requisito + escenario "keeps vertical scroll enabled"). Verificado: suite 211 tests verdes, build, dev server y `dist/index.html`.
- [x] 6.5 (Sync de specs previo al archive) Aplicados los deltas del cambio a las main specs en `openspec/specs/`: creada `home-hero-shell/spec.md` (2 requisitos + escenarios); `hero-banner` (MODIFIED headline/subtitle/CTAs, ADDED "no built-in background", integración con hero shell, accesibilidad sin imagen, REMOVED imagen real + full-viewport) y añadido `transparent` en `top-header`, `site-header`, `search-form`. `npx openspec validate --specs` → 9 capabilities OK.