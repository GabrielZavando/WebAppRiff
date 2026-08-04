## 1. Types & Config

- [x] 1.1 Crear `apps/web/src/lib/types/hero-banner.ts` con `HeroCta` (`{ readonly label: string; readonly href: string; readonly variant: 'primary' | 'secondary' }`), `HeroStat` (`{ readonly label: string; readonly value: string }` — reservado para el change futuro `stats-strip`, no consumido en este change) y `HeroBannerProps` (`{ readonly headline: string; readonly highlightedWord: string; readonly subtitle: string; readonly description: string; readonly ctas: readonly HeroCta[]; readonly stats?: readonly HeroStat[] }`)
- [x] 1.2 Crear `apps/web/src/lib/config/hero-banner.ts` con constante `HERO_BANNER_CONTENT` tipada como `Readonly<HeroBannerProps>` conteniendo `headline: 'Innovación que Fluye'`, `highlightedWord: 'Fluye'`, `subtitle: 'Experiencia, tecnología y control en medición de fluidos y tratamientos de agua.'`, `description: 'Desarrollamos soluciones para la medición, control y tratamiento de agua, integrando equipos, soporte técnico y ejecución en terreno.'` y `ctas: [{ label: 'VER SERVICIOS', href: '/servicios', variant: 'primary' }, { label: 'ESCRÍBENOS', href: '/contacto', variant: 'secondary' }]`
- [x] 1.3 Crear helper `splitHeadline(headline: string, highlightedWord: string): readonly [string, string]` en `apps/web/src/lib/config/hero-banner.ts`: divide `headline` en la PRIMERA ocurrencia de `highlightedWord` y devuelve `[before, after]`. Si `highlightedWord` es vacío o no aparece, devuelve `[headline, '']`. Si aparece al inicio, `before` es `''`. Si aparece al final, `after` es `''`. Solo la primera ocurrencia se cuenta como split (segunda y subsiguientes quedan dentro de `after`)
- [x] 1.4 Test unitario `apps/web/src/lib/config/__tests__/hero-banner.test.ts`: `splitHeadline('Innovación que Fluye', 'Fluye')` → `['Innovación que ', '']`
- [x] 1.5 Test unitario: `splitHeadline('Fluye con nosotros', 'Fluye')` → `['', ' con nosotros']`
- [x] 1.6 Test unitario: `splitHeadline('Innovación que Fluye hoy', 'Fluye')` → `['Innovación que ', ' hoy']`
- [x] 1.7 Test unitario: `splitHeadline('Bienvenido', 'Fluye')` → `['Bienvenido', '']` (palabra no presente)
- [x] 1.8 Test unitario: `splitHeadline('Fluye y vuelve a Fluye', 'Fluye')` → `['', ' y vuelve a Fluye']` (solo primera ocurrencia)
- [x] 1.9 Test unitario: `splitHeadline('Innovación que Fluye', '')` → `['Innovación que Fluye', '']` (highlightedWord vacío)
- [x] 1.10 Test unitario: `HERO_BANNER_CONTENT.headline` contiene `HERO_BANNER_CONTENT.highlightedWord` como substring
- [x] 1.11 Test unitario: `HERO_BANNER_CONTENT.ctas` tiene longitud `2`, primer elemento `variant: 'primary'` con `label: 'VER SERVICIOS'` y `href: '/servicios'`, segundo elemento `variant: 'secondary'` con `label: 'ESCRÍBENOS'` y `href: '/contacto'`
- [x] 1.12 Test unitario: `HERO_BANNER_CONTENT.subtitle` y `HERO_BANNER_CONTENT.description` son strings no vacíos

## 2. Tailwind & Tokens

- [x] 2.1 Añadir `--color-brand-teal: #14B8A6;` al bloque `@theme` existente en `apps/web/src/styles/globals.css` (junto a `--color-brand-navy`, `--color-brand-navy-light`, `--color-brand-orange`). Esto expone las utilidades `bg-brand-teal`, `text-brand-teal`, `border-brand-teal` vía Tailwind v4
- [x] 2.2 Verificar que la utilidad `bg-brand-teal` está disponible después del cambio consumiendo una página existente con `npm run build --workspace=apps/web` → success
- [x] 2.3 Verificar que `brand-orange` y `brand-navy` siguen funcionando en `Header.astro` y `SearchForm.astro` (regresión visual vía snapshot existente del SearchForm)

## 3. Componente HeroBanner.astro (TDD)

