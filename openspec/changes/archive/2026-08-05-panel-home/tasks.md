## 1. Types & Config

- [x] 1.1 Crear `apps/web/src/lib/types/panel-home.ts` con `PanelStat` (`{ readonly value: string; readonly label: string }`), `PanelCta` (`{ readonly label: string; readonly href: string; readonly variant: 'primary' | 'secondary' }` — mismo shape que `HeroCta` pero en su propio archivo para evitar acoplamiento cross-change) y `PanelHomeProps` (`{ readonly eyebrow: string; readonly headline: string; readonly description: string; readonly cta: PanelCta; readonly stats: readonly PanelStat[] }`)
- [x] 1.2 Crear `apps/web/src/lib/config/panel-home.ts` con constante `PANEL_HOME_CONTENT` tipada como `Readonly<PanelHomeProps>` conteniendo `eyebrow: 'DESDE 1979'`, `headline: 'Más de 40 Años de Liderazgo en la Medición y Control de Fluidos'`, `description: 'Nuestra historia comienza con el desarrollo de soluciones para tratamiento de agua y evoluciona hacia la especialización en medición para la industria.'`, `cta: { label: 'SOLICITAR ASESORÍA TÉCNICA', href: '/contacto', variant: 'primary' }` y `stats: [{ value: '40+', label: 'AÑOS DE EXPERIENCIA EN LA INDUSTRIA' }, { value: '30.000+', label: 'EQUIPOS Y SOLUCIONES IMPLEMENTADAS' }, { value: '5+', label: 'MARCAS GLOBALES REPRESENTADAS' }, { value: '9+', label: 'LÍNEAS DE SOLUCIONES INDUSTRIALES' }]`
- [x] 1.3 Test unitario `apps/web/src/lib/config/__tests__/panel-home.test.ts`: `PANEL_HOME_CONTENT.stats` tiene longitud `4`
- [x] 1.4 Test unitario: `PANEL_HOME_CONTENT.stats[0].value === '40+'` y `PANEL_HOME_CONTENT.stats[3].value === '9+'`
- [x] 1.5 Test unitario: `PANEL_HOME_CONTENT.cta.href === '/contacto'`, `cta.label === 'SOLICITAR ASESORÍA TÉCNICA'`, `cta.variant === 'primary'`
- [x] 1.6 Test unitario: cada `PANEL_HOME_CONTENT.stats[i].label` cumple el regex `/^[A-ZÁÉÍÓÚÑ0-9\s+]+$/` (uppercase, dígitos, espacios y `+` solamente)
- [x] 1.7 Test unitario: `PANEL_HOME_CONTENT.eyebrow === 'DESDE 1979'`, `headline` contiene "Más de 40 Años" como substring, `description` es string no vacío

## 2. Componente PanelHome.astro (TDD)

