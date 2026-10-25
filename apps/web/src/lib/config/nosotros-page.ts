import type {
  NosotrosPageContent,
  NosotrosIconName,
} from '@/lib/types/nosotros-page';
import { getContactInfo } from '@/lib/config/contact';
import { CLIENT_LOGOS } from '@/lib/config/nosotros-clients';
import { TEAM_MEMBERS } from '@/lib/config/team';
import heroImg from '@/assets/img/medicion-fluidos.webp';

/**
 * SSG configuration for the public about page (`/nosotros`) — single source
 * of truth for all six sections (design.md § Decision 2): hero, timeline,
 * value proposition, mission & vision, team grid and clients + closing CTA.
 *
 * The page spreads this onto the six dumb components; the components never
 * hardcode copy, icons or images, so a copy tweak is a config-only change.
 * The site is SSG, so any change requires a rebuild (same rationale as
 * `contact-page.ts`, `services-page.ts`, `pilares-section.ts`, …).
 *
 * Copy is **verbatim** from the approved reference
 * `docs/design/components/nosotros/reference.html` (design.md § Decision 13):
 * the only adjustments are `#contacto` → `/contacto` (§ Decision 7), the
 * phone resolved from `getContactInfo()` (§ Decision 7), the `★` glyph →
 * `lucide:star` (§ Decision 5) and external `src` → local placeholders
 * (§ Decision 6). Icons are members of the closed `NosotrosIconName` union,
 * each verified against the installed `@iconify-json/lucide` (§ Decision 5).
 *
 * See `openspec/changes/nosotros-page/design.md` for the full rationale.
 */

/**
 * The canonical site phone (single source: `getContactInfo()`, same as
 * TopHeader/ContactBar/Footer) as a `tel:` href — `"+56 2 29079067"` →
 * `tel:+56229079067`. Trivial derivation resolved here so the component
 * stays dumb (design.md § Decision 2/7).
 */
