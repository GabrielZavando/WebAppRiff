import { describe, it, expectTypeOf, expect } from 'vitest';
import type {
  NosotrosIconName,
  NosotrosCta,
  TimelineCardTone,
  TimelineMilestone,
  PillarIconTone,
  ValuePillar,
  SectorCard,
  TeamAreaTone,
  TeamMember,
  ClientCard,
  NosotrosHeroProps,
  NosotrosTimelineProps,
  NosotrosValuePropProps,
  IdentityBlock,
  NosotrosIdentityProps,
  NosotrosTeamGridProps,
  NosotrosClientsProps,
  NosotrosPageContent,
} from '@/lib/types/nosotros-page';

/**
 * Type-level tests for the nosotros-page type contract (change nosotros-page,
 * design.md D2/D5/D6).
 *
 * These interfaces are purely declarative (no runtime code is emitted by
 * `import type`), so the actual contract verification happens at TypeScript
 * compile time via `npm run typecheck` (tsc) — if the module path or any of
 * the referenced interfaces do not exist, typecheck fails.
 *
 * Vitest still executes these tests at runtime so we get a smoke check that:
 *   1. the import path resolves,
 *   2. a runtime value of the expected shape can be constructed (proving the
 *      field names exist and accept the right kinds of values).
 *
 * The deeper behavioural assertions (verbatim copy, 5 milestones, 4 pillars,
 * 4 sectors, 4 members, 8 clients, CTAs to /contacto, non-empty alts) live in
 * `lib/config/__tests__/nosotros-page.test.ts` against `NOSOTROS_PAGE_CONTENT`,
 * which is the runtime carrier of the contract.
 *
 * `NosotrosIconName` is a closed union, NOT a free `string` (same rationale as
 * `PilarIconName`/`SolutionIconName`): a typo like 'bulding' breaks at compile
 * time instead of rendering an empty icon at runtime. Every member was verified
 * against the installed `@iconify-json/lucide` (task 1.3; `building` is the
 * documented fallback for Material's `apartment`, design.md D5).
 */
