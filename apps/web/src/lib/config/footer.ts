import type { SiteFooterProps } from '@/lib/types/footer';
import { getContactInfo } from '@/lib/config/contact';
import { getSocialLinks } from '@/lib/types/contact';

/**
 * Hardcoded content for the public site footer.
 *
 * Lives in `lib/config/` so `Layout.astro` can spread it onto
 * `<Footer {...SITE_FOOTER_CONTENT} />` without the component needing to know
 * the marketing copy. Keeping it hardcoded is consistent with every other
 * section config (`SOLUTION_SECTION_CONTENT`, `SERVICES_SECTION_CONTENT`,
 * etc.): as the site is SSG, any change requires a rebuild anyway.
 *
 * Copy source: `docs/design/components/Footer.png` (mockup delivered by the
 * client, 2026-08-10) — see design.md § Decisions 5/10:
 * - SERVICIOS/EMPRESA link columns carried placeholder `href="#"` until change
 *   `web-content-and-ui-polish` (2026-10-24) pointed them at the real internal
 *   routes: SERVICIOS → the four `/servicios#<slug>` field-service anchors
 *   (slugs 1:1 with `SERVICIOS_FIELD_SECTION`) and EMPRESA → real pages; the
 *   "Proyectos de Éxito" link was removed (no destination page);
 * - SERVICIOS labels updated 2026-08-14 to the real service offering
 *   (see openspec change `footer-credits-scrollbar` § Decision 3);
 * - schedule rows are label/value pairs rendered as a `<dl>`, with the
 *   `scheduleTitle` prop sourced from config ("Horario de Atención") and
 *   `hours` as an array of split-shift blocks (design.md § Decisions 2/3).
 *
 * The brand logo image (`logo-web.png`) is deliberately NOT part of this
 * config: the `SiteFooterProps` contract has no image field (spec
 * "Component is presentational with a typed props contract"), so
 * `Footer.astro` imports the asset directly from `@/assets/img/` exactly
 * like `Header.astro` does (design.md § Decision 3).
 */

/**
 * Copyright line rendered in the footer bottom bar (mockup text, verbatim,
 * including the © symbol and the uppercase "TODOS LOS DERECHOS
 * RESERVADOS."). Standalone constant (not part of `SiteFooterProps` because
 * the props contract only covers the configurable content; the bottom bar
 * texts are fixed legal copy — design.md § D11).
 */
export const FOOTER_COPYRIGHT =
  '© 2024 RIFF SPA. TODOS LOS DERECHOS RESERVADOS.';

/** Location label rendered next to the scroll-to-top button (mockup text). */
export const FOOTER_LOCATION = 'SANTIAGO, CHILE';

/**
 * Full props bag for `Footer.astro`, spread onto
 * `<Footer {...SITE_FOOTER_CONTENT} />` by `Layout.astro`.
 *
 * Social links reuse the env-driven `getContactInfo()` shared by the contact
 * page (design.md § Decision 4): the footer renders the same social presence —
 * a single source of truth.
 */
export const SITE_FOOTER_CONTENT: Readonly<SiteFooterProps> = {
  logoAlt: 'Riff',
  tagline: 'Innovación tecnológica en la gestión de fluidos desde 1979.',
  socialLinks: getSocialLinks(getContactInfo()),
  columns: [
    {
      title: 'SERVICIOS',
      links: [
        // Slugs 1:1 with `SERVICIOS_FIELD_SECTION` in `services-page.ts`, so
        // each link deep-links to its card anchor on /servicios (change
        // `web-content-and-ui-polish` replaced the former `href="#"`
        // placeholders).
        { label: 'Medición en Edificios', href: '/servicios#medicion-en-edificios' },
        { label: 'Medición Industrial', href: '/servicios#medicion-industrial' },
        { label: 'Obras y Proyectos', href: '/servicios#obras-y-proyectos' },
        {
          label: 'Tratamiento de Agua y Desalinización',
          href: '/servicios#tratamiento-de-agua',
        },
      ],
    },
    {
      title: 'EMPRESA',
      links: [
        // "Proyectos de Éxito" was removed (no destination page exists;
        // user decision 2026-10-24, change `web-content-and-ui-polish`).
        { label: 'Nuestra Historia', href: '/nosotros#historia' },
        { label: 'Representaciones', href: '/representaciones' },
        { label: 'Contacto Directo', href: '/contacto' },
      ],
    },
  ],
  scheduleTitle: 'Horario de Atención',
  schedule: [
    {
      days: 'Lunes a Jueves',
      hours: ['9:00 a 13:00 hrs.', '14:00 a 18:00 hrs.'],
    },
    {
      days: 'Viernes',
      hours: ['9:00 a 13:00 hrs.', '14:00 a 17:00 hrs.'],
    },
  ],
  scheduleNote: 'Soporte 24/7 disponible',
};