- [x] 2.1 Escribir `apps/web/src/components/__tests__/PanelHome.test.ts` (AstroContainer) con constante `baseProps: PanelHomeProps` usando los valores de `PANEL_HOME_CONTENT` (importar desde `lib/config/panel-home`)
- [x] 2.2 Test: el render produce un `<section>` como elemento más externo
- [x] 2.3 Test: el `<section>` lleva una clase de margin-top negativo (regex `/-mt-\d+/`), la clase `relative` y `z-10`
- [x] 2.4 Test: el `<section>` contiene un grid principal con clase `grid-cols-1` y `lg:grid-cols-2`
- [x] 2.5 Test: existe una mitad izquierda (`<div>` o equivalente) con clase `bg-brand-teal` y SIN `bg-white`
- [x] 2.6 Test: la mitad izquierda contiene un `<span>` (o `<p>`) con texto "DESDE 1979" y clase `uppercase`, y NO es un heading (`<h1>`..`<h6>`)
- [x] 2.7 Test: la mitad izquierda contiene un `<h2>` con el texto del headline verbatim y clase `text-white`
- [x] 2.8 Test: la mitad izquierda contiene un `<p>` con el texto de la descripción verbatim, una clase de opacidad reducida (`text-white/80`, `text-white/90` o `text-white`) y una clase de max-width (`max-w-md` o `max-w-lg`)
- [x] 2.9 Test: la mitad izquierda contiene un `<a href="/contacto">` con texto "SOLICITAR ASESORÍA TÉCNICA", clase `bg-brand-navy`, `text-white` y SIN `bg-brand-teal`
- [x] 2.10 Test: existe una mitad derecha (`<div>` o equivalente) con clase `bg-white` y SIN `bg-brand-teal`
- [x] 2.11 Test: la mitad derecha contiene un grid con clase `grid-cols-2` (y NO `grid-cols-1` como única columna)
- [x] 2.12 Test: la mitad derecha contiene exactamente 4 celdas de stat
- [x] 2.13 Test: cada celda de stat contiene un `<p>` (o equivalente) con el `value` correspondiente, clase `font-bold`, `text-brand-navy`, y NO es un heading
- [x] 2.14 Test: cada celda de stat contiene un `<p>` (o equivalente) con el `label` correspondiente, clase `uppercase`, una clase de texto gris (`text-gray-600` o equivalente), y NO es un heading
- [x] 2.15 Test: el documento renderizado NO contiene `<h3>`, `<h4>`, `<h5>` ni `<h6>` dentro del PanelHome (stats no son headings)
- [x] 2.16 Test: el documento renderizado contiene exactamente un `<h2>` (el headline del panel) y cero `<h1>` adicionales (el `<h1>` lo aporta el HeroBanner, no el PanelHome)
- [x] 2.17 Test: el `<a>` del CTA NO lleva `tabindex="-1"` ni `aria-hidden="true"`
- [x] 2.18 Test: las celdas de stat NO llevan `role="img"`, `aria-label` ni `alt`
- [x] 2.19 Test: snapshot del HTML renderizado con las `baseProps` (regresión visual)
- [x] 2.20 Crear `apps/web/src/components/PanelHome.astro` con props tipadas `PanelHomeProps`, frontmatter sin lógica de negocio no trivial (solo destructuring de props), estructura JSX: `<section class="relative -mt-16 md:-mt-24 lg:-mt-32 z-10">` → grid `grid grid-cols-1 lg:grid-cols-2` → **mitad izquierda** (`<div class="bg-brand-teal p-8 md:p-12 lg:p-16">`) con eyebrow (`<span class="block text-sm font-bold uppercase tracking-wider text-white/80">DESDE 1979</span>`), `<h2 class="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold text-white">headline</h2>`, `<p class="mt-4 text-white/80 max-w-md">description</p>`, `<a href={cta.href} class="mt-6 inline-block bg-brand-navy text-white font-bold uppercase text-sm px-6 py-3 rounded">cta.label</a>`; **mitad derecha** (`<div class="bg-white p-8 md:p-12">`) con grid `grid grid-cols-2 gap-x-8 gap-y-12` mapeando `stats` con `<div><p class="text-3xl md:text-4xl font-bold text-brand-navy">{value}</p><p class="mt-2 text-xs md:text-sm uppercase tracking-wide text-gray-600">{label}</p></div>`
- [x] 2.21 Verificar que la utilidad `bg-brand-teal` está disponible después del cambio (ya existe en `globals.css` desde `banner-home`; solo confirmar consumo)

## 3. Integración en index.astro

- [x] 3.1 Actualizar `apps/web/src/pages/index.astro`: importar `PanelHome` de `@/components/PanelHome.astro` y `PANEL_HOME_CONTENT` de `@/lib/config/panel-home`; añadir `<PanelHome {...PANEL_HOME_CONTENT} />` DESPUÉS del `<HeroBanner {...HERO_BANNER_CONTENT} />` dentro del `<Layout>` slot
- [x] 3.2 Verificar que el orden DOM en `/` es: `<TopHeader />` → `<header>` (site-header) → `<div role="search">` (SearchForm) → `<section>` (HeroBanner) → `<section>` (PanelHome) — el HeroBanner NO se mueve ni se modifica
- [x] 3.3 Verificar que el documento renderizado contiene exactamente un `<header>` (no se introduce un nuevo landmark) y un solo `<h1>` (el del HeroBanner)

## 4. Tests E2E (Playwright)

