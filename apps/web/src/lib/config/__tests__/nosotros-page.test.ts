import { describe, it, expect } from 'vitest';
import { NOSOTROS_PAGE_CONTENT } from '@/lib/config/nosotros-page';
import { CLIENT_LOGOS } from '@/lib/config/nosotros-clients';
import { getContactInfo } from '@/lib/config/contact';
import { TEAM_MEMBERS } from '@/lib/config/team';

/**
 * Behavioural contract for `NOSOTROS_PAGE_CONTENT` (change `nosotros-page`).
 *
 * These are the runtime assertions for the type contract declared in
 * `src/lib/types/nosotros-page.ts`: the config is where the approved copy of
 * `docs/design/components/nosotros/reference.html` lives (design.md D2), so
 * this file pins the verbatim copy (design.md D13), the closed icon set
 * (design.md D5), the local placeholder images (design.md D6) and the CTA /
 * phone rules (design.md D7 / spec SC-207, SC-208).
 */
const content = NOSOTROS_PAGE_CONTENT;

/** Every `href` stored anywhere in the content (CTAs and phone links). */
function collectHrefs(node: unknown, acc: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const item of node) collectHrefs(item, acc);
  } else if (node !== null && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'href' || key === 'phoneHref') {
        if (typeof value === 'string') acc.push(value);
      } else {
        collectHrefs(value, acc);
      }
    }
  }
  return acc;
}

/** Every `imageAlt` stored anywhere in the content. */
function collectAlts(node: unknown, acc: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const item of node) collectAlts(item, acc);
  } else if (node !== null && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'imageAlt' || key === 'alt') {
        if (typeof value === 'string') acc.push(value);
      } else {
        collectAlts(value, acc);
      }
    }
  }
  return acc;
}

/** Every `image` value stored anywhere in the content. */
function collectImages(node: unknown, acc: { src?: string }[] = []): { src?: string }[] {
  if (Array.isArray(node)) {
    for (const item of node) collectImages(item, acc);
  } else if (node !== null && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'image') {
        acc.push(value as { src?: string });
      } else {
        collectImages(value, acc);
      }
    }
  }
  return acc;
}

describe('NOSOTROS_PAGE_CONTENT — six sections (SC-109)', () => {
  it('exposes exactly the six section entries of the page', () => {
    expect(Object.keys(content)).toEqual([
      'hero',
      'timeline',
      'value',
      'identity',
      'team',
      'clients',
    ]);
  });
});

describe('hero copy and CTAs (SC-201, SC-202)', () => {
  it('hero header copy is verbatim from the reference', () => {
    expect(content.hero.eyebrow).toBe('IDENTIDAD & TRAYECTORIA CORPORATIVA');
    expect(content.hero.eyebrowIcon).toBe('badge-check');
    expect(content.hero.title).toBe('SOMOS RIFF');
    expect(content.hero.highlightedWord).toBe('RIFF');
    expect(content.hero.subtitle).toBe(
      'Más de 40 años innovando en la medición, control de fluidos y tratamiento de agua.',
    );
    expect(content.hero.description).toBe(
      'Especialistas chilenos en ingeniería aplicada para infraestructuras de alta exigencia: gran minería, plantas agroindustriales, redes sanitarias y complejos inmobiliarios. Integramos telemetría no invasiva, instrumentación calibrada de norma internacional y asistencia técnica de despliegue directo en faena.',
    );
  });

  it('hero renders exactly two CTAs: asesoría → /contacto and historia → #historia (SC-208)', () => {
    expect(content.hero.ctas).toHaveLength(2);
    expect(content.hero.ctas[0]).toMatchObject({
      label: 'SOLICITAR ASESORÍA TÉCNICA',
      href: '/contacto',
      icon: 'arrow-right',
    });
    expect(content.hero.ctas[1]).toMatchObject({
      label: 'CONOCER NUESTRA HISTORIA',
      href: '#historia',
      icon: 'book-open-text',
    });
  });

  it('hero image is a local placeholder with a non-empty descriptive alt (SC-202)', () => {
    const heroImage = content.hero.image;
    expect(heroImage.src).toContain('medicion-fluidos');
    expect(content.hero.imageAlt.length).toBeGreaterThan(0);
    expect(content.hero.imageCaptionLeft).toBe(
      'Ingeniería Hidráulica Certificada',
    );
    expect(content.hero.imageCaptionRight).toBe('Norma ISO 9001:2015');
  });
});