function getPhoneHref(): string {
  const { phone } = getContactInfo();
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

const contact = getContactInfo();

/**
 * Full props bag for `apps/web/src/pages/nosotros.astro`, composed as
 * `<NosotrosHero {...NOSOTROS_PAGE_CONTENT.hero} />`, etc.
 */
export const NOSOTROS_PAGE_CONTENT: Readonly<NosotrosPageContent> = {
  /* Sección 1 — Hero institucional (SC-201, SC-202) */
  hero: {
    eyebrow: 'IDENTIDAD & TRAYECTORIA CORPORATIVA',
    eyebrowIcon: 'badge-check' satisfies NosotrosIconName,
    title: 'SOMOS RIFF',
    highlightedWord: 'RIFF',
    subtitle:
      'Más de 40 años innovando en la medición, control de fluidos y tratamiento de agua.',
    description:
      'Especialistas chilenos en ingeniería aplicada para infraestructuras de alta exigencia: gran minería, plantas agroindustriales, redes sanitarias y complejos inmobiliarios. Integramos telemetría no invasiva, instrumentación calibrada de norma internacional y asistencia técnica de despliegue directo en faena.',
    ctas: [
      {
        label: 'SOLICITAR ASESORÍA TÉCNICA',
        href: '/contacto',
        icon: 'arrow-right' satisfies NosotrosIconName,
      },
      {
        label: 'CONOCER NUESTRA HISTORIA',
        href: '#historia',
        icon: 'book-open-text' satisfies NosotrosIconName,
      },
    ],
    image: heroImg,
    imageAlt:
      'Industrial flow control engineering technician in high-visibility jacket inspecting a heavy-duty flanged water flowmeter and valve station inside a high-tech Chilean plant, cool teal highlights and clean industrial lighting',
    imageCaptionLeft: 'Ingeniería Hidráulica Certificada',
    imageCaptionRight: 'Norma ISO 9001:2015',
  },

  /* Sección 2 — Línea de tiempo, ancla #historia (SC-203).
   * Milestones replaced in change `web-content-and-ui-polish` (2026-10-24)
   * with the client-approved narrative: 4 milestones (1979, 2013, 2018,
   * Diciembre 2024) with verbatim copy. Card tones, badges, side notes and
   * the 2024 <strong> accent (now on "RIFF") are preserved. */
  timeline: {
    eyebrow: 'Cronología y Legado',
    title: 'Nuestra Historia — De una Tradición Familiar a la Excelencia Industrial',
    description:
      'Un recorrido continuo fundado en la rigurosidad científica, el servicio directo y la capacidad de anticipar los desafíos de gestión de fluidos en Chile.',
    milestones: [
      {
        year: '1979',
        badge: 'AÑO 1979',
        title: 'Nuestro Origen',
        description:
          'En 1979, comienza nuestra historia con la creación de Aguas Purificadas Ltda., fundada por el Sr. Patricio Barrientos Morales. Esta empresa nació con el propósito de desarrollar equipos para el tratamiento de agua. Con el tiempo, se posicionó como un actor clave en el mercado, ampliando su alcance para incluir la medición de flujos y el manejo del vapor, ofreciendo tanto servicios como productos especializados. Tras más de tres décadas de crecimiento, el legado continuó en 2012 con la siguiente generación: sus hijos, quienes establecieron empresas independientes que mantienen el mismo compromiso con la excelencia y el profesionalismo que caracterizó a su fundador.',
        noteLabel: 'Hito Clave',
        noteText:
          'Inicio de la fabricación artesanal e industrial de sistemas para remoción físico-química y clarificación de aguas de pozo.',
        tone: 'primary',
      },
      {
        year: '2013',
        badge: 'AÑO 2013',
        title: 'Nace Aguapur Medición',
        description:
          'En 2013, Ruby Barrientos Periale, la única hija del Sr. Patricio Barrientos, junto a su esposo Felipe Román Araya, fundó Aguapur Medición. Desde su inicio, esta compañía se especializó en ofrecer soluciones industriales para la medición de todo tipo de fluidos y proyectos de tratamiento de agua. Con una visión clara y un enfoque en la calidad, Aguapur Medición logró consolidarse como una empresa confiable en la industria.',
        noteLabel: 'Hito de Especialización',
        noteText:
          'Desarrollo del primer laboratorio móvil de contrastación volumétrica y pruebas hidrostáticas para proyectos comunitarios y sanitarios.',
        tone: 'primary',
      },
      {
        year: '2018',
        badge: 'AÑO 2018',
        title: 'El Nacimiento de RIFF',
        description:
          'En 2018, RIFF nace como una línea de negocio dentro de Aguapur Medición, enfocada en la fabricación y comercialización de flujómetros. Con el tiempo, esta marca fue ganando reconocimiento y ampliando su alcance, sentando las bases para convertirse en el eje central de nuestra oferta de soluciones.',
        noteLabel: 'Salto Tecnológico',
        noteText:
          'Adopción de telemetría IoT, flujómetros electromagnéticos y equipos Doppler ultrasónicos no invasivos para pulpa y relaves.',
        tone: 'accent',
      },
      {
        year: 'DICIEMBRE 2024',
        badge: 'DICIEMBRE 2024',
        title: 'La Evolución hacia RIFF',
        description:
          'En diciembre de 2024, damos un paso significativo en nuestra trayectoria con la transformación de Aguapur Medición en RIFF. Este cambio de nombre simboliza nuestra evolución, reflejando no solo nuestra amplia experiencia, sino también nuestro compromiso con la innovación y la mejora continua. Bajo la marca RIFF, continuaremos brindando soluciones de medición y control de fluidos de alta calidad, al tiempo que expandimos nuestra oferta para incluir:',
        items: [
          'Equipos y Suministros para Tratamiento de Agua.',
          'Desarrollo de Productos Químicos.',
        ],
        noteLabel: 'Capacidad Actual',
        noteText:
          'Operaciones coordinadas desde Santiago para todo el territorio nacional, cubriendo minería de cobre, plantas de desalación, plantas celulosas e infraestructura hídrica crítica.',
        tone: 'dark',
        highlight: 'RIFF',
      },
    ],
  },

  /* Sección 3 — Propuesta de valor: 4 pilares + bento de sectores (SC-204).
   * Renamed to "¿Qué nos define?" and its intro replaced by the paragraph
   * relocated from the timeline (client feedback, change
   * `web-content-and-ui-polish`, post-apply fix 2026-10-24). */
  value: {
    eyebrow: 'Diferenciación Operativa',
    title: '¿Qué nos define?',
    description:
      'En RIFF, contamos con un equipo de profesionales con más de 30 años de experiencia en la industria. Esto nos permite ofrecer a nuestros clientes las mejores soluciones técnicas, respaldadas por equipos y materiales de empresas líderes globales, representadas en exclusiva por nosotros en Chile. Nuestra calidad nos ha permitido captar y mantener como clientes a una parte importante de las principales compañías industriales del país, incluidas las de los sectores minero, alimenticio y rural. Estas industrias se benefician constantemente de la durabilidad, eficiencia y calidad de los productos que suministramos, así como de nuestro servicio de postventa, que forma parte integral de nuestra propuesta de valor.',
    sideNote: 'Arquitectura de Procesos & Metrología Certificada',
    pillars: [
      {
        title: 'Durabilidad Extrema',
        description:
          'Componentes de fundición dúctil, aceros inoxidables especiales y revestimientos para soportar la abrasión minera y los químicos corrosivos del tratamiento de agua.',
        note: 'Vida útil prolongada en ciclos severos.',
        icon: 'cog' satisfies NosotrosIconName,
        iconTone: 'primary',
      },
      {
        title: 'Precisión Certificada',
        description:
          'Instrumentación contrastada según tolerancias de metrología legal y estándares internacionales ISO / OIML, garantizando balances de masa fidedignos.',
        note: 'Reportes e informes técnicos válidos ante la DGA y SMA.',
        icon: 'sliders-horizontal' satisfies NosotrosIconName,
        iconTone: 'primary',
      },
      {
        title: 'Eficiencia Hídrica',
        description:
          'Integración de telemetría y monitoreo remoto para la detección inmediata de fugas, sobrepresiones y desviaciones de consumo en tiempo real.',
        note: 'Optimización del recurso en cuencas con déficit.',
        icon: 'droplet' satisfies NosotrosIconName,
        iconTone: 'primary',
      },
      {
        title: 'Servicio In-Situ',
        description:
          'Ingenieros de campo especializados que asisten el montaje, comisionamiento, contraste en línea y mantenimiento preventivo directo en faena.',
        note: 'Respuesta prioritaria en paradas no programadas.',
        icon: 'wrench' satisfies NosotrosIconName,
        iconTone: 'accent',
      },
    ],
    sectorsEyebrow: 'Campos de Acción',
    sectorsTitle: 'Presencia Sólida en Industrias Críticas',
    sectors: [
      {
        label: 'SECTOR 01',
        title: 'Gran Minería & Pulpa',
        description:
          'Flujometría para concentrados, relaves espesados, agua desalada impulsada y líneas de alta presión en faenas de altura geográfica.',
        icon: 'mountain' satisfies NosotrosIconName,
      },
      {
        label: 'SECTOR 02',
        title: 'Alimentos & Bebidas',
        description:
          'Dosificación higiénica, tratamiento de agua de proceso, CIP y cumplimiento estricto con estándares sanitarios para vitivinícola y lácteos.',
        icon: 'utensils' satisfies NosotrosIconName,
      },
      {
        label: 'SECTOR 03',
        title: 'Redes Rurales (APR)',
        description:
          'Modernización integral de comités de agua potable rural mediante macro y micromedición automatizada, cloración y telemetría por radio.',
        icon: 'users' satisfies NosotrosIconName,
      },
      {
        label: 'SECTOR 04',
        title: 'Edificación & Inmobiliario',
        description:
          'Medición volumétrica y remarcadores para torres habitacionales, climatización hidrónica (HVAC) y control de agua caliente sanitaria.',
        icon: 'building' satisfies NosotrosIconName,
      },
    ],
  },

  /* Sección 4 — Misión & Visión (SC-205) */
  identity: {
    mission: {
      eyebrow: 'PRINCIPIO FUNDAMENTAL',
      eyebrowIcon: 'clipboard-list' satisfies NosotrosIconName,
      title: 'MISIÓN',
      quote:
        '"Suministrar soluciones integrales para la medición de fluidos y el tratamiento de agua, tanto industrial como residencial, respaldadas por un servicio técnico de excelencia y tecnología de punta."',
      description:
        'Trabajamos para que cada metro cúbico medido y cada proceso hídrico optimizado signifique para nuestros clientes mayor rentabilidad, reducción de mermas y estricto apego a las normativas medioambientales vigentes.',
      noteIcon: 'shield-check' satisfies NosotrosIconName,
      noteText:
        'Compromiso inquebrantable con la trazabilidad y la honestidad técnica.',
    },
    vision: {
      eyebrow: 'PROYECCIÓN DE FUTURO',
      eyebrowIcon: 'eye' satisfies NosotrosIconName,
      title: 'VISIÓN',
      quote:
        '"Ser líderes en el suministro de equipos y tecnologías de medición y tratamiento de fluidos en Chile y la región, distinguiéndonos por la innovación permanente, la precisión absoluta y un firme compromiso con la sostenibilidad hídrica."',
      description:
        'Aspiramos a consolidar la plataforma de instrumentación más confiable de la costa pacífico sur, integrando analítica predictiva, automatización hidrodinámica y soporte directo que establezca el nuevo estándar de la industria.',
      noteIcon: 'leaf' satisfies NosotrosIconName,
      noteText:
        'Sostenibilidad hídrica como pilar de ingeniería hacia 2030.',
    },
  },

  /* Sección 5 — Equipo RIFF: 8 tarjetas (SC-206) */
  team: {
    eyebrow: 'Estructura de Liderazgo',
    title: 'Equipo RIFF — Liderazgo & Experiencia',
    subtitle:
      'Profesionales comprometidos con la precisión y el servicio técnico en terreno.',
    badgeText: '+100 años de experiencia combinada en terreno',
    badgeIcon: 'wrench' satisfies NosotrosIconName,
    members: TEAM_MEMBERS,
  },

  /* Sección 6 — Clientes + banner de cierre (SC-207) */
  clients: {
    eyebrow: 'CONFIANZA Y TRAYECTORIA',
    eyebrowIcon: 'handshake' satisfies NosotrosIconName,
    title: 'Quienes Han Confiado en Nosotros',
    description:
      'Empresas líderes en minería, saneamiento, agroindustria y construcción que respaldan nuestra calidad metrológica.',
    logos: CLIENT_LOGOS,
    cta: {
      eyebrow: 'Resolución Técnica Inmediata',
      title: '¿Listo para optimizar la medición y el flujo de su operación?',
      description:
        'Nuestros ingenieros de aplicaciones evalúan su proyecto en menos de 24 horas hábiles.',
      primaryCta: {
        label: 'SOLICITAR ASESORÍA TÉCNICA',
        href: '/contacto',
        icon: 'arrow-right' satisfies NosotrosIconName,
      },
      phone: contact.phone,
      phoneHref: getPhoneHref(),
      phoneIcon: 'phone' satisfies NosotrosIconName,
    },
  },
};
