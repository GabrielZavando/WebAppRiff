## 1. Types & Config

- [x] 1.1 Crear `apps/web/src/lib/types/services-page.ts` con `ServicePageService` (`{ readonly number: number; readonly sector: string; readonly title: string; readonly description: string; readonly image: ImageMetadata; readonly imageAlt: string; readonly bullets?: readonly string[]; readonly tags?: readonly string[] }`), `ServicesHeroProps` (`{ readonly headline: string; readonly highlightedWord: string; readonly subtitle: string }`), `ServicesPageProps` (`{ readonly hero: ServicesHeroProps; readonly services: readonly ServicePageService[] }`)
- [x] 1.2 Crear `apps/web/src/lib/config/services-page.ts` con `SERVICIOS_PAGE_HERO` (headline "Servicios Especializados en Precisión y Control", highlightedWord "Precisión", subtitle), `SERVICIOS_PAGE_SERVICES` (4 servicios reutilizando imágenes de `assets/img/`: edificios.jpg, medidores-de-agua.webp, planta-tratamiento.webp, osmosis-inversa.jpg; cards 02 y 04 con `bullets`, card 03 con `tags`), y `SERVICIOS_PAGE_CONTENT` (`{ hero, services }`)
- [x] 1.3 Test unitario `apps/web/src/lib/config/__tests__/services-page.test.ts`: `SERVICIOS_PAGE_SERVICES` tiene exactamente 4 elementos; cada uno tiene `number` 1–4, `sector`/`title`/`description`/`image`/`imageAlt` no vacíos; card 02 y 04 tienen `bullets` no vacío; card 03 tiene `tags` no vacío; card 01 no tiene `bullets` ni `tags`
- [x] 1.4 Test unitario: `SERVICIOS_PAGE_HERO.headline` contiene "Precisión", `highlightedWord` es "Precisión", `subtitle` no vacío

## 2. Componente ServicesHero.astro (TDD)

- [x] 2.1 Escribir `apps/web/src/components/__tests__/ServicesHero.test.ts` (AstroContainer): renderiza el headline completo y la palabra resaltada dentro de `<span class="text-accent">`
- [x] 2.2 Test: cuando `highlightedWord` está vacío, NO se renderiza `<span class="text-accent">` y el headline aparece completo
- [x] 2.3 Test: el `subtitle` se renderiza como elemento con texto no vacío
- [x] 2.4 Test (SUPERSEDED by Sección 6): la sección lleva `bg-secondary-dark` y el headline `text-white`; el HTML NO contiene clases `rounded` ni `shadow`
- [x] 2.5 Test: snapshot del HTML renderizado (regresión visual)
- [x] 2.6 Crear `apps/web/src/components/ServicesHero.astro` (estructura: `<section class="bg-secondary-dark ...">` con headline `<h1>` + `splitHeadline()` + subtítulo `<p>`), props tipadas `ServicesHeroProps`, reutilizando `splitHeadline` de `lib/config/hero-banner.ts`
- [x] 2.7 Verificar tokens (`text-accent` para el resaltado, `text-white` para el título) y NO usar `rounded*` ni `shadow*`

## 3. Componente ServiceCard.astro (TDD)