- [x] 3.1 Escribir `apps/web/src/components/__tests__/HeroBanner.test.ts` (AstroContainer) con constante `baseProps: HeroBannerProps` usando `headline: 'Innovación que Fluye'`, `highlightedWord: 'Fluye'`, `subtitle`, `description` y dos ctas de prueba (primary + secondary)
- [x] 3.2 Test: el render produce un `<section>` como elemento más externo
- [x] 3.3 Test: el `<h1>` contiene el literal "Innovación que " seguido del `<span class="text-brand-teal">Fluye</span>` (el espacio del headline original se preserva, el split NO introduce whitespace extra — scenario ajustado en spec.md para usar el headline real `Innovación que Fluye`)
- [x] 3.4 Test: el `<h1>` contiene un `<span class="text-brand-teal">Fluye</span>`
- [x] 3.5 Test: cuando `highlightedWord="Inexistente"`, el `<h1>` contiene el texto plano de `headline` completo y NO contiene ningún `<span class="text-brand-teal">`
- [x] 3.6 Test: cuando `highlightedWord` aparece dos veces en `headline`, el `<h1>` contiene exactamente UN `<span class="text-brand-teal">`
- [x] 3.7 Test: el `<h1>` está seguido por un `<h2>` con el texto del subtítulo y una clase `max-w-3xl` (o clase equivalente que constriña el ancho)
- [x] 3.8 Test: el `<h2>` está seguido por un `<p>` con el texto de la descripción y una clase `text-white/80` (o equivalente de opacidad reducida) y `max-w-2xl`
- [x] 3.9 Test: se renderizan dos `<a>` cuyos `href` y `label` coinciden con `ctas[0]` y `ctas[1]` respectivamente
- [x] 3.10 Test: el `<a>` con `variant: 'primary'` lleva una clase que contiene `bg-brand-teal` y `text-white`
- [x] 3.11 Test: el `<a>` con `variant: 'secondary'` lleva una clase que contiene `border-white` (o `border-2 border-white`) y NO lleva ninguna clase `bg-brand-teal`
- [x] 3.12 Test: los dos `<a>` están envueltos en un contenedor con clase `flex-col` y `sm:flex-row` (o equivalentes responsivos)
- [x] 3.13 Test: el `<section>` lleva una clase que referencia gradiente navy (e.g. `bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-navy`)
- [x] 3.14 Test: NO hay ningún `<img>`, `<picture>` ni atributo `style="background-image: url(...)` que referencie un asset externo en el HTML renderizado
- [x] 3.15 Test: existe una capa de fondo absoluta (clase `absolute inset-0` o equivalente) y una capa de contenido con `relative` encima
- [x] 3.16 Test: el `<h1>` lleva una clase responsiva de tamaño (`text-4xl` base + `md:text-6xl`)
- [x] 3.17 Test: el contenedor del contenido lleva vertical padding responsivo (`py-16` base + `md:py-24`)
- [x] 3.18 Test: el documento renderizado contiene exactamente un `<h1>` y un `<h2>` (no introduce múltiples `<h1>`)
- [x] 3.19 Test: los `<a>` NO llevan `tabindex="-1"` ni `aria-hidden="true"`
- [x] 3.20 Test: las capas decorativas de fondo NO llevan `role="img"`, `aria-label` ni `alt`
- [x] 3.21 Test: snapshot del HTML renderizado con las `baseProps` (regresión visual)
- [x] 3.22 Crear `apps/web/src/components/HeroBanner.astro` con props tipadas `HeroBannerProps`, frontmatter que importe `splitHeadline` de `@/lib/config/hero-banner` y compute `const [before, after] = splitHeadline(headline, highlightedWord)`, estructura JSX: `<section>` → capa de fondo absoluta + capa de contenido relativa con `<h1>{before}<span class="text-brand-teal">{highlightedWord}</span>{after}</h1>` (omitir el span si `highlightedWord` no aparece), `<h2>{subtitle}</h2>`, `<p>{description}</p>`, contenedor de CTAs mapeando `ctas` con `class:list` condicional según `variant`
- [x] 3.23 Implementar layout responsivo en el componente: `<h1 class="text-4xl md:text-6xl ...">`, contenedor de CTAs `flex flex-col sm:flex-row gap-3`, padding `py-16 md:py-24`
- [x] 3.24 Añadir comentario `// TODO: replace CSS-only background with real industrial image when client delivers the asset` en el `<section>` del HeroBanner (referencia al placeholder decision del design.md)

## 4. Integración en index.astro

- [x] 4.1 Actualizar `apps/web/src/pages/index.astro`: importar `HeroBanner` de `@/components/HeroBanner.astro` y `HERO_BANNER_CONTENT` de `@/lib/config/hero-banner`; reemplazar el `<main>` placeholder actual por `<HeroBanner {...HERO_BANNER_CONTENT} />` dentro del `<Layout>` slot
- [x] 4.2 Verificar que el texto "Proyecto en desarrollo — Fase A: Bootstrap completado" ya NO aparece en el HTML renderizado de `/`
- [x] 4.3 Verificar que el orden DOM sigue siendo: `<TopHeader />` → `<header>` (site-header) → `<div role="search">` (SearchForm) → `<section>` (HeroBanner) — el SearchForm no se mueve ni se modifica

