import type { PanelHomeProps } from '@/lib/types/panel-home';

/**
 * Hardcoded content for the home page "about / trust signals" panel.
 *
 * Lives in `lib/config/` so the page (`apps/web/src/pages/index.astro`) can
 * spread it onto `<PanelHome {...PANEL_HOME_CONTENT} />` without the component
 * itself needing to know the marketing copy or the stats figures. Keeping it
 * hardcoded is consistent with `HERO_BANNER_CONTENT` (hero),
 * `NAVIGATION_ITEMS` (site-header) and `CATEGORY_OPTIONS` (search-form): as
 * the site is SSG, any change requires a rebuild anyway.
 *
 * The future change `contentful-from-cms` will replace this with content
 * injected via props without touching the component (same migration path as
 * `HERO_BANNER_CONTENT`).
 *
 * See `openspec/changes/panel-home/design.md` § Decisions for the rationale:
 * Decision 1 (dumb component), Decision 5 (CTA navy on teal), Decision 7
 * (stats as `<div>` not headings), Decision 9 (PanelCta not HeroCta).
 */
export const PANEL_HOME_CONTENT: Readonly<PanelHomeProps> = {
  eyebrow: 'DESDE 1979',
  headline:
    'Más de 40 Años de Liderazgo en la Medición y Control de Fluidos',
  description:
    'Nuestra historia comienza con el desarrollo de soluciones para tratamiento de agua y evoluciona hacia la especialización en medición para la industria.',
  cta: {
    label: 'SOLICITAR ASESORÍA TÉCNICA',
    href: '/contacto',
    variant: 'primary',
  },
  stats: [
    { value: '40+', label: 'AÑOS DE EXPERIENCIA EN LA INDUSTRIA', numericValue: 40 },
    { value: '30.000+', label: 'EQUIPOS Y SOLUCIONES IMPLEMENTADAS', numericValue: 30000 },
    { value: '5+', label: 'MARCAS GLOBALES REPRESENTADAS', numericValue: 5 },
    { value: '9+', label: 'LÍNEAS DE SOLUCIONES INDUSTRIALES', numericValue: 9 },
  ],
};