describe('nosotros-page.ts types', () => {
  it('NosotrosIconName is a closed union of the verified Lucide names', () => {
    expectTypeOf<NosotrosIconName>().toEqualTypeOf<
      | 'badge-check'
      | 'arrow-right'
      | 'book-open-text'
      | 'cog'
      | 'sliders-horizontal'
      | 'droplet'
      | 'wrench'
      | 'mountain'
      | 'utensils'
      | 'users'
      | 'building'
      | 'clipboard-list'
      | 'eye'
      | 'shield-check'
      | 'leaf'
      | 'badge'
      | 'drafting-compass'
      | 'globe'
      | 'gauge'
      | 'handshake'
      | 'phone'
      | 'star'
    >();

    // Every member is assignable (proves the union isn't over-restricted).
    const icon: NosotrosIconName = 'badge-check';
    expect(icon).toBe('badge-check');
  });

  it('NosotrosIconName rejects an arbitrary string (closed union, design.md D5)', () => {
    // @ts-expect-error — 'bulding' is a typo: the closed union must reject it
    // at compile time instead of rendering an empty icon at runtime.
    const invalid: NosotrosIconName = 'bulding';
    expect(invalid).toBe('bulding');
  });

  it('NosotrosCta exposes readonly label, href and icon', () => {
    const cta: NosotrosCta = {
      label: 'SOLICITAR ASESORÍA TÉCNICA',
      href: '/contacto',
      icon: 'arrow-right',
    };
    expect(cta.href).toBe('/contacto');

    expectTypeOf<NosotrosCta>().toEqualTypeOf<{
      readonly label: string;
      readonly href: string;
      readonly icon: NosotrosIconName;
    }>();
  });

  it('TimelineMilestone exposes the readonly milestone contract', () => {
    const milestone: TimelineMilestone = {
      year: '1979',
      badge: 'AÑO 1979',
      title: 'Fundación: Aguas Purificadas Ltda.',
      description: 'Patricio Barrientos Morales funda la compañía pionera.',
      noteLabel: 'Hito Clave',
      noteText: 'Inicio de la fabricación.',
      tone: 'primary',
    };
    expect(milestone.tone).toBe('primary');
    expectTypeOf(milestone.tone).toEqualTypeOf<TimelineCardTone>();

    // `highlight` is optional and only used to wrap a substring in <strong>.
    expect(milestone).not.toHaveProperty('highlight');
    expectTypeOf(milestone.highlight).toEqualTypeOf<string | undefined>();
  });

  it('ValuePillar exposes readonly title, description, note, icon and tone', () => {
    const pillar: ValuePillar = {
      title: 'Durabilidad Extrema',
      description: 'Componentes de fundición dúctil.',
      note: 'Vida útil prolongada.',
      icon: 'cog',
      iconTone: 'primary',
    };
    expect(pillar.iconTone).toBe('primary');
    expectTypeOf(pillar.iconTone).toEqualTypeOf<PillarIconTone>();
  });

  it('SectorCard exposes readonly label, title, description and icon', () => {
    const sector: SectorCard = {
      label: 'SECTOR 01',
      title: 'Gran Minería & Pulpa',
      description: 'Flujometría para concentrados.',
      icon: 'mountain',
    };
    expect(sector.label).toBe('SECTOR 01');
    expectTypeOf<SectorCard>().toEqualTypeOf<{
      readonly label: string;
      readonly title: string;
      readonly description: string;
      readonly icon: NosotrosIconName;
    }>();
  });

  it('TeamMember exposes the readonly card contract', () => {
    const member: TeamMember = {
      name: 'Steven Marks',
      area: 'Dirección',
      areaTone: 'primary',
      role: 'Gerente General',
      description: 'Liderazgo estratégico.',
      footerLabel: 'Gestión Corporativa',
      footerIcon: 'badge',
      image: {} as unknown as TeamMember['image'],
      imageAlt: 'Retrato de Steven Marks',
    };
    expect(member.areaTone).toBe('primary');
    expectTypeOf(member.areaTone).toEqualTypeOf<TeamAreaTone>();
  });

  it('ClientCard exposes readonly name and subtitle', () => {
    const client: ClientCard = {
      name: 'ANGLO AMERICAN',
      subtitle: 'Minería',
    };
    expect(client.name).toBe('ANGLO AMERICAN');
    expectTypeOf<ClientCard>().toEqualTypeOf<{
      readonly name: string;
      readonly subtitle: string;
    }>();
  });

  it('IdentityBlock exposes the readonly misión/visión contract', () => {
    const block: IdentityBlock = {
      eyebrow: 'PRINCIPIO FUNDAMENTAL',
      eyebrowIcon: 'clipboard-list',
      title: 'MISIÓN',
      quote: 'Suministrar soluciones integrales.',
      description: 'Trabajamos para que cada metro cúbico.',
      noteIcon: 'shield-check',
      noteText: 'Compromiso inquebrantable.',
    };
    expect(block.eyebrowIcon).toBe('clipboard-list');
    expectTypeOf<IdentityBlock>().toEqualTypeOf<{
      readonly eyebrow: string;
      readonly eyebrowIcon: NosotrosIconName;
      readonly title: string;
      readonly quote: string;
      readonly description: string;
      readonly noteIcon: NosotrosIconName;
      readonly noteText: string;
    }>();
  });

  it('NosotrosHeroProps exposes the readonly hero contract', () => {
    const hero: NosotrosHeroProps = {
      eyebrow: 'IDENTIDAD & TRAYECTORIA CORPORATIVA',
      eyebrowIcon: 'badge-check',
      title: 'SOMOS RIFF',
      highlightedWord: 'RIFF',
      subtitle: 'Más de 40 años innovando.',
      description: 'Especialistas chilenos.',
      ctas: [
        { label: 'SOLICITAR ASESORÍA TÉCNICA', href: '/contacto', icon: 'arrow-right' },
      ],
      image: {} as unknown as NosotrosHeroProps['image'],
      imageAlt: 'Técnico inspeccionando un flujómetro.',
      imageCaptionLeft: 'Ingeniería Hidráulica Certificada',
      imageCaptionRight: 'Norma ISO 9001:2015',
    };
    expect(hero.ctas).toHaveLength(1);
    expectTypeOf<NosotrosHeroProps['image']>().toEqualTypeOf<
      NosotrosTeamGridProps['members'][number]['image']
    >();
  });

  it('NosotrosTimelineProps exposes the readonly timeline contract', () => {
    const timeline: NosotrosTimelineProps = {
      eyebrow: 'Cronología y Legado',
      title: 'Nuestra Historia',
      description: 'Un recorrido continuo.',
      milestones: [],
    };
    expect(timeline.milestones).toEqual([]);
    expectTypeOf<NosotrosTimelineProps['milestones']>().toEqualTypeOf<
      readonly TimelineMilestone[]
    >();
  });

  it('NosotrosValuePropProps exposes the readonly value-prop contract', () => {
    const value: NosotrosValuePropProps = {
      eyebrow: 'Diferenciación Operativa',
      title: 'Nuestra Propuesta de Valor',
      description: 'Know-how hidrométrico.',
      sideNote: 'Arquitectura de Procesos & Metrología Certificada',
      pillars: [],
      sectorsEyebrow: 'Campos de Acción',
      sectorsTitle: 'Presencia Sólida en Industrias Críticas',
      sectors: [],
    };
    expect(value.pillars).toEqual([]);
    expect(value.sectors).toEqual([]);
  });

  it('NosotrosIdentityProps exposes the readonly mission + vision contract', () => {
    const identity: NosotrosIdentityProps = {
      mission: {
        eyebrow: 'PRINCIPIO FUNDAMENTAL',
        eyebrowIcon: 'clipboard-list',
        title: 'MISIÓN',
        quote: 'q',
        description: 'd',
        noteIcon: 'shield-check',
        noteText: 'n',
      },
      vision: {
        eyebrow: 'PROYECCIÓN DE FUTURO',
        eyebrowIcon: 'eye',
        title: 'VISIÓN',
        quote: 'q',
        description: 'd',
        noteIcon: 'leaf',
        noteText: 'n',
      },
    };
    expect(identity.mission.title).toBe('MISIÓN');
    expect(identity.vision.title).toBe('VISIÓN');
  });

  it('NosotrosTeamGridProps exposes the readonly team contract', () => {
    const team: NosotrosTeamGridProps = {
      eyebrow: 'Estructura de Liderazgo',
      title: 'Equipo RIFF — Liderazgo & Experiencia',
      subtitle: 'Profesionales comprometidos.',
      badgeText: '+100 años de experiencia combinada en terreno',
      badgeIcon: 'wrench',
      members: [],
    };
    expect(team.members).toEqual([]);
    expectTypeOf<NosotrosTeamGridProps['members']>().toEqualTypeOf<
      readonly TeamMember[]
    >();
  });

  it('NosotrosClientsProps exposes the readonly clients + closing CTA contract', () => {
    const clients: NosotrosClientsProps = {
      eyebrow: 'CONFIANZA Y TRAYECTORIA',
      eyebrowIcon: 'handshake',
      title: 'Quienes Han Confiado en Nosotros',
      description: 'Empresas líderes.',
      clients: [],
      cta: {
        eyebrow: 'Resolución Técnica Inmediata',
        title: '¿Listo para optimizar?',
        description: 'Nuestros ingenieros evalúan su proyecto.',
        primaryCta: {
          label: 'SOLICITAR ASESORÍA TÉCNICA',
          href: '/contacto',
          icon: 'arrow-right',
        },
        phone: '+56 2 29079067',
        phoneHref: 'tel:+56229079067',
        phoneIcon: 'phone',
      },
    };
    expect(clients.cta.primaryCta.href).toBe('/contacto');
    expect(clients.cta.phoneHref).toBe('tel:+56229079067');
  });

  it('NosotrosPageContent exposes the full readonly six-section contract', () => {
    const content: NosotrosPageContent = {
      hero: {} as unknown as NosotrosPageContent['hero'],
      timeline: {} as unknown as NosotrosPageContent['timeline'],
      value: {} as unknown as NosotrosPageContent['value'],
      identity: {} as unknown as NosotrosPageContent['identity'],
      team: {} as unknown as NosotrosPageContent['team'],
      clients: {} as unknown as NosotrosPageContent['clients'],
    };
    expect(Object.keys(content)).toEqual([
      'hero',
      'timeline',
      'value',
      'identity',
      'team',
      'clients',
    ]);
  });

  it('all array fields are readonly arrays', () => {
    expectTypeOf<NosotrosPageContent['timeline']['milestones']>().toEqualTypeOf<
      readonly TimelineMilestone[]
    >();
    expectTypeOf<NosotrosPageContent['value']['pillars']>().toEqualTypeOf<
      readonly ValuePillar[]
    >();
    expectTypeOf<NosotrosPageContent['value']['sectors']>().toEqualTypeOf<
      readonly SectorCard[]
    >();
    expectTypeOf<NosotrosPageContent['team']['members']>().toEqualTypeOf<
      readonly TeamMember[]
    >();
    expectTypeOf<NosotrosPageContent['clients']['clients']>().toEqualTypeOf<
      readonly ClientCard[]
    >();
  });
});