## 5. Tests E2E (Playwright)

- [x] 5.1 E2E `apps/web/e2e/hero-banner.spec.ts`: en desktop (>= 768px) el `<section>` del hero es visible y contiene un `<h1>` con el texto "Innovación que" seguido de la palabra "Fluye" en color teal (verificar computed `color` igual a `rgb(20, 184, 166)` o contar la clase `text-brand-teal`)
- [x] 5.2 E2E: en desktop el `<h2>` del subtítulo es visible y contiene el texto "Experiencia, tecnología y control..."
- [x] 5.3 E2E: en desktop el `<p>` de la descripción es visible y contiene el texto "Desarrollamos soluciones..."
- [x] 5.4 E2E: hay exactamente dos `<a>` dentro del hero, con textos "VER SERVICIOS" y "ESCRÍBENOS" respectivamente
- [x] 5.5 E2E: el enlace "VER SERVICIOS" tiene `href="/servicios"` y computed `background-color` teal (rgb(20, 184, 166))
- [x] 5.6 E2E: el enlace "ESCRÍBENOS" tiene `href="/contacto"` y un `border` blanco (computed `border-color` igual a `rgb(255, 255, 255)`) y sin `background-color` teal
- [x] 5.7 E2E: en mobile (< 768px) los dos CTAs se apilan verticalmente (flex-col) y cada uno ocupa el ancho completo
- [x] 5.8 E2E: en desktop (>= 768px) los dos CTAs se disponen horizontalmente (flex-row) side-by-side
- [x] 5.9 E2E: el `<h1>` en mobile tiene size `text-4xl` (computed font-size ~36px) y en desktop `md:text-6xl` (computed font-size ~60px)
- [x] 5.10 E2E: el foco keyboard Tab parte en el primer CTA "VER SERVICIOS" y al pulsar Tab se mueve al segundo CTA "ESCRÍBENOS" (orden DOM correcto)
- [ ] 5.11 E2E: pulsar Enter con el foco en "VER SERVICIOS" navega a `/servicios` (o resuelve la página placeholder actual si no existe — dejar como TODO porque la página `/servicios` está fuera de scope) **TODO**: pendiente hasta que exista la página `/servicios` o se cree un placeholder equivalente
- [x] 5.12 E2E: el documento contiene exactamente un `<h1>` (regresión SEO on-page)
- [x] 5.13 E2E: el documento contiene exactamente un `<h2>` dentro del hero
- [x] 5.14 E2E: el documento NO contiene texto "Proyecto en desarrollo" (placeholder anterior fue reemplazado)
- [x] 5.15 E2E: el orden DOM de la home carga es TopHeader → header → div[role="search"] → section(hero) (consistencia con Layout.astro)

## 6. Verificación & Cleanup

- [x] 6.1 `npm run build --workspace=apps/web` → success
- [x] 6.2 `npm run typecheck --workspace=apps/web` → success
- [x] 6.3 `npm run lint --workspace=apps/web` → success
- [x] 6.4 `npm run test --workspace=apps/web` → all pass (unit + AstroContainer + snapshot + E2E)
- [x] 6.5 `npm run test:smoke --workspace=apps/web` → E2E Playwright pass
- [x] 6.6 `openspec validate banner-home` → valid
- [x] 6.7 `openspec status --change banner-home --json` → `isComplete: true` (applyRequires cubierto)
- [ ] 6.8 Confirmar con el cliente las Open Questions del design.md: (a) color exacto teal `#14B8A6` vs `#0D9488`, (b) hrefs de los CTAs `/servicios` y `/contacto` vs anclas `#servicios` `#contacto`, (c) agenda de `stats-strip` y `search-form-variants` como próximos changes

---

## Known TODOs (accepted at archive time)

The following two tasks are intentionally left unchecked at archive. They were
accepted as known TODOs by the user when archiving this change (the
implementation is functionally complete; these are external-action items):

- **5.11** — E2E test asserting Enter on "VER SERVICIOS" navigates to `/servicios`.
  Out of scope of `banner-home` because the `/servicios` page does not exist
  yet. To be implemented when the change `servicios-page` (or equivalent
  placeholder) is created.
- **6.8** — Confirm with the client the Open Questions from `design.md`:
  - (a) exact teal color `#14B8A6` (Tailwind `teal-500`) vs `#0D9488`
    (`teal-600`). The component uses `#14B8A6` by default; adjustable in a
    single place (`apps/web/src/styles/globals.css`).
  - (b) CTAs `href`s: `/servicios` and `/contacto` as routes, vs `#servicios`
    and `#contacto` as in-page anchors. The component uses routes by default.
  - (c) Schedule of upcoming changes: `stats-strip` (stats strip below the
    hero) and `search-form-variants` (SearchForm visual variant over the
    dark hero).

These adjustments, if requested by the client, can be made in follow-up
changes without re-opening `banner-home`.
