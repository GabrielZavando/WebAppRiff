import type {
  ServicePageService,
  ServicesHeroProps,
  ServicesPageProps,
} from '@/lib/types/services-page';
import edificiosImg from '@/assets/img/edificios.jpg';
import medidoresImg from '@/assets/img/medidores-de-agua.webp';
import obrasImg from '@/assets/img/planta-tratamiento.webp';
import osmosisImg from '@/assets/img/osmosis-inversa.jpg';

/**
 * Hardcoded content for the public services page (`/servicios`).
 *
 * Lives in `lib/config/` so `apps/web/src/pages/servicios.astro` can spread it
 * onto `<ServicesHero {...SERVICIOS_PAGE_CONTENT.hero} />` and map the four
 * `<ServiceCard>` components without the components needing to know the copy or
 * the image imports. Keeping it hardcoded is consistent with every other
 * section config (`HERO_BANNER_CONTENT`, `CONTACT_PAGE_CONTENT`,
 * `SERVICES_SECTION_CONTENT`): as the site is SSG, any change requires a rebuild
 * anyway. The future change `contentful-from-cms` will replace these constants
 * with CMS-injected content without touching the components.
 *
 * Copy source: `docs/design/components/ServicesPage.png` (mockup delivered by
 * the client, 2026-08-18). The four services mirror the home `SERVICES_DATA`
 * set (same titles/images) but with the richer page-specific copy from the
 * mockup: sector labels, optional `intro` paragraph + `bullets` check-list on
 * cards 01-03, and `bullets` on card 04. `tags` (pills) is still supported by
 * the component but unused after card 03 migrated to bullets (design.md §5).
 *
 * Images follow the `image-assets` convention (frontend-standards § "Imágenes
 * del sitio"): every optimizable site image lives in `assets/img/` and is
 * consumed via `astro:assets`. `astro:assets` + `sharp` re-encode them to
 * optimized WebP/AVIF variants at build time.
 */

/**
 * Hero section content for the services page.
 *
 * "Precisión" is the highlighted substring, wrapped in `<span
 * class="text-accent">` by `ServicesHero.astro` via the shared `splitHeadline()`
 * helper (design.md § Decision 2).
 */
export const SERVICIOS_PAGE_HERO: Readonly<ServicesHeroProps> = {
  headline: 'Servicios Especializados en Precisión y Control',
  highlightedWord: 'Precisión',
  subtitle:
    'Soluciones técnicas integrales para la instalación, mantenimiento y optimización de sistemas de medición y tratamiento de fluidos. Respaldo por décadas de ingeniería y ejecución en terreno.',
};

/**
 * The four service cards in render order.
 *
 * `number` is the 1-based ordinal rendered as a two-digit badge ("01"…"04").
 * `intro` (optional) is the lead-in paragraph above the `bullets` check-list on
 * cards 01, 02 and 03. `bullets` (optional) render with a `lucide:check` icon on
 * all four cards. `tags` (optional) render as a pill row and remain supported by
 * the component, but no card uses them after card 03 migrated to bullets.
 */
export const SERVICIOS_PAGE_SERVICES: readonly ServicePageService[] = [
  {
    number: 1,
    sector: 'SECTOR RESIDENCIAL/COMERCIAL',
    title: 'Medición en Edificios',
    intro:
      'Optimizamos el consumo de agua en comunidades y edificios con la instalación y renovación de medidores de agua caliente. Nuestro servicio incluye:',
    image: edificiosImg,
    imageAlt: 'Edificios residenciales con instalación de medidores de agua',
    bullets: [
      'Reemplazo de medidores antiguos por modelos más eficientes y precisos.',
      'Instalación certificada, garantizando cumplimiento normativo y correcto funcionamiento.',
      'Diagnóstico y asesoría para optimizar la medición y facturación del consumo.',
      'Servicio rápido y sin interrupciones en el suministro.',
      'Contamos con miles de medidores reemplazados e instalaciones nuevas.',
      'Nuestros instaladores son profesionales con mucha experiencia, con la capacidad de entregar soluciones inmediatas frente a imprevistos.',
      'Soporte técnico para garantizar el correcto funcionamiento y lectura de los medidores.',
      'Atención postventa para resolver dudas y optimizar la medición del consumo.',
    ],
  },
  {
    number: 2,
    sector: 'SECTOR INDUSTRIAL',
    title: 'Medición Industrial',
    intro:
      'Ofrecemos soluciones especializadas para la medición de caudal en procesos industriales, asegurando eficiencia y control en cada etapa. Nuestro servicio abarca:',
    image: medidoresImg,
    imageAlt: 'Medidores de agua instalados en infraestructura industrial',
    bullets: [
      'Instalación de medidores de flujo para líquidos, gases y vapor.',
      'Configuración, calibración y puesta en marcha de equipos.',
      'Integración con sistemas de monitoreo y control en plantas industriales.',
      'Capacitación y soporte técnico para la correcta operación de los dispositivos.',
      'Profesionales en el área de obra, eléctrica y automatización.',
      'Servicio de soporte técnico para ajustes, calibraciones y resolución de problemas.',
      'Asesoría postventa.',
      'Capacitación para el personal encargado del monitoreo y control de los equipos.',
    ],
  },
  {
    number: 3,
    sector: 'INGENIERÍA & CONSTRUCCIÓN',
    title: 'Obras y Proyectos',
    intro:
      'Desarrollamos infraestructura para la instalación de sistemas de medición y tratamiento de agua, asegurando la máxima calidad y durabilidad. Nuestros servicios incluyen:',
    image: obrasImg,
    imageAlt: 'Planta de tratamiento de agua en operación',
    bullets: [
      'Construcción de cámaras de medición y obras complementarias.',
      'Adecuación de espacios para la instalación de equipos de control de fluidos.',
      'Instalación de redes hidráulicas y soporte estructural para medidores industriales.',
      'Ejecución de proyectos llave en mano con ingeniería especializada.',
    ],
  },
  {
    number: 4,
    sector: 'QUÍMICA & PROCESOS',
    title: 'Tratamiento de Agua y Desalinización',
    image: osmosisImg,
    imageAlt:
      'Sistema de osmosis inversa para tratamiento y desalinización de agua',
    bullets: [
      'Ósmosis Inversa: rechazo de sales >99%',
      'Dosificación automatizada de químicos',
      'Optimización energética de bajo consumo',
    ],
  },
];

/**
 * Full props bag for the services page, spread onto its components by
 * `apps/web/src/pages/servicios.astro`.
 */
export const SERVICIOS_PAGE_CONTENT: Readonly<ServicesPageProps> = {
  hero: SERVICIOS_PAGE_HERO,
  services: SERVICIOS_PAGE_SERVICES,
};