describe('timeline: four approved milestones with verbatim copy (SC-203, change web-content-and-ui-polish)', () => {
  it('section header copy is verbatim', () => {
    expect(content.timeline.eyebrow).toBe('Cronología y Legado');
    expect(content.timeline.title).toBe(
      'Nuestra Historia — De una Tradición Familiar a la Excelencia Industrial',
    );
    expect(content.timeline.description).toBe(
      'Un recorrido continuo fundado en la rigurosidad científica, el servicio directo y la capacidad de anticipar los desafíos de gestión de fluidos en Chile.',
    );
  });

  it('has exactly the 4 approved milestones in chronological order with their years, badges and tones', () => {
    expect(content.timeline.milestones).toHaveLength(4);
    expect(content.timeline.milestones.map((m) => m.year)).toEqual([
      '1979',
      '2013',
      '2018',
      'DICIEMBRE 2024',
    ]);
    expect(content.timeline.milestones.map((m) => m.badge)).toEqual([
      'AÑO 1979',
      'AÑO 2013',
      'AÑO 2018',
      'DICIEMBRE 2024',
    ]);
    expect(content.timeline.milestones.map((m) => m.tone)).toEqual([
      'primary',
      'primary',
      'accent',
      'dark',
    ]);
    // The 2012 milestone is gone from the approved narrative.
    const serialized = JSON.stringify(content.timeline.milestones);
    expect(serialized).not.toContain('Consolidación & Continuidad Familiar');
    expect(serialized).not.toContain('AÑO 2012');
  });

  it('milestone titles are the approved ones verbatim', () => {
    const titles = content.timeline.milestones.map((m) => m.title);
    expect(titles).toEqual([
      'Nuestro Origen',
      'Nace Aguapur Medición',
      'El Nacimiento de RIFF',
      'La Evolución hacia RIFF',
    ]);
  });

  it('milestone side notes are preserved for the surviving milestones', () => {
    const notes = content.timeline.milestones.map((m) => [
      m.noteLabel,
      m.noteText,
    ]);
    expect(notes).toEqual([
      [
        'Hito Clave',
        'Inicio de la fabricación artesanal e industrial de sistemas para remoción físico-química y clarificación de aguas de pozo.',
      ],
      [
        'Hito de Especialización',
        'Desarrollo del primer laboratorio móvil de contrastación volumétrica y pruebas hidrostáticas para proyectos comunitarios y sanitarios.',
      ],
      [
        'Salto Tecnológico',
        'Adopción de telemetría IoT, flujómetros electromagnéticos y equipos Doppler ultrasónicos no invasivos para pulpa y relaves.',
      ],
      [
        'Capacidad Actual',
        'Operaciones coordinadas desde Santiago para todo el territorio nacional, cubriendo minería de cobre, plantas de desalación, plantas celulosas e infraestructura hídrica crítica.',
      ],
    ]);
  });

  it('the 1979 body is the approved copy verbatim', () => {
    expect(content.timeline.milestones[0]?.description).toBe(
      'En 1979, comienza nuestra historia con la creación de Aguas Purificadas Ltda., fundada por el Sr. Patricio Barrientos Morales. Esta empresa nació con el propósito de desarrollar equipos para el tratamiento de agua. Con el tiempo, se posicionó como un actor clave en el mercado, ampliando su alcance para incluir la medición de flujos y el manejo del vapor, ofreciendo tanto servicios como productos especializados. Tras más de tres décadas de crecimiento, el legado continuó en 2012 con la siguiente generación: sus hijos, quienes establecieron empresas independientes que mantienen el mismo compromiso con la excelencia y el profesionalismo que caracterizó a su fundador.',
    );
    expect(content.timeline.milestones[0]).not.toHaveProperty('highlight');
  });

  it('the 2013 and 2018 bodies are the approved copy verbatim', () => {
    expect(content.timeline.milestones[1]?.description).toBe(
      'En 2013, Ruby Barrientos Periale, la única hija del Sr. Patricio Barrientos, junto a su esposo Felipe Román Araya, fundó Aguapur Medición. Desde su inicio, esta compañía se especializó en ofrecer soluciones industriales para la medición de todo tipo de fluidos y proyectos de tratamiento de agua. Con una visión clara y un enfoque en la calidad, Aguapur Medición logró consolidarse como una empresa confiable en la industria.',
    );
    expect(content.timeline.milestones[2]?.description).toBe(
      'En 2018, RIFF nace como una línea de negocio dentro de Aguapur Medición, enfocada en la fabricación y comercialización de flujómetros. Con el tiempo, esta marca fue ganando reconocimiento y ampliando su alcance, sentando las bases para convertirse en el eje central de nuestra oferta de soluciones.',
    );
    expect(content.timeline.milestones[1]).not.toHaveProperty('highlight');
    expect(content.timeline.milestones[2]).not.toHaveProperty('highlight');
  });

  it('the 2024 body is the approved copy verbatim, ends before the list and highlights "RIFF"', () => {
    const last = content.timeline.milestones[3];
    expect(last?.description).toBe(
      'En diciembre de 2024, damos un paso significativo en nuestra trayectoria con la transformación de Aguapur Medición en RIFF. Este cambio de nombre simboliza nuestra evolución, reflejando no solo nuestra amplia experiencia, sino también nuestro compromiso con la innovación y la mejora continua. Bajo la marca RIFF, continuaremos brindando soluciones de medición y control de fluidos de alta calidad, al tiempo que expandimos nuestra oferta para incluir:',
    );
    // The closing offer list renders as a two-item bullet list.
    expect(last?.items).toEqual([
      'Equipos y Suministros para Tratamiento de Agua.',
      'Desarrollo de Productos Químicos.',
    ]);
    // The relocated "En RIFF, contamos…" paragraph must not live in the
    // timeline (it moved to the value-proposition intro).
    expect(last?.description).not.toContain('En RIFF, contamos');
    expect(last?.description).not.toContain('más de 30 años');
    // The dark card keeps its <strong> accent on "RIFF" (the approved text
    // no longer contains the old "RIFF SpA" substring).
    expect(last?.highlight).toBe('RIFF');
  });
});

