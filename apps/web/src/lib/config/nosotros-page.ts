import type {
  NosotrosPageContent,
  NosotrosIconName,
} from '@/lib/types/nosotros-page';
import { getContactInfo } from '@/lib/config/contact';
import heroImg from '@/assets/img/medicion-fluidos.webp';
import stevenImg from '@/assets/img/f-1.jpg';
import laraImg from '@/assets/img/f-2.jpg';
import johnImg from '@/assets/img/f-3.jpg';
import felipeImg from '@/assets/img/control-accesorios.webp';

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

  /* Sección 2 — Línea de tiempo, ancla #historia (SC-203) */
  timeline: {
    eyebrow: 'Cronología y Legado',
    title: 'Nuestra Historia — De una Tradición Familiar a la Excelencia Industrial',
    description:
      'Un recorrido continuo fundado en la rigurosidad científica, el servicio directo y la capacidad de anticipar los desafíos de gestión de fluidos en Chile.',
    milestones: [
      {
        year: '1979',
        badge: 'AÑO 1979',
        title: 'Fundación: Aguas Purificadas Ltda.',
        description:
          'Patricio Barrientos Morales funda la compañía pionera orientada al diseño y fabricación de los primeros sistemas industriales de purificación y filtración de aguas complejas en la zona central de Chile.',
        noteLabel: 'Hito Clave',
        noteText:
          'Inicio de la fabricación artesanal e industrial de sistemas para remoción físico-química y clarificación de aguas de pozo.',
        tone: 'primary',
      },
      {
        year: '2012',
        badge: 'AÑO 2012',
        title: 'Consolidación & Continuidad Familiar',
        description:
          'Incorporación de nuevas metodologías de servicio en terreno, preservando los valores de confiabilidad técnica familiar e impulsando la integración de normas de gestión metrológica.',
        noteLabel: 'Evolución Estratégica',
        noteText:
          'Alineamiento técnico ante el aumento sostenido del estrés hídrico industrial y la demanda de control de pérdidas.',
        tone: 'secondary',
      },
      {
        year: '2013',
        badge: 'AÑO 2013',
        title: 'Nace Aguapur Medición',
        description:
          'Ruby Barrientos Periale y Felipe Román Araya establecen formalmente la unidad de micromedición y macromedición de agua, profesionalizando la contrastación de instrumentos e ingeniería de fluidos.',
        noteLabel: 'Hito de Especialización',
        noteText:
          'Desarrollo del primer laboratorio móvil de contrastación volumétrica y pruebas hidrostáticas para proyectos comunitarios y sanitarios.',
        tone: 'primary',
      },
      {
        year: '2018',
        badge: 'AÑO 2018',
        title: 'Surgimiento de la Línea RIFF',
        description:
          'Creación de RIFF como marca técnica enfocada en flujometría de ultra-alta precisión, sistemas no invasivos para la gran minería e instrumentación para ambientes corrosivos.',
        noteLabel: 'Salto Tecnológico',
        noteText:
          'Adopción de telemetría IoT, flujómetros electromagnéticos y equipos Doppler ultrasónicos no invasivos para pulpa y relaves.',
        tone: 'accent',
      },
      {
        year: 'DICIEMBRE 2024',
        badge: 'DICIEMBRE 2024',
        title: 'Evolución Integral: RIFF SpA',
        description:
          'Consolidación definitiva de Aguapur Medición y su portafolio bajo una identidad corporativa unificada: RIFF SpA. Una sola entidad matriz con mayor solvencia técnica, stock permanente y soporte de clase mundial.',
        noteLabel: 'Capacidad Actual',
        noteText:
          'Operaciones coordinadas desde Santiago para todo el territorio nacional, cubriendo minería de cobre, plantas de desalación, plantas celulosas e infraestructura hídrica crítica.',
        tone: 'dark',
        highlight: 'RIFF SpA',
      },
    ],
  },

  /* Sección 3 — Propuesta de valor: 4 pilares + bento de sectores (SC-204) */
  value: {
    eyebrow: 'Diferenciación Operativa',
    title: 'Nuestra Propuesta de Valor',
    description:
      'Más de tres décadas acumuladas de know-how hidrométrico nos permiten abordar la ingeniería de fluidos no como una simple venta de suministros, sino como una alianza técnica de aseguramiento de continuidad operativa y certidumbre en datos de flujo.',
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

  /* Sección 5 — Equipo RIFF: 4 tarjetas (SC-206) */
  team: {
    eyebrow: 'Estructura de Liderazgo',
    title: 'Equipo RIFF — Liderazgo & Experiencia',
    subtitle:
      'Profesionales comprometidos con la precisión y el servicio técnico en terreno.',
    badgeText: '+100 años de experiencia combinada en terreno',
    badgeIcon: 'wrench' satisfies NosotrosIconName,
    members: [
      {
        name: 'Steven Marks',
        area: 'Dirección',
        areaTone: 'primary',
        role: 'Gerente General',
        description:
          'Liderazgo estratégico, gobernanza corporativa y expansión industrial. Enfocado en la solvencia operativa y alianzas de largo plazo con mandantes mineros.',
        footerLabel: 'Gestión Corporativa',
        footerIcon: 'badge' satisfies NosotrosIconName,
        image: stevenImg,
        imageAlt:
          'Professional executive portrait of Steven Marks, male general manager in high-end modern corporate attire, black and white cinematic photography with cool cyan ambient tones and confident expression',
      },
      {
        name: 'Lara Smith',
        area: 'Ingeniería',
        areaTone: 'primary',
        role: 'Jefe de Proyectos de Ingeniería',
        description:
          'Dirección técnica de obras hidráulicas complejas, cálculo de golpe de ariete, diseño de plantas modulares de osmosis y tratamiento de riles industriales.',
        footerLabel: 'Cálculo & Comisionamiento',
        footerIcon: 'drafting-compass' satisfies NosotrosIconName,
        image: laraImg,
        imageAlt:
          'Professional portrait of Lara Smith, female engineering project lead wearing industrial safety glasses and smart attire, high-contrast monochrome with industrial engineering background',
      },
      {
        name: 'John Doe',
        area: 'Comercial',
        areaTone: 'primary',
        role: 'Dirección Comercial y Representaciones',
        description:
          'Gestión de convenios exclusivos con fabricantes internacionales de instrumentación en Europa y Asia, y estructuración de soluciones para licitaciones B2B.',
        footerLabel: 'Alianzas Globales',
        footerIcon: 'globe' satisfies NosotrosIconName,
        image: johnImg,
        imageAlt:
          'Professional portrait of John Doe, technical commercial director in smart blazer with clipboard and tablet, clean studio lighting in black and white with subtle industrial gradient',
      },
      {
        name: 'Felipe Román',
        area: 'Operaciones',
        areaTone: 'accent',
        role: 'Gerencia de Operaciones y Medición',
        description:
          'Cofundador de la etapa técnica moderna. Responsable de la flota de laboratorios móviles, protocolos de calibración metrológica y aseguramiento de calidad en terreno.',
        footerLabel: 'Metrología & Faena',
        footerIcon: 'gauge' satisfies NosotrosIconName,
        image: felipeImg,
        imageAlt:
          'Professional portrait of Felipe Román, male operations and metrology manager in engineering field uniform holding precision instrumentation tools, serious and technically competent aesthetic',
      },
    ],
  },

  /* Sección 6 — Clientes + banner de cierre (SC-207) */
  clients: {
    eyebrow: 'CONFIANZA Y TRAYECTORIA',
    eyebrowIcon: 'handshake' satisfies NosotrosIconName,
    title: 'Quienes Han Confiado en Nosotros',
    description:
      'Empresas líderes en minería, saneamiento, agroindustria y construcción que respaldan nuestra calidad metrológica.',
    clients: [
      { name: 'ANGLO AMERICAN', subtitle: 'Minería' },
      { name: 'CODELCO', subtitle: 'División Andina / El Teniente' },
      { name: 'AGUAS ANDINAS', subtitle: 'Sanitaria' },
      { name: 'ESVAL', subtitle: 'Región de Valparaíso' },
      { name: 'NESTLÉ', subtitle: 'Plantas Productivas' },
      { name: 'CONCHA Y TORO', subtitle: 'Agroindustria' },
      { name: 'COLBÚN', subtitle: 'Energía' },
      { name: 'SALFACORP', subtitle: 'Edificación & Obras' },
    ],
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
