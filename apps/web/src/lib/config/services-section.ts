import type { ServicesSectionProps, Service } from '@/lib/types/services-section';
import edificiosImg from '@/assets/img/edificios.jpg';
import medidoresImg from '@/assets/img/medidores-de-agua.webp';
import obrasImg from '@/assets/img/planta-tratamiento.webp';
import osmosisImg from '@/assets/img/osmosis-inversa.jpg';

/**
 * Hardcoded content for the home page "specialized services" section.
 *
 * Lives in `lib/config/` so the page (`apps/web/src/pages/index.astro`) can
 * spread it onto `<ServicesSection {...SERVICES_SECTION_CONTENT} />` without
 * the component itself needing to know the marketing copy or the image
 * imports. Keeping it hardcoded is consistent with `HERO_BANNER_CONTENT`,
 * `PANEL_HOME_CONTENT` and `SOLUTION_SECTION_CONTENT`: as the site is SSG,
 * any change requires a rebuild anyway.
 *
 * The images are the four service photos delivered by the client into
 * `apps/web/src/assets/img/`: `edificios.jpg` (JPEG), `medidores-de-agua.webp`
 * (WebP), `planta-tratamiento.webp` (WebP) and `osmosis-inversa.jpg` (JPEG).
 * `astro:assets` + `sharp` re-encodes them to optimized WebP/AVIF variants at
 * build time, so mixing formats needs no special handling (design.md
 * § Decision 16).
 *
 * The future change `contentful-from-cms` will replace this with content
 * injected via props without touching the component (same migration path as
 * `HERO_BANNER_CONTENT` and `PANEL_HOME_CONTENT`).
 *
 * See `openspec/changes/services-section/design.md` § Decisions for the
 * rationale: Decision 2 (three-file architecture), Decision 4 (no eyebrow /
 * no underline), Decision 7 (mobile-first horizontal cards), Decision 8
 * (full-color images, POST-APPLY UPDATE — grayscale removed), Decisions 9/10
 * (design-system solid CTAs; "Ver detalles" per-card label, POST-APPLY
 * UPDATE — Sub-decision 9a superseded).
 */

/**
 * The 4 service cards in render order.
 *
 * Images follow the `image-assets` convention (frontend-standards § "Imágenes
 * del sitio"): every optimizable site image lives in `assets/img/` and is
 * consumed via `astro:assets`. The `imageAlt` describes what the photo shows
 * (never repeats the card title). `href` is generic `/servicios` by design
 * (design.md § Trade-offs); per-service routes are future work (`slug` is
 * already part of the contract). `ctaLabel` ("Ver detalles") is the per-card
 * CTA text, distinct from the bottom CTA label "Ver todos los servicios"
 * (POST-APPLY UPDATE, design.md § Decision 9).
 */
export const SERVICES_DATA: readonly Service[] = [
  {
    slug: 'medicion-en-edificios',
    title: 'Medición en Edificios',
    description:
      'Instalación y recambio de medidores de agua caliente en comunidades.',
    image: edificiosImg,
    imageAlt: 'Edificios residenciales con instalación de medidores de agua',
    href: '/servicios',
    ctaLabel: 'Ver detalles',
  },
  {
    slug: 'medicion-industrial',
    title: 'Medición Industrial',
    description:
      'Instalación y puesta en marcha de sistemas de medición de caudal.',
    image: medidoresImg,
    imageAlt: 'Medidores de agua instalados en infraestructura industrial',
    href: '/servicios',
    ctaLabel: 'Ver detalles',
  },
  {
    slug: 'obras-y-proyectos',
    title: 'Obras y Proyectos',
    description:
      'Desarrollo de infraestructura para sistemas de medición y control.',
    image: obrasImg,
    imageAlt: 'Planta de tratamiento de agua en operación',
    href: '/servicios',
    ctaLabel: 'Ver detalles',
  },
  {
    slug: 'tratamiento-de-agua',
    title: 'Tratamiento de Agua y Desalinización',
    description:
      'Diseño y optimización de plantas de tratamiento con tecnología de vanguardia.',
    image: osmosisImg,
    imageAlt: 'Sistema de osmosis inversa para tratamiento y desalinización de agua',
    href: '/servicios',
    ctaLabel: 'Ver detalles',
  },
];

/**
 * Full props bag for `ServicesSection.astro`: header copy + 4 cards + CTA.
 * Spread onto `<ServicesSection {...SERVICES_SECTION_CONTENT} />` by the page.
 */
export const SERVICES_SECTION_CONTENT: Readonly<ServicesSectionProps> = {
  headline: 'Servicios especializados',
  description:
    'Soluciones técnicas para instalación, mantenimiento y optimización de sistemas de medición y tratamiento de agua, con respaldo profesional y experiencia en terreno.',
  services: SERVICES_DATA,
  cta: {
    label: 'Ver todos los servicios',
    href: '/servicios',
  },
};