describe('value proposition: 4 pillars + 4 sectors (SC-204, renamed + relocated intro in web-content-and-ui-polish)', () => {
  it('section header copy and side note are verbatim', () => {
    expect(content.value.eyebrow).toBe('Diferenciación Operativa');
    expect(content.value.title).toBe('¿Qué nos define?');
    expect(content.value.description).toBe(
      'En RIFF, contamos con un equipo de profesionales con más de 30 años de experiencia en la industria. Esto nos permite ofrecer a nuestros clientes las mejores soluciones técnicas, respaldadas por equipos y materiales de empresas líderes globales, representadas en exclusiva por nosotros en Chile. Nuestra calidad nos ha permitido captar y mantener como clientes a una parte importante de las principales compañías industriales del país, incluidas las de los sectores minero, alimenticio y rural. Estas industrias se benefician constantemente de la durabilidad, eficiencia y calidad de los productos que suministramos, así como de nuestro servicio de postventa, que forma parte integral de nuestra propuesta de valor.',
    );
    // The previous intro was replaced by the relocated timeline paragraph.
    expect(content.value.description).not.toContain('Más de tres décadas');
    expect(content.value.sideNote).toBe(
      'Arquitectura de Procesos & Metrología Certificada',
    );
    expect(content.value.sectorsEyebrow).toBe('Campos de Acción');
    expect(content.value.sectorsTitle).toBe(
      'Presencia Sólida en Industrias Críticas',
    );
  });

  it('has exactly the 4 pillars with verbatim titles, Lucide icons in order and footnotes', () => {
    expect(content.value.pillars).toHaveLength(4);
    expect(content.value.pillars.map((p) => p.title)).toEqual([
      'Durabilidad Extrema',
      'Precisión Certificada',
      'Eficiencia Hídrica',
      'Servicio In-Situ',
    ]);
    expect(content.value.pillars.map((p) => p.icon)).toEqual([
      'cog',
      'sliders-horizontal',
      'droplet',
      'wrench',
    ]);
    expect(content.value.pillars.map((p) => p.iconTone)).toEqual([
      'primary',
      'primary',
      'primary',
      'accent',
    ]);
    expect(content.value.pillars.map((p) => p.note)).toEqual([
      'Vida útil prolongada en ciclos severos.',
      'Reportes e informes técnicos válidos ante la DGA y SMA.',
      'Optimización del recurso en cuencas con déficit.',
      'Respuesta prioritaria en paradas no programadas.',
    ]);
  });

  it('pillar descriptions are verbatim', () => {
    expect(content.value.pillars[0]?.description).toBe(
      'Componentes de fundición dúctil, aceros inoxidables especiales y revestimientos para soportar la abrasión minera y los químicos corrosivos del tratamiento de agua.',
    );
    expect(content.value.pillars[3]?.description).toBe(
      'Ingenieros de campo especializados que asisten el montaje, comisionamiento, contraste en línea y mantenimiento preventivo directo en faena.',
    );
  });

  it('has exactly the 4 sector cards with SECTOR 01..04, verbatim titles and Lucide icons', () => {
    expect(content.value.sectors).toHaveLength(4);
    expect(content.value.sectors.map((s) => s.label)).toEqual([
      'SECTOR 01',
      'SECTOR 02',
      'SECTOR 03',
      'SECTOR 04',
    ]);
    expect(content.value.sectors.map((s) => s.title)).toEqual([
      'Gran Minería & Pulpa',
      'Alimentos & Bebidas',
      'Redes Rurales (APR)',
      'Edificación & Inmobiliario',
    ]);
    expect(content.value.sectors.map((s) => s.icon)).toEqual([
      'mountain',
      'utensils',
      'users',
      'building',
    ]);
    expect(content.value.sectors[0]?.description).toBe(
      'Flujometría para concentrados, relaves espesados, agua desalada impulsada y líneas de alta presión en faenas de altura geográfica.',
    );
    expect(content.value.sectors[3]?.description).toBe(
      'Medición volumétrica y remarcadores para torres habitacionales, climatización hidrónica (HVAC) y control de agua caliente sanitaria.',
    );
  });
});

