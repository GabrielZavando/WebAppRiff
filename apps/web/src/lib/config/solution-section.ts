import type { SolutionSectionProps } from '@/lib/types/solution-section';
import type { Solution } from '@/lib/types/solution-section';
import medicionImg from '@/assets/img/medicion-fluidos.webp';
import aguaImg from '@/assets/img/tratamiento-agua.webp';
import quimicosImg from '@/assets/img/productos-quimicos.webp';
import controlImg from '@/assets/img/control-accesorios.webp';

/**
 * Hardcoded content for the home page "solutions portfolio" section.
 *
 * Lives in `lib/config/` so the page (`apps/web/src/pages/index.astro`) can
 * spread it onto `<SolutionSection {...SOLUTION_SECTION_CONTENT} />` without
 * the component itself needing to know the marketing copy or the image
 * imports. Keeping it hardcoded is consistent with `HERO_BANNER_CONTENT`,
 * `PANEL_HOME_CONTENT`, `NAVIGATION_ITEMS` and the search-form categories
 * (sourced from the backend at build time): as the site is SSG, any change
 * requires a rebuild anyway.
 *
 * The images are real-catalog photos delivered by the client (POST-APPLY
 * UPDATE on 2026-08-09): `medicion-fluidos.webp`, `tratamiento-agua.webp`,
 * `productos-quimicos.webp`, `control-accesorios.webp` (1920x1080 WebP). The
 * pipeline `astro:assets` regenerates the optimized variants (400w/800w) on
 * each build and the layout `aspect-[4/3] object-cover` frames any source
 * ratio — no component change was required, only the four imports above.
 * The earlier generated placeholders `solucion-*.webp` were removed.
 *
 * The future change `contentful-from-cms` will replace this with content
 * injected via props without touching the component (same migration path as
 * `HERO_BANNER_CONTENT` and `PANEL_HOME_CONTENT`).
 *
 * See `openspec/changes/solution-section/design.md` § Decisions for the
 * rationale: Decision 1 (dumb component), Decision 10 (two separate exports),
 * Decision 11 (SolutionIconName closed union).
 */

/**
 * The 4 portfolio cards in render order.
 *
 * Images follow the `image-assets` convention (frontend-standards § "Imágenes
 * del sitio"): every optimizable site image lives in `assets/img/` and is
 * consumed via `astro:assets`. The `imageAlt` describes what the photo shows
 * (never repeats the card title). `href` is generic `/soluciones` by design
 * (design.md § Trade-offs); per-solution routes are future work.
 */
export const SOLUTIONS_DATA: readonly Solution[] = [
  {
    slug: 'medicion-de-fluidos',
    title: 'Medición de Fluidos',
    description:
      'Equipos y soluciones para medir caudal con precisión, optimizando el control y la eficiencia de sus procesos.',
    image: medicionImg,
    imageAlt: 'Equipos de medición de fluidos en planta industrial',
    icon: 'gauge',
    href: '/soluciones',
  },
  {
    slug: 'tratamiento-de-agua',
    title: 'Tratamiento de Agua',
    description:
      'Sistemas integrales de tratamiento de agua para garantizar la calidad del recurso en aplicaciones industriales.',
    image: aguaImg,
    imageAlt: 'Sistema de tratamiento de agua industrial',
    icon: 'droplet',
    href: '/soluciones',
  },
  {
    slug: 'productos-quimicos',
    title: 'Productos Químicos',
    description:
      'Dosificación y manejo de productos químicos con precisión, maximizando seguridad y resultados en su operación.',
    image: quimicosImg,
    imageAlt: 'Estantería de productos químicos industriales',
    icon: 'flask-conical',
    href: '/soluciones',
  },
  {
    slug: 'control-y-accesorios',
    title: 'Control y Accesorios',
    description:
      'Válvulas, accesorios y sistemas de control para una operación confiable y de alto rendimiento.',
    image: controlImg,
    imageAlt: 'Manifold de válvulas y manómetros de control industrial',
    icon: 'settings-2',
    href: '/soluciones',
  },
];

/**
 * Full props bag for `SolutionSection.astro`: header copy + the 4 cards.
 * Spread onto `<SolutionSection {...SOLUTION_SECTION_CONTENT} />` by the page.
 */
export const SOLUTION_SECTION_CONTENT: Readonly<SolutionSectionProps> = {
  eyebrow: 'PORTAFOLIO',
  headline: 'Nuestras Soluciones',
  description:
    'Sistemas integrales para el control preciso de fluidos y procesos químicos industriales.',
  solutions: SOLUTIONS_DATA,
};