- [x] 3.1 Escribir `apps/web/src/components/__tests__/ServiceCard.test.ts` (AstroContainer): número formateado "01" con `text-primary`; `sector` en `text-primary uppercase`; `title` en `<h2>`; `description` en `<p>`; imagen con `alt` y `loading="lazy"`
- [x] 3.2 Test: `imagePosition="right"` agrega `md:flex-row-reverse`; `imagePosition="left"` NO lo agrega
- [x] 3.3 Test: `bullets` no vacío renderiza `<ul>` con N `<li>` y un icono `lucide:check` decorativo; `bullets` ausente NO renderiza `<ul>`
- [x] 3.4 Test: `tags` no vacío renderiza pills `<span>` con `border border-border`; `tags` ausente NO renderiza pills
- [x] 3.5 Test: CTA `<a href="/contacto">` con texto "CONTACTAR A UN ESPECIALISTA", clase `bg-accent`, icono `lucide:arrow-right` decorativo
- [x] 3.6 Test: el HTML NO contiene clases `rounded` ni `shadow`; la card root lleva `bg-white border border-border`
- [x] 3.7 Test: snapshot del HTML renderizado (regresión visual)
- [x] 3.8 Crear `apps/web/src/components/ServiceCard.astro` (estructura: `<article class="bg-white border border-border ...">` → `flex flex-col md:flex-row` (+ `md:flex-row-reverse` si `imagePosition==='right'`) → `<Image>` + bloque contenido con número/sector/título/descripción/`bullets`/`tags`/CTA), props tipadas `ServicePageService` extendidas con `imagePosition`
- [x] 3.9 Implementar bullets opcionales (`<ul>` + `lucide:check` `text-primary` `aria-hidden`) y tags opcionales (fila de `<span class="border border-border text-text-2">`); CTA `bg-accent hover:bg-accent-dark text-white font-heading uppercase text-sm px-6 py-3` con icono `lucide:arrow-right`

## 4. Página /servicios

- [x] 4.1 Modificar (SUPERSEDED by Sección 6) `apps/web/src/pages/servicios.astro`: reemplazar placeholder con `<Layout title="Servicios — Riff" description="..." hero={false} searchSecondary>` conteniendo `ServicesHero` + `<main class="bg-bg">` con sección de 4 `ServiceCard` (`services.map((s, i) => <ServiceCard {...s} number={i+1} imagePosition={i % 2 === 0 ? 'left' : 'right'} />)`)
- [x] 4.2 Test (página) (SUPERSEDED by Sección 6): el HTML contiene el headline del hero, exactamente 4 `<h2>` de servicios, 4 `<img>` de `astro:assets`; NO contiene `banner_home.webp`; la sección de cards lleva `bg-bg`; cards 1 y 3 sin `md:flex-row-reverse`, cards 2 y 4 con `md:flex-row-reverse`

## 6. Ajuste post-apply — Hero igual a inicio (imagen + overlay, scroll header)

- [x] 6.1 Modificar `apps/web/src/pages/servicios.astro`: cambiar `<Layout ... hero={false} searchSecondary>` por `<Layout ... hero>` (igual que `index.astro`), manteniendo `ServicesHero` + `<main class="bg-bg">` con las 4 `ServiceCard`.
- [x] 6.2 Modificar `apps/web/src/components/ServicesHero.astro`: quitar `bg-secondary-dark`; la sección es transparente (sin fondo propio) de modo que se vea la imagen del hero de `Layout` + overlay `bg-secondary/80`; mantener `py-16 md:py-24`, headline `text-white` y subtítulo `text-white/80`.
- [x] 6.3 Test `ServicesHero.test.ts`: la sección NO lleva `bg-secondary-dark`; el HTML renderizado NO contiene `banner_home.webp` (la imagen la aporta `Layout`, no el componente); headline `text-white` y subtítulo presentes; NO contiene `rounded`/`shadow`; snapshot actualizado.
- [x] 6.4 Test (SUPERSEDED by Sección 7) `servicios.test.ts`: la página SÍ contiene el hero image (vía `Layout hero`); el headline del hero y 4 `<h2>` presentes; sección de cards con `bg-bg`; alternancia `md:flex-row-reverse` en cards 2 y 4.
- [x] 6.5 Verificación: `npm run build` ✓ (74 páginas), `npm run test` ✓ (880 pass), `openspec validate servicios-page` ✓ válido. Typecheck/lint: 0 errores en archivos del change (restan 8 errores typecheck + 2 errores lint pre-existentes fuera del alcance del change, idénticos a la línea base).

## 5. Verificación & Cleanup

- [x] 5.1 `npm run build --workspace=apps/web` → success (incluye /servicios con contenido real)
- [x] 5.2 `npm run typecheck --workspace=apps/web` → success para los archivos del change
- [x] 5.3 `npm run lint --workspace=apps/web` → success (sin errores en archivos del change)
- [x] 5.4 `npm run test --workspace=apps/web` → all pass (tests nuevos del change)
- [x] 5.5 `openspec validate servicios-page` → valid
- [x] 5.6 `openspec status --change servicios-page --json` → todos los artefactos completos (`isComplete: true`)

