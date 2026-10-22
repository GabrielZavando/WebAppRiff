import { describe, it, expect } from 'vitest';
import { NOSOTROS_TEAM_SECTION_CONTENT } from '@/lib/config/nosotros-team-section';
import { FEATURED_TEAM_MEMBERS } from '@/lib/config/team';

/**
 * Runtime tests for the home page "Liderazgo & Experiencia" content config.
 *
 * The section now consumes the shared roster (`team-roster`): its `members`
 * are exactly `FEATURED_TEAM_MEMBERS` (Ruby, Felipe and Patricio), with the
 * exact roles and descriptions from `src/lib/config/team.ts`.
 */
describe('NOSOTROS_TEAM_SECTION_CONTENT', () => {
  it('members is exactly the shared featured selection (3 members)', () => {
    expect(NOSOTROS_TEAM_SECTION_CONTENT.members).toBe(FEATURED_TEAM_MEMBERS);
    expect(NOSOTROS_TEAM_SECTION_CONTENT.members).toHaveLength(3);
  });

  it('header copy keeps the approved home section title and subtitle', () => {
    expect(NOSOTROS_TEAM_SECTION_CONTENT.headline).toBe(
      'Liderazgo & Experiencia',
    );
    expect(NOSOTROS_TEAM_SECTION_CONTENT.subtitle).toBe(
      'De una tradición familiar a la manufactura y servicios de clase mundial',
    );
    expect(NOSOTROS_TEAM_SECTION_CONTENT.eyebrow).toBe('Nuestro Equipo');
  });

  it('renders the three featured members in canonical order', () => {
    expect(
      NOSOTROS_TEAM_SECTION_CONTENT.members.map((member) => member.name),
    ).toEqual(['Ruby Barrientos', 'Felipe Román', 'Patricio Barrientos']);
  });

  it('uses the exact visible roles from the shared roster', () => {
    expect(
      NOSOTROS_TEAM_SECTION_CONTENT.members.map((member) => member.role),
    ).toEqual([
      'Directora · Gerenta Comercial',
      'Gerente de Operaciones',
      'Ingeniero Químico · Asesor Técnico',
    ]);
  });

  it('carries the exact descriptions and ids from the shared roster', () => {
    expect(
      NOSOTROS_TEAM_SECTION_CONTENT.members.map((member) => member.id),
    ).toEqual(['ruby-barrientos', 'felipe-roman', 'patricio-barrientos']);
    expect(
      NOSOTROS_TEAM_SECTION_CONTENT.members.map((member) => member.description),
    ).toEqual([
      'A cargo de la estrategia comercial y el desarrollo de RIFF, orientando el crecimiento, las relaciones estratégicas y la generación de nuevas oportunidades de negocio.',
      'A cargo de la gestión operativa, coordinando procesos, recursos y proyectos para asegurar una ejecución eficiente y el cumplimiento de los compromisos con nuestros clientes.',
      'Referente técnico en tratamiento de agua y procesos industriales, aportando experiencia y conocimiento especializado en el análisis y desarrollo de soluciones para aplicaciones de distinta complejidad.',
    ]);
  });

  it('every featured member is marked and uses the expected local portrait', () => {
    for (const member of NOSOTROS_TEAM_SECTION_CONTENT.members) {
      expect(member.isFeatured).toBe(true);
      expect(member.image.src).toContain('src/assets/img/nosotros/');
      expect(member.image.width).toBe(900);
      expect(member.image.height).toBe(1200);
      expect(member.imageAlt.length).toBeGreaterThan(0);
    }
  });

  it('no longer exposes the removed area/footer fields', () => {
    for (const member of NOSOTROS_TEAM_SECTION_CONTENT.members) {
      expect(member).not.toHaveProperty('area');
      expect(member).not.toHaveProperty('areaTone');
      expect(member).not.toHaveProperty('footerLabel');
      expect(member).not.toHaveProperty('footerIcon');
    }
  });

  it('no field exposes a price property (the section has no prices)', () => {
    expect(NOSOTROS_TEAM_SECTION_CONTENT).not.toHaveProperty('precio');
    expect(NOSOTROS_TEAM_SECTION_CONTENT).not.toHaveProperty('price');
  });
});
