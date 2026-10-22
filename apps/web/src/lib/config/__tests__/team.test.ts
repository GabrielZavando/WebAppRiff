import { describe, it, expect } from 'vitest';
import {
  TEAM_MEMBERS,
  FEATURED_TEAM_MEMBERS,
} from '@/lib/config/team';

interface ExpectedMember {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly description: string;
  readonly imageFile: string;
  readonly isFeatured: boolean;
}

const EXPECTED_MEMBERS: readonly ExpectedMember[] = [
  {
    id: 'ruby-barrientos',
    name: 'Ruby Barrientos',
    role: 'Directora · Gerenta Comercial',
    description:
      'A cargo de la estrategia comercial y el desarrollo de RIFF, orientando el crecimiento, las relaciones estratégicas y la generación de nuevas oportunidades de negocio.',
    imageFile: 'ruby-barrientos.jpg',
    isFeatured: true,
  },
  {
    id: 'felipe-roman',
    name: 'Felipe Román',
    role: 'Gerente de Operaciones',
    description:
      'A cargo de la gestión operativa, coordinando procesos, recursos y proyectos para asegurar una ejecución eficiente y el cumplimiento de los compromisos con nuestros clientes.',
    imageFile: 'felipe-roman.jpg',
    isFeatured: true,
  },
  {
    id: 'patricio-barrientos',
    name: 'Patricio Barrientos',
    role: 'Ingeniero Químico · Asesor Técnico',
    description:
      'Referente técnico en tratamiento de agua y procesos industriales, aportando experiencia y conocimiento especializado en el análisis y desarrollo de soluciones para aplicaciones de distinta complejidad.',
    imageFile: 'patricio-barrientos.jpg',
    isFeatured: true,
  },
  {
    id: 'francisco-mehech',
    name: 'Francisco Mehech',
    role: 'Coordinador de Servicios y Logística',
    description:
      'Coordina la gestión de servicios en terreno y los procesos logísticos asociados, articulando requerimientos, recursos y entregas para dar respuesta a las necesidades de cada proyecto.',
    imageFile: 'francisco-mehech.jpg',
    isFeatured: false,
  },
  {
    id: 'eric-perez',
    name: 'Eric Pérez',
    role: 'Responsable de Ingeniería y Puesta en Marcha',
    description:
      'Referente del área de ingeniería en terreno, instalación, instrumentación y puesta en marcha de equipos y sistemas, apoyando además el diagnóstico y resolución de requerimientos técnicos de mayor complejidad.',
    imageFile: 'eric-perez.jpg',
    isFeatured: false,
  },
  {
    id: 'loredana-quiroga',
    name: 'Loredana Quiroga',
    role: 'Líder de Ventas Técnicas y Licitaciones',
    description:
      'A cargo de la gestión de ventas técnicas y oportunidades provenientes de licitaciones y portales, coordinando propuestas y requerimientos para diferentes aplicaciones y sectores industriales.',
    imageFile: 'loredana-quiroga.jpg',
    isFeatured: false,
  },
  {
    id: 'francys-padra',
    name: 'Francys Padra',
    role: 'Responsable de Desarrollo Comercial',
    description:
      'Orienta la gestión y desarrollo de oportunidades comerciales, fortaleciendo la relación con clientes y conectando sus requerimientos con el portafolio de productos y servicios de RIFF.',
    imageFile: 'francys-padra.jpg',
    isFeatured: false,
  },
  {
    id: 'melany-bravo',
    name: 'Melany Bravo',
    role: 'Coordinadora de Gestión Interna',
    description:
      'Coordina procesos administrativos y de soporte interno, facilitando la gestión documental y la articulación entre las distintas áreas de la organización.',
    imageFile: 'melany-bravo.jpg',
    isFeatured: false,
  },
];

describe('TEAM_MEMBERS — canonical roster', () => {
  it('contains exactly the eight members in canonical order', () => {
    expect(TEAM_MEMBERS).toHaveLength(8);
    expect(TEAM_MEMBERS.map((member) => member.id)).toEqual(
      EXPECTED_MEMBERS.map((member) => member.id),
    );
    expect(TEAM_MEMBERS.map((member) => member.name)).toEqual(
      EXPECTED_MEMBERS.map((member) => member.name),
    );
    expect(TEAM_MEMBERS.map((member) => member.role)).toEqual(
      EXPECTED_MEMBERS.map((member) => member.role),
    );
  });

  it('uses the exact client copy for every description', () => {
    expect(TEAM_MEMBERS.map((member) => member.description)).toEqual(
      EXPECTED_MEMBERS.map((member) => member.description),
    );
  });

  it('has unique ids', () => {
    const ids = TEAM_MEMBERS.map((member) => member.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('maps each member to the expected local 3:4 portrait', () => {
    TEAM_MEMBERS.forEach((member, index) => {
      const expected = EXPECTED_MEMBERS[index];
      if (!expected) throw new Error(`missing expected member at ${index}`);

      expect(member.image.src).toContain(
        `src/assets/img/nosotros/${expected.imageFile}`,
      );
      expect(member.image.format).toBe('jpg');
      expect(member.image.width).toBe(900);
      expect(member.image.height).toBe(1200);
      expect(member.image.src).not.toMatch(/^https?:\/\//);
    });
  });

  it('exposes non-empty descriptive alt text distinct from the name', () => {
    for (const member of TEAM_MEMBERS) {
      expect(member.imageAlt.length).toBeGreaterThan(0);
      expect(member.imageAlt).not.toBe(member.name);
    }
  });

  it('marks exactly the expected three members as featured', () => {
    expect(TEAM_MEMBERS.map((member) => member.isFeatured)).toEqual(
      EXPECTED_MEMBERS.map((member) => member.isFeatured),
    );
  });
});

describe('FEATURED_TEAM_MEMBERS — home selection', () => {
  it('contains exactly Ruby, Felipe and Patricio, in canonical order', () => {
    expect(FEATURED_TEAM_MEMBERS.map((member) => member.name)).toEqual([
      'Ruby Barrientos',
      'Felipe Román',
      'Patricio Barrientos',
    ]);
  });

  it('is derived from TEAM_MEMBERS by the isFeatured flag', () => {
    expect(FEATURED_TEAM_MEMBERS).toEqual(
      TEAM_MEMBERS.filter((member) => member.isFeatured),
    );
    expect(FEATURED_TEAM_MEMBERS.every((member) => member.isFeatured)).toBe(
      true,
    );
    expect(FEATURED_TEAM_MEMBERS).toHaveLength(3);
  });
});
