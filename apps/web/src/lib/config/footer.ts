import type { SiteFooterProps } from '@/lib/types/footer';
import { getContactInfo } from '@/lib/config/contact';
import { getSocialLinks } from '@/lib/types/top-header';

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
 * - SERVICIOS/EMPRESA link columns use placeholder `href="#"` (client
 *   decision): real routes are a future navigation change;
 * - schedule rows are label/value pairs rendered as a `<dl>`.
 *
 * The brand logo image (`logo-web.webp`) is deliberately NOT part of this
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
 * Social links reuse the env-driven `getContactInfo()` already consumed by
 * `TopHeader.astro` (design.md § Decision 4): the footer renders the same
 * social presence as the top bar — a single source of truth.
 */
export const SITE_FOOTER_CONTENT: Readonly<SiteFooterProps> = {
  logoAlt: 'Riff',
  tagline: 'Innovación tecnológica en la gestión de fluidos desde 1979.',
  socialLinks: getSocialLinks(getContactInfo()),
  columns: [
    {
      title: 'SERVICIOS',
      links: [
        { label: 'Instalación de Medidores', href: '#' },
        { label: 'Control de Agua Caliente', href: '#' },
        { label: 'Puesta en Marcha Industrial', href: '#' },
        { label: 'Obras Civiles Hidráulicas', href: '#' },
      ],
    },
    {
      title: 'EMPRESA',
      links: [
        { label: 'Nuestra Historia', href: '#' },
        { label: 'Representaciones', href: '#' },
        { label: 'Proyectos de Éxito', href: '#' },
        { label: 'Contacto Directo', href: '#' },
      ],
    },
  ],
  schedule: [
    { days: 'Lunes a Jueves', hours: '09:00 a 18:00' },
    { days: 'Viernes', hours: '09:00 a 17:00' },
  ],
  scheduleNote: 'Soporte 24/7 disponible',
};