describe('mission & vision blocks (SC-205)', () => {
  it('misión block copy is verbatim', () => {
    const { mission } = content.identity;
    expect(mission.eyebrow).toBe('PRINCIPIO FUNDAMENTAL');
    expect(mission.eyebrowIcon).toBe('clipboard-list');
    expect(mission.title).toBe('MISIÓN');
    expect(mission.quote).toBe(
      '"Suministrar soluciones integrales para la medición de fluidos y el tratamiento de agua, tanto industrial como residencial, respaldadas por un servicio técnico de excelencia y tecnología de punta."',
    );
    expect(mission.description).toBe(
      'Trabajamos para que cada metro cúbico medido y cada proceso hídrico optimizado signifique para nuestros clientes mayor rentabilidad, reducción de mermas y estricto apego a las normativas medioambientales vigentes.',
    );
    expect(mission.noteIcon).toBe('shield-check');
    expect(mission.noteText).toBe(
      'Compromiso inquebrantable con la trazabilidad y la honestidad técnica.',
    );
  });

  it('visión block copy is verbatim', () => {
    const { vision } = content.identity;
    expect(vision.eyebrow).toBe('PROYECCIÓN DE FUTURO');
    expect(vision.eyebrowIcon).toBe('eye');
    expect(vision.title).toBe('VISIÓN');
    expect(vision.quote).toBe(
      '"Ser líderes en el suministro de equipos y tecnologías de medición y tratamiento de fluidos en Chile y la región, distinguiéndonos por la innovación permanente, la precisión absoluta y un firme compromiso con la sostenibilidad hídrica."',
    );
    expect(vision.description).toBe(
      'Aspiramos a consolidar la plataforma de instrumentación más confiable de la costa pacífico sur, integrando analítica predictiva, automatización hidrodinámica y soporte directo que establezca el nuevo estándar de la industria.',
    );
    expect(vision.noteIcon).toBe('leaf');
    expect(vision.noteText).toBe(
      'Sostenibilidad hídrica como pilar de ingeniería hacia 2030.',
    );
  });
});