## 7. Ajuste post-apply — Imagen de fondo del hero = tratamiento-agua.webp

- [x] 7.1 Añadir prop opcional `heroImage?: ImageMetadata` a `Layout.astro` (default `banner_home.webp`), usada en el `<Picture>` del hero en lugar de la importación fija. Test en `Layout.test.ts`: al pasar `heroImage` con otra imagen, el HTML contiene esa imagen y NO `banner_home.webp`; con el default, contiene `banner_home.webp` (sin romper tests existentes).
- [x] 7.2 Modificar `apps/web/src/pages/servicios.astro`: importar `tratamiento-agua.webp` y pasar `heroImage={tratamientoAgua}` a `Layout` (junto con `hero`).
- [x] 7.3 Test `servicios.test.ts`: la página contiene `tratamiento-agua.webp` como hero image y NO contiene `banner_home.webp`; mantiene headline, 4 `<h2>`, `bg-bg`, alternancia `md:flex-row-reverse`.
- [x] 7.4 `npm run build --workspace=apps/web`, `npm run typecheck --workspace=apps/web` (0 errores en archivos del change), `npm run lint --workspace=apps/web` (0 errores en archivos del change), `npm run test --workspace=apps/web`, `openspec validate servicios-page` → success.

## 8. Ajuste post-apply — Texto extendido en cards 01-03 (intro + check-list)

- [x] 8.1 Añadir `intro?: string` a `ServicePageService` (`lib/types/services-page.ts`); `ServiceCard.astro` renderiza el párrafo `intro` bajo `description` y sobre `bullets` (mismo estilo `text-text-2`).
- [x] 8.2 `lib/config/services-page.ts`: card 01 añade `intro` (8 bullets); card 02 reemplaza sus 2 bullets por `intro` + 8 bullets; card 03 reemplaza `tags` (4) por `intro` + 4 bullets; card 04 sin cambios (description + 3 bullets, sin intro).
- [x] 8.3 `services-page.test.ts`: cards 01-04 tienen bullets (8/8/4/3); cards 01-03 tienen `intro` (lead-ins correctos); card 03 sin `tags`; card 04 sin `intro`. `ServiceCard.test.ts`: nuevos tests de `intro` (render, orden antes de `<ul>`, ausencia); corregir test "no bullets" con `bullets: []`. `servicios.test.ts`: cards 01-03 contienen los lead-ins y 4 `<ul>` totales.
- [x] 8.4 `npm run build --workspace=apps/web`, `npm run typecheck --workspace=apps/web` (0 errores en archivos del change), `npm run lint --workspace=apps/web` (0 errores en archivos del change), `npm run test --workspace=apps/web`, `openspec validate servicios-page` → success.

## 9. Ajuste post-apply — Eliminar `description` corto (solo textos añadidos + títulos)

- [x] 9.1 Eliminar `description` de `ServicePageService` (`lib/types/services-page.ts`) y de su doc; `ServiceCard.astro` deja de renderizar el `<p>` de `description` (el único párrafo es ahora `intro` cuando existe).
- [x] 9.2 `lib/config/services-page.ts`: quitar `description` de las 4 cards. Card 04 queda con solo `bullets` (3); cards 01-03 con `intro` + `bullets`.
- [x] 9.3 Tests: `services-page.test.ts` ya no exige `description`; `ServiceCard.test.ts` elimina el test de `description` y los `description:` de los tests de `intro`; nuevo test que card 04 no renderiza ningún `<p>` de prosa. Snapshots actualizados.
- [x] 9.4 `npm run build --workspace=apps/web`, `npm run typecheck --workspace=apps/web` (0 errores en archivos del change), `npm run lint --workspace=apps/web` (0 errores en archivos del change), `npm run test --workspace=apps/web`, `openspec validate servicios-page` → success.
