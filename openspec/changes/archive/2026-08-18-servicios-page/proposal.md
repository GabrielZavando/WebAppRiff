## Why

The `/servicios` route currently renders a placeholder ("El contenido de la página de servicios está en construcción"). The client delivered `docs/design/components/ServicesPage.png` defining the full layout: a dark hero plus four alternating service cards. We need to implement the complete page following the design system and the dumb-component + hardcoded-config pattern already established across the site.

## What Changes

- Add a `ServicesHero.astro` presentational component: headline "Servicios Especializados en Precisión y Control" with "Precisión" highlighted in accent, plus a subtitle.
- Add a `ServiceCard.astro` presentational component rendering an alternating image/text card with index number (01–04), sector label, title, description, optional bullets (checkmarks), optional tags (pills), and a "CONTACTAR A UN ESPECIALISTA" CTA pointing to `/contacto`.
- Add `apps/web/src/lib/types/services-page.ts` with `ServicePageService`, `ServicesHeroProps`, `ServicesPageProps`.
- Add `apps/web/src/lib/config/services-page.ts` with hardcoded content for the hero and the four services, reusing existing `assets/img` images.
- Replace the placeholder body of `servicios.astro` with the composed page (`Layout` + `ServicesHero` + 4 `ServiceCard`).
- No backend changes; the CTA links to the existing `/contacto` page.

## Capabilities

### New Capabilities

- `services-page`: Full public `/servicios` page (hero + four alternating service cards) implemented as dumb Astro components fed by a hardcoded config.

### Modified Capabilities

<!-- No existing capability requirement changes in this change. -->

## Impact

- **New files**: `apps/web/src/components/ServicesHero.astro`, `apps/web/src/components/ServiceCard.astro`, `apps/web/src/lib/types/services-page.ts`, `apps/web/src/lib/config/services-page.ts`, `apps/web/src/lib/config/__tests__/services-page.test.ts`, `apps/web/src/components/__tests__/ServicesHero.test.ts`, `apps/web/src/components/__tests__/ServiceCard.test.ts`.
- **Modified files**: `apps/web/src/pages/servicios.astro` (replace placeholder).
- **No API, DB, or dependency changes.**
- **Reuses images** in `apps/web/src/assets/img/` (`edificios.jpg`, `medidores-de-agua.webp`, `planta-tratamiento.webp`, `osmosis-inversa.jpg`).
