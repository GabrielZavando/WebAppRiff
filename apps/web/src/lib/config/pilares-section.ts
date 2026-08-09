import type { PilaresSectionProps } from '@/lib/types/pilares-section';
import type { Pilar } from '@/lib/types/pilares-section';
import sostenibilidadImg from '@/assets/img/sostenibilidad-edificios.jpg';

/**
 * Hardcoded content for the home page "pillars of excellence" section.
 *
 * Lives in `lib/config/` so the page (`apps/web/src/pages/index.astro`) can
 * spread it onto `<PilaresSection {...PILARES_SECTION_CONTENT} />` without
 * the component itself needing to know the marketing copy or the image
 * imports. Keeping it hardcoded is consistent with
 * `SOLUTION_SECTION_CONTENT`, `SERVICES_SECTION_CONTENT` and
 * `DESTACADOS_SECTION_CONTENT`: as the site is SSG, any change requires a
 * rebuild anyway. A future CMS/API migration will replace this with content
 * injected via props without touching the component (design.md § Decision 1/8).
 *
 * The background image is the photo delivered by the client (2026-08-09):
 * `sostenibilidad-edificios.jpg` (1600x1067) for the left column. The
 * `astro:assets` pipeline optimizes it and the component renders it with
 * `object-cover` under the `bg-secondary/80` overlay (design.md § Decisions
 * 2/3). POST-APPLY FIX #2 (2026-08-09): the right column no longer uses the
 * `planta-tratamiento-ecologica.webp` photo — the client reported it "no se
 * ve nada de bien" and asked for a flat `#006874` background (`bg-primary-deep`),
 * so `rightImage`/`rightImageAlt` were removed from the config contract.
 *
 * See `openspec/changes/pilares-section/design.md` for the rationale:
 * Decision 1 (dumb component), Decision 4 (heading hierarchy h2+h3),
 * Decision 6 (CTA solid accent → `/contacto`, a future route), Decision 7
 * (pillars: primary-colored Lucide icons + white labels), Decision 8
 * (hardcoded constant).
 */

/**
 * The 4 pillars of excellence in render order (client-specified, verbatim
 * labels). Each `icon` is a member of the closed union `PilarIconName`
 * (design.md § Decision 5): a typo here breaks the build instead of
 * rendering an empty icon at runtime.
 */
export const PILARES: readonly Pilar[] = [
  {
    label: 'Sostenibilidad',
    icon: 'recycle',
  },
  {
    label: 'Proyectos a tiempo',
    icon: 'clock',
  },
  {
    label: 'Tecnología de Vanguardia',
    icon: 'monitor',
  },
  {
    label: 'Soporte Técnico Especializado',
    icon: 'headphones',
  },
];

/**
 * Full props bag for `PilaresSection.astro`: left column value proposition
 * copy + CTA, right column pillars block + the left background image.
 * Spread onto `<PilaresSection {...PILARES_SECTION_CONTENT} />` by the page.
 */
export const PILARES_SECTION_CONTENT: Readonly<PilaresSectionProps> = {
  eyebrow: 'Sostenibilidad y Eficiencia',
  headline: 'Comprometidos con la Optimización de Recursos',
  description:
    'Empresa especializada en medición de fluidos y tratamiento de agua, orientada a optimizar los recursos hídricos de industrias y comunidades con soluciones eficientes y sostenibles.',
  cta: {
    label: 'HABLEMOS DE TU PROYECTO',
    href: '/contacto',
  },
  rightEyebrow: 'Estándares de Calidad',
  rightHeadline: 'Nuestros Pilares de Excelencia',
  rightDescription:
    'Equipos de alta precisión y durabilidad, respaldados por nuestra experiencia como fabricantes y por marcas globales, para soluciones confiables en minería e industria.',
  pillars: PILARES,
  leftImage: sostenibilidadImg,
  leftImageAlt: 'Edificios corporativos con diseño sostenible de eficiencia energética',
};