describe('team grid: eight real leadership cards (SC-206)', () => {
  it('section header and accreditation badge are verbatim', () => {
    expect(content.team.eyebrow).toBe('Estructura de Liderazgo');
    expect(content.team.title).toBe('Equipo RIFF — Liderazgo & Experiencia');
    expect(content.team.subtitle).toBe(
      'Profesionales comprometidos con la precisión y el servicio técnico en terreno.',
    );
    expect(content.team.badgeText).toBe(
      '+100 años de experiencia combinada en terreno',
    );
    expect(content.team.badgeIcon).toBe('wrench');
  });

  it('members is exactly the shared 8-member roster in canonical order', () => {
    expect(content.team.members).toBe(TEAM_MEMBERS);
    expect(content.team.members).toHaveLength(8);
    expect(content.team.members.map((m) => m.name)).toEqual([
      'Ruby Barrientos',
      'Felipe Román',
      'Patricio Barrientos',
      'Francisco Mehech',
      'Eric Pérez',
      'Loredana Quiroga',
      'Francys Padra',
      'Melany Bravo',
    ]);
    expect(content.team.members.map((m) => m.id)).toEqual([
      'ruby-barrientos',
      'felipe-roman',
      'patricio-barrientos',
      'francisco-mehech',
      'eric-perez',
      'loredana-quiroga',
      'francys-padra',
      'melany-bravo',
    ]);
  });

  it('renders the exact visible roles and descriptions from the roster', () => {
    expect(content.team.members.map((m) => m.role)).toEqual([
      'Directora · Gerenta Comercial',
      'Gerente de Operaciones',
      'Ingeniero Químico · Asesor Técnico',
      'Coordinador de Servicios y Logística',
      'Responsable de Ingeniería y Puesta en Marcha',
      'Líder de Ventas Técnicas y Licitaciones',
      'Responsable de Desarrollo Comercial',
      'Coordinadora de Gestión Interna',
    ]);
    expect(content.team.members[0]?.description).toBe(
      'A cargo de la estrategia comercial y el desarrollo de RIFF, orientando el crecimiento, las relaciones estratégicas y la generación de nuevas oportunidades de negocio.',
    );
    expect(content.team.members[7]?.description).toBe(
      'Coordina procesos administrativos y de soporte interno, facilitando la gestión documental y la articulación entre las distintas áreas de la organización.',
    );
    for (const member of content.team.members) {
      expect(member.description.length).toBeGreaterThan(0);
    }
  });

  it('no longer exposes the removed area and footer fields', () => {
    for (const member of content.team.members) {
      expect(member).not.toHaveProperty('area');
      expect(member).not.toHaveProperty('areaTone');
      expect(member).not.toHaveProperty('footerLabel');
      expect(member).not.toHaveProperty('footerIcon');
    }
  });

  it('portraits are the real 900x1200 local assets with descriptive alts', () => {
    for (const member of content.team.members) {
      expect(member.image.src).toContain('/src/assets/img/nosotros/');
      expect(member.image.width).toBe(900);
      expect(member.image.height).toBe(1200);
      expect(member.imageAlt.length).toBeGreaterThan(0);
    }
  });
});