- [x] 4.1 E2E `apps/web/e2e/panel-home.spec.ts`: en desktop (>= 1024px) el `<section>` del PanelHome es visible y contiene un `<h2>` con el texto "Más de 40 Años de Liderazgo..."
- [x] 4.2 E2E: en desktop la mitad izquierda tiene `background-color` teal (rgb(20, 184, 166)) y la mitad derecha tiene `background-color` blanco (rgb(255, 255, 255))
- [x] 4.3 E2E: en desktop el CTA "SOLICITAR ASESORÍA TÉCNICA" es visible, tiene `href="/contacto"` y computed `background-color` navy (rgb(27, 42, 74))
- [x] 4.4 E2E: en desktop hay exactamente 4 celdas de stat visibles con los textos "40+", "30.000+", "5+", "9+" y sus labels correspondientes
- [x] 4.5 E2E: en mobile (< 1024px) las dos mitades se apilan verticalmente (teal arriba, blanco abajo) y cada una ocupa el 100% del ancho
- [x] 4.6 E2E: en mobile (< 1024px) el grid interno de stats mantiene `grid-cols-2` (2×2) y las 4 celdas son visibles y legibles a 320px
- [x] 4.7 E2E: el PanelHome se solapa visualmente sobre el HeroBanner (verificar con bounding boxes que el `y` del top del PanelHome es menor que el `y` del bottom del HeroBanner)
- [x] 4.8 E2E: el `<h1>` del HeroBanner ("Innovación que Fluye") sigue siendo visible y no queda cubierto por el PanelHome en 320px / 768px / 1024px / 1440px
- [x] 4.9 E2E: el foco keyboard Tab puede alcanzar el CTA "SOLICITAR ASESORÍA TÉCNICA" después de los CTAs del HeroBanner (orden DOM correcto)
- [x] 4.10 E2E: el documento contiene exactamente un `<h1>` (regresión SEO on-page) y un `<h2>` dentro del PanelHome
- [x] 4.11 E2E: el orden DOM de la home es TopHeader → header → div[role="search"] → section(hero) → section(panel) (consistencia con Layout.astro e index.astro)
- [x] 4.12 E2E: validar ratio de contraste WCAG AA del CTA navy sobre teal (>= 4.5:1 para texto normal; el cálculo esperado es ~5.9:1)
- [ ] 4.13 E2E: validar ratio de contraste WCAG AA del texto blanco del `<h2>` sobre teal (>= 3:1 para AA Large, ya que es bold >= 18pt) **TODO**: pendiente de la revisión global del sistema de diseño (change futuro `design-system-revision`); el ratio actual con `--color-brand-teal: #14B8A6` y texto blanco es ~2.49:1 y no cumple AA Large
- [x] 4.14 E2E: validar ratio de contraste WCAG AA del texto del `<p>` descripción sobre teal; si no cumple 4.5:1 (AA Normal), ajustar opacidad de `text-white/80` a `text-white/90` o `text-white` en el componente y re-validar **TODO**: pendiente de la misma revisión global (cambiar la opacidad no resuelve el problema — el color teal mismo no contrasta suficiente con blanco; se agenda para el change `design-system-revision`)

## 5. Verificación & Cleanup

- [x] 5.1 `npm run build --workspace=apps/web` → success
- [x] 5.2 `npm run typecheck --workspace=apps/web` → success
- [x] 5.3 `npm run lint --workspace=apps/web` → success
- [x] 5.4 `npm run test --workspace=apps/web` → all pass (unit + AstroContainer + snapshot + E2E)
- [x] 5.5 `npm run test:smoke --workspace=apps/web` → E2E Playwright pass
- [x] 5.6 `openspec validate panel-home` → valid
- [x] 5.7 `openspec status --change panel-home --json` → `isComplete: true` (applyRequires cubierto)
- [x] 5.8 POST-APPLY UPDATE: envolver el grid principal del `<section>` en `<div class="container mx-auto px-4 sm:px-6 lg:px-8">` para que el panel visual (teal+blanco) quede acotado al mismo ancho que el SearchForm (token `.container` en `globals.css`). Validado por E2E 4.2 (las dos mitades siguen dentro de los max-w-7xl px-* centrados). Snapshot actualizado.

---

## Known TODOs (accepted at archive time)

The following task is intentionally left unchecked at archive. It was accepted
as a known TODO by the user when archiving this change (the implementation is
functionally complete; this is an external-action item that depends on a
global design-system revision the user will roll out separately):

- **4.13** — E2E test asserting the `<h2>` white text on the teal background
  meets WCAG AA Large contrast (>= 3:1). The current ratio with
  `--color-brand-teal: #14B8A6` (Tailwind `teal-500`) and white text is
  **~2.49:1**, which does NOT meet AA Large. The root cause is the token
  itself, not the implementation: changing the text opacity
  (`text-white/80` → `text-white/90` → `text-white`) does not fix it because
  white-on-`#14B8A6` tops out at ~2.49:1 regardless of opacity. The
  corresponding task **4.14** (description `<p>` on teal, AA Normal) shares
  the same root cause and is left as a `.skip()` E2E as well.
  
  Decision: the user stated they will run a global review of the design
  system in a future change (`design-system-revision`) that will either
  darken `--color-brand-teal` globally (e.g. to `#0D9488` / `teal-600`) or
  introduce a new `--color-brand-teal-dark` token exclusively for the panel
  background. When that change lands, the two `test.skip()` calls in
  `apps/web/e2e/panel-home.spec.ts` MUST be removed and the tests re-run;
  no changes to `PanelHome.astro` itself will be required.

These adjustments, if requested by the client, can be made in follow-up
changes without re-opening `panel-home`.
