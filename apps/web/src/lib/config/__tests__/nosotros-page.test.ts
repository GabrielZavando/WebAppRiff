import { describe, it, expect } from 'vitest';
import { NOSOTROS_PAGE_CONTENT } from '@/lib/config/nosotros-page';
import { getContactInfo } from '@/lib/config/contact';

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

describe('timeline: five milestones with verbatim copy (SC-203)', () => {
  it('section header copy is verbatim', () => {
    expect(content.timeline.eyebrow).toBe('Cronología y Legado');
    expect(content.timeline.title).toBe(
      'Nuestra Historia — De una Tradición Familiar a la Excelencia Industrial',
    );
    expect(content.timeline.description).toBe(
      'Un recorrido continuo fundado en la rigurosidad científica, el servicio directo y la capacidad de anticipar los desafíos de gestión de fluidos en Chile.',
    );
  });

  it('has exactly the 5 milestones in chronological order with their years and badges', () => {
    expect(content.timeline.milestones).toHaveLength(5);
    expect(content.timeline.milestones.map((m) => m.year)).toEqual([
      '1979',
      '2012',
      '2013',
      '2018',
      'DICIEMBRE 2024',
    ]);
    expect(content.timeline.milestones.map((m) => m.badge)).toEqual([
      'AÑO 1979',
      'AÑO 2012',
      'AÑO 2013',
      'AÑO 2018',
      'DICIEMBRE 2024',
    ]);
    expect(content.timeline.milestones.map((m) => m.tone)).toEqual([
      'primary',
      'secondary',
      'primary',
      'accent',
      'dark',
    ]);
  });

  it('milestone titles are verbatim', () => {
    const titles = content.timeline.milestones.map((m) => m.title);
    expect(titles).toEqual([
      'Fundación: Aguas Purificadas Ltda.',
      'Consolidación & Continuidad Familiar',
      'Nace Aguapur Medición',
      'Surgimiento de la Línea RIFF',
      'Evolución Integral: RIFF SpA',
    ]);
  });

  it('milestone side notes are verbatim', () => {
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
        'Evolución Estratégica',
        'Alineamiento técnico ante el aumento sostenido del estrés hídrico industrial y la demanda de control de pérdidas.',
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

  it('first and last milestone bodies are verbatim; the 2024 one highlights "RIFF SpA"', () => {
    expect(content.timeline.milestones[0]?.description).toBe(
      'Patricio Barrientos Morales funda la compañía pionera orientada al diseño y fabricación de los primeros sistemas industriales de purificación y filtración de aguas complejas en la zona central de Chile.',
    );
    const last = content.timeline.milestones[4];
    expect(last?.description).toBe(
      'Consolidación definitiva de Aguapur Medición y su portafolio bajo una identidad corporativa unificada: RIFF SpA. Una sola entidad matriz con mayor solvencia técnica, stock permanente y soporte de clase mundial.',
    );
    expect(last?.highlight).toBe('RIFF SpA');
    expect(content.timeline.milestones[0]).not.toHaveProperty('highlight');
  });
});

describe('value proposition: 4 pillars + 4 sectors (SC-204)', () => {
  it('section header copy and side note are verbatim', () => {
    expect(content.value.eyebrow).toBe('Diferenciación Operativa');
    expect(content.value.title).toBe('Nuestra Propuesta de Valor');
    expect(content.value.description).toBe(
      'Más de tres décadas acumuladas de know-how hidrométrico nos permiten abordar la ingeniería de fluidos no como una simple venta de suministros, sino como una alianza técnica de aseguramiento de continuidad operativa y certidumbre en datos de flujo.',
    );
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

describe('team grid: four leadership cards (SC-206)', () => {
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

  it('has exactly the 4 members in order with verbatim names, roles and areas', () => {
    expect(content.team.members).toHaveLength(4);
    expect(content.team.members.map((m) => m.name)).toEqual([
      'Steven Marks',
      'Lara Smith',
      'John Doe',
      'Felipe Román',
    ]);
    expect(content.team.members.map((m) => m.role)).toEqual([
      'Gerente General',
      'Jefe de Proyectos de Ingeniería',
      'Dirección Comercial y Representaciones',
      'Gerencia de Operaciones y Medición',
    ]);
    expect(content.team.members.map((m) => m.area)).toEqual([
      'Dirección',
      'Ingeniería',
      'Comercial',
      'Operaciones',
    ]);
    expect(content.team.members.map((m) => m.areaTone)).toEqual([
      'primary',
      'primary',
      'primary',
      'accent',
    ]);
  });

  it('member descriptions and footer strips are verbatim with their Lucide icons', () => {
    const [steven, lara, john, felipe] = content.team.members;
    expect(steven?.description).toBe(
      'Liderazgo estratégico, gobernanza corporativa y expansión industrial. Enfocado en la solvencia operativa y alianzas de largo plazo con mandantes mineros.',
    );
    expect(lara?.description).toBe(
      'Dirección técnica de obras hidráulicas complejas, cálculo de golpe de ariete, diseño de plantas modulares de osmosis y tratamiento de riles industriales.',
    );
    expect(john?.description).toBe(
      'Gestión de convenios exclusivos con fabricantes internacionales de instrumentación en Europa y Asia, y estructuración de soluciones para licitaciones B2B.',
    );
    expect(felipe?.description).toBe(
      'Cofundador de la etapa técnica moderna. Responsable de la flota de laboratorios móviles, protocolos de calibración metrológica y aseguramiento de calidad en terreno.',
    );
    expect(content.team.members.map((m) => m.footerLabel)).toEqual([
      'Gestión Corporativa',
      'Cálculo & Comisionamiento',
      'Alianzas Globales',
      'Metrología & Faena',
    ]);
    expect(content.team.members.map((m) => m.footerIcon)).toEqual([
      'badge',
      'drafting-compass',
      'globe',
      'gauge',
    ]);
  });

  it('portraits are the local D6 placeholders with non-empty descriptive alts', () => {
    const images = content.team.members.map((m) => m.image.src);
    expect(images[0]).toContain('f-1');
    expect(images[1]).toContain('f-2');
    expect(images[2]).toContain('f-3');
    expect(images[3]).toContain('control-accesorios');
    for (const member of content.team.members) {
      expect(member.imageAlt.length).toBeGreaterThan(0);
    }
  });
});

describe('clients grid and closing CTA (SC-207)', () => {
  it('section header copy is verbatim', () => {
    expect(content.clients.eyebrow).toBe('CONFIANZA Y TRAYECTORIA');
    expect(content.clients.eyebrowIcon).toBe('handshake');
    expect(content.clients.title).toBe('Quienes Han Confiado en Nosotros');
    expect(content.clients.description).toBe(
      'Empresas líderes en minería, saneamiento, agroindustria y construcción que respaldan nuestra calidad metrológica.',
    );
  });

  it('has exactly the 8 clients in order with verbatim sector subtitles', () => {
    expect(content.clients.clients).toHaveLength(8);
    expect(
      content.clients.clients.map((c) => [c.name, c.subtitle]),
    ).toEqual([
      ['ANGLO AMERICAN', 'Minería'],
      ['CODELCO', 'División Andina / El Teniente'],
      ['AGUAS ANDINAS', 'Sanitaria'],
      ['ESVAL', 'Región de Valparaíso'],
      ['NESTLÉ', 'Plantas Productivas'],
      ['CONCHA Y TORO', 'Agroindustria'],
      ['COLBÚN', 'Energía'],
      ['SALFACORP', 'Edificación & Obras'],
    ]);
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
    expect(images.length).toBe(5); // hero + 4 portraits (D6)
    for (const image of images) {
      expect(image.src).not.toMatch(/^https?:\/\//);
      expect(image.src).toContain('/src/assets/img/');
    }
    const alts = collectAlts(content);
    expect(alts.length).toBe(5);
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
