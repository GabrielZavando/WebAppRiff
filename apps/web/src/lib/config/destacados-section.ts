import type { DestacadosSectionProps } from '@/lib/types/destacados-section';
import type { FeaturedProduct } from '@/lib/types/destacados-section';
import antiincrustanteImg from '@/assets/img/antiincrustante-Bimaks.png';
import flujometroImg from '@/assets/img/flujometro-multiproposito.webp';
import fullsonicImg from '@/assets/img/FULLSONIC-DOPPLER-CONTABLE.webp';
import mwnImg from '@/assets/img/MWN-DN50.webp';

/**
 * Hardcoded content for the home page "featured products" section.
 *
 * Lives in `lib/config/` so the page (`apps/web/src/pages/index.astro`) can
 * spread it onto `<DestacadosSection {...DESTACADOS_SECTION_CONTENT} />`
 * without the component itself needing to know the marketing copy or the
 * image imports. Keeping it hardcoded is consistent with
 * `SOLUTION_SECTION_CONTENT` and `SERVICES_SECTION_CONTENT`: as the site is
 * SSG, any change requires a rebuild anyway. A future CMS/API migration
 * (`contentful-from-cms`) will replace this with content injected via props
 * without touching the component (design.md § Decision 1/2).
 *
 * The images are the product photos delivered by the client (2026-08-09):
 * `antiincrustante-Bimaks.png` (400x400 PNG) and the three WebP product shots
 * (299x299). The pipeline `astro:assets` regenerates the optimized variants
 * on each build and the component's `object-contain` image mat frames any
 * source ratio.
 *
 * See `openspec/changes/destacados-section/design.md` for the rationale:
 * Decision 1 (dumb component), Decision 2 (hardcoded constant), Decision 3
 * (`FeaturedProduct` carries NO price fields — the client specified the
 * section shows no prices; the price contract arrives with the future catalog
 * API/CMS migration).
 */

/**
 * The 4 featured products in render order (client-specified, verbatim titles).
 *
 * Each `slug` is the future `/productos/{slug}` CTA target; `href`-style
 * detail routes are future work but the slug is already part of the contract
 * (design.md § Risks / Trade-offs).
 */
export const FEATURED_PRODUCTS: readonly FeaturedProduct[] = [
  {
    id: 'antiincrustante-bimaks-420',
    titulo: 'Antiincrustante Bimaks 420 para Ósmosis Inversa (Agua Salobre)',
    slug: 'antiincrustante-bimaks-420',
    imagen: antiincrustanteImg,
    imagenAlt: 'Bidón azul de antiincrustante Bimaks 420 para ósmosis inversa',
  },
  {
    id: 'flujometro-universal',
    titulo: 'Flujómetro Universal',
    slug: 'flujometro-universal',
    imagen: flujometroImg,
    imagenAlt: 'Flujómetro universal de alta precisión',
  },
  {
    id: 'medidor-ultrasonico-doppler-fullsonic',
    titulo: 'Medidor Ultrasónico Doppler Portátil Fullsonic (No Invasivo)',
    slug: 'medidor-ultrasonico-doppler-fullsonic',
    imagen: fullsonicImg,
    imagenAlt: 'Medidor ultrasónico Doppler portátil Fullsonic no invasivo',
  },
  {
    id: 'mwn-medidor-woltman-agua-fria',
    titulo:
      'MWN – MEDIDOR INDUSTRIAL PARA AGUA FRÍA LIMPIA – MEDIDOR TIPO WOLTMAN',
    slug: 'mwn-medidor-woltman-agua-fria',
    imagen: mwnImg,
    imagenAlt: 'Medidor industrial tipo Woltman MWN para agua fría limpia',
  },
];

/**
 * Full props bag for `DestacadosSection.astro`: header copy + the 4 cards.
 * Spread onto `<DestacadosSection {...DESTACADOS_SECTION_CONTENT} />` by the
 * page.
 */
export const DESTACADOS_SECTION_CONTENT: Readonly<DestacadosSectionProps> = {
  headline: 'Soluciones Destacadas',
  ctaText: 'EXPLORAR CATÁLOGO COMPLETO',
  ctaHref: '/productos',
  products: FEATURED_PRODUCTS,
};