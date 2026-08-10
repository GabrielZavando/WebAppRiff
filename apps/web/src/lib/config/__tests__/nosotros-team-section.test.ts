import { describe, it, expect } from 'vitest';
import {
  NOSOTROS_TEAM_SECTION_CONTENT,
  TEAM_MEMBERS,
  getTeamMemberRoleLabel,
} from '@/lib/config/nosotros-team-section';

/**
 * Runtime tests for the nosotros-team-section content config.
 *
 * The type-level contract is asserted in
 * `lib/types/__tests__/nosotros-team-section.test.ts`; this suite validates
 * the actual runtime carrier (`NOSOTROS_TEAM_SECTION_CONTENT`):
 * - exact copy (headline, corrected subtitle — the mockup typo "mundiaL"
 *   was fixed to "mundial" during planning),
 * - exactly 3 members in render order with the client-specified
 *   names/roles from `docs/design/components/NosotrosSection.png`,
 * - the three client-delivered photos (`f-1.jpg`, `f-2.jpg`, `f-3.jpg`)
 *   imported through the `@/assets/img/` alias with their real sharp-read
 *   dimensions,
 * - non-empty descriptive alts distinct from the names,
 * - the role→label helper used by the component to render the uppercase
 *   role text (design.md § Decision 4: the closed union stores the
 *   kebab-case role; a pure helper maps it to the display label).
 */
describe('NOSOTROS_TEAM_SECTION_CONTENT', () => {
  it('members has length exactly 3 (mockup shows 3 people)', () => {
    expect(NOSOTROS_TEAM_SECTION_CONTENT.members).toHaveLength(3);
  });

  it('header copy: headline and corrected subtitle (client-specified)', () => {
    expect(NOSOTROS_TEAM_SECTION_CONTENT.headline).toBe(
      'Liderazgo & Experiencia',
    );
    expect(NOSOTROS_TEAM_SECTION_CONTENT.subtitle).toBe(
      'De una tradición familiar a la manufactura y servicios de clase mundial',
    );
  });

  it('member names in render order are exactly the 3 mockup people', () => {
    const names = TEAM_MEMBERS.map((m) => m.name);
    expect(names).toEqual(['Steven Marks', 'Lara Smith', 'John Doe']);
  });

  it('member roles in render order are gerente-general, jefe-de-proyectos, comercial', () => {
    const roles = TEAM_MEMBERS.map((m) => m.role);
    expect(roles).toEqual([
      'gerente-general',
      'jefe-de-proyectos',
      'comercial',
    ]);
  });

  it('every member exposes a non-empty name, role and descriptive alt', () => {
    for (const member of TEAM_MEMBERS) {
      expect(typeof member.name).toBe('string');
      expect(member.name.length).toBeGreaterThan(0);
      expect(typeof member.role).toBe('string');
      expect(member.role.length).toBeGreaterThan(0);
      expect(typeof member.imageAlt).toBe('string');
      expect(member.imageAlt.length).toBeGreaterThan(0);
    }
  });

  it('member photos import the client-delivered assets with real dimensions', () => {
    // Files delivered by the client in the design package; dimensions read
    // with sharp (see design.md § Decisions 2/7).
    const expected: Array<[string, number, number]> = [
      ['f-1.jpg', 380, 502],
      ['f-2.jpg', 380, 499],
      ['f-3.jpg', 380, 502],
    ];
    TEAM_MEMBERS.forEach((member, index) => {
      const [filename, width, height] = expected[index] ?? [];
      if (!filename || !width || !height)
        throw new Error(`missing expectation for member ${index}`);
      expect(typeof member.image.src).toBe('string');
      expect(member.image.src).toContain(filename);
      expect(member.image.format).toBe('jpg');
      expect(member.image.width).toBe(width);
      expect(member.image.height).toBe(height);
    });
  });

  it('each imageAlt is different from its member name (describes the photo, not a label)', () => {
    for (const member of TEAM_MEMBERS) {
      expect(member.imageAlt).not.toBe(member.name);
    }
  });

  it('no field exposes a price property (the section has no prices)', () => {
    expect(NOSOTROS_TEAM_SECTION_CONTENT).not.toHaveProperty('precio');
    expect(NOSOTROS_TEAM_SECTION_CONTENT).not.toHaveProperty('price');
    expect(TEAM_MEMBERS[0]).not.toHaveProperty('precio');
  });
});

describe('getTeamMemberRoleLabel', () => {
  it('maps each closed-union role to the display label shown in the mockup', () => {
    expect(getTeamMemberRoleLabel('gerente-general')).toBe('Gerente General');
    expect(getTeamMemberRoleLabel('jefe-de-proyectos')).toBe(
      'Jefe de Proyectos',
    );
    expect(getTeamMemberRoleLabel('comercial')).toBe('Comercial');
  });
});