describe('clients carousel and closing CTA (SC-207)', () => {
  it('section header copy is verbatim', () => {
    expect(content.clients.eyebrow).toBe('CONFIANZA Y TRAYECTORIA');
    expect(content.clients.eyebrowIcon).toBe('handshake');
    expect(content.clients.title).toBe('Quienes Han Confiado en Nosotros');
    expect(content.clients.description).toBe(
      'Empresas líderes en minería, saneamiento, agroindustria y construcción que respaldan nuestra calidad metrológica.',
    );
  });

  it('exposes the 41 client logos sourced from the shared config', () => {
    expect(content.clients.logos).toBe(CLIENT_LOGOS);
    expect(content.clients.logos).toHaveLength(41);
    for (const logo of content.clients.logos) {
      expect(logo.alt.length).toBeGreaterThan(0);
      expect(logo.image.src).toContain('/src/assets/img/slider/');
    }
  });

  it('closing banner copy is verbatim and its CTA points to /contacto', () => {
    const { cta } = content.clients;
    expect(cta.eyebrow).toBe('Resolución Técnica Inmediata');
    expect(cta.title).toBe(
      '¿Listo para optimizar la medición y el flujo de su operación?',
    );
    expect(cta.description).toBe(
      'Nuestros ingenieros de aplicaciones evalúan su proyecto en menos de 24 horas hábiles.',
    );
    expect(cta.primaryCta.label).toBe('SOLICITAR ASESORÍA TÉCNICA');
    expect(cta.primaryCta.href).toBe('/contacto');
    expect(cta.primaryCta.icon).toBe('arrow-right');
  });

  it('phone display and tel: href come from getContactInfo() (single source, D7)', () => {
    const contact = getContactInfo();
    const { cta } = content.clients;
    expect(cta.phone).toBe(contact.phone);
    expect(cta.phone).toBe('+56 2 29079067');
    expect(cta.phoneHref).toBe('tel:+56229079067');
    expect(cta.phoneIcon).toBe('phone');
  });
});

describe('cross-cutting invariants (SC-208, SC-209, SC-210)', () => {
  it('no stored href is "#contacto" — advisory CTAs use the real /contacto route', () => {
    const hrefs = collectHrefs(content);
    expect(hrefs).not.toContain('#contacto');
    expect(hrefs).toContain('/contacto');
    expect(hrefs).toContain('#historia');
    expect(hrefs).toContain('tel:+56229079067');
  });

  it('every image is a local placeholder (no external URL) with a non-empty alt', () => {
    const images = collectImages(content);
    expect(images.length).toBe(50); // hero + 8 portraits + 41 client logos
    for (const image of images) {
      expect(image.src).not.toMatch(/^https?:\/\//);
      expect(image.src).toContain('/src/assets/img/');
    }
    const alts = collectAlts(content);
    expect(alts.length).toBe(50);
    for (const alt of alts) {
      expect(alt.length).toBeGreaterThan(0);
    }
  });

  it('every icon stored in the config is a member of the closed NosotrosIconName union', () => {
    const validIcons = [
      'badge-check',
      'arrow-right',
      'book-open-text',
      'cog',
      'sliders-horizontal',
      'droplet',
      'wrench',
      'mountain',
      'utensils',
      'users',
      'building',
      'clipboard-list',
      'eye',
      'shield-check',
      'leaf',
      'badge',
      'drafting-compass',
      'globe',
      'gauge',
      'handshake',
      'phone',
      'star',
    ];
    const icons: string[] = [];
    collectIcons(content, icons);
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      expect(validIcons).toContain(icon);
    }
  });
});

/** Collects every `icon`/`eyebrowIcon`/`noteIcon`/`badgeIcon`/`phoneIcon` value. */
function collectIcons(node: unknown, acc: string[]): void {
  if (Array.isArray(node)) {
    for (const item of node) collectIcons(item, acc);
  } else if (node !== null && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key.endsWith('Icon')) {
        if (typeof value === 'string') acc.push(value);
      } else {
        collectIcons(value, acc);
      }
    }
  }
}
