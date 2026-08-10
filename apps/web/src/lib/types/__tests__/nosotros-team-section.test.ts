import { describe, it, expectTypeOf, expect } from 'vitest';
import type { ImageMetadata } from 'astro';
import type {
  TeamMemberRole,
  TeamMember,
  NosotrosTeamSectionProps,
} from '@/lib/types/nosotros-team-section';

/**
 * Type-level tests for the nosotros-team-section type contract.
 *
 * These interfaces are purely declarative (no runtime code is emitted by
 * `import type`), so the actual contract verification happens at TypeScript
 * compile time via `npm run typecheck` (tsc) — if the module path or any of
 * the referenced interfaces do not exist, typecheck fails.
 *
 * Vitest still executes these tests at runtime so we get a smoke check that:
 *   1. the import path resolves (esbuild fails if the file is missing when
 *      `expectTypeOf` materialises the type-level assertion),
 *   2. a runtime value of the expected shape can be constructed (proving the
 *      field names exist and accept the right kinds of values).
 *
 * The deeper behavioural assertions (exact copy, exactly 3 members with
 * names/roles in order, image imports from `f-1.jpg`/`f-2.jpg`/`f-3.jpg`,
 * non-empty descriptive alts) live in
 * `lib/config/__tests__/nosotros-team-section.test.ts` against
 * `NOSOTROS_TEAM_SECTION_CONTENT`, which is the runtime carrier of the
 * contract.
 *
 * See `design.md` § Decision 4 (`TeamMemberRole` is a closed union, NOT a
 * free `string`: a typo like `'comercial '` or `'gerente'` breaks at compile
 * time instead of rendering wrong role text at runtime — same rationale as
 * `PilarIconName`) and § Decision 1 (dumb component contract: all data
 * arrives via props).
 */
describe('nosotros-team-section.ts types', () => {
  it('TeamMemberRole is a closed union of the 3 project roles', () => {
    expectTypeOf<TeamMemberRole>().toEqualTypeOf<
      'gerente-general' | 'jefe-de-proyectos' | 'comercial'
    >();

    // Every member is assignable (proves the union isn't empty/over-restricted).
    const gerente: TeamMemberRole = 'gerente-general';
    const jefe: TeamMemberRole = 'jefe-de-proyectos';
    const comercial: TeamMemberRole = 'comercial';
    expect([gerente, jefe, comercial]).toEqual([
      'gerente-general',
      'jefe-de-proyectos',
      'comercial',
    ]);
  });

  it('TeamMember exposes readonly name, role, image (ImageMetadata) and imageAlt', () => {
    const member: TeamMember = {
      name: 'Steven Marks',
      role: 'gerente-general',
      image: {
        src: '/assets/img/f-1.jpg',
        width: 380,
        height: 502,
        format: 'jpg',
      } as unknown as ImageMetadata,
      imageAlt: 'Retrato de Steven Marks, Gerente General de Riff',
    };

    expect(member.name).toBe('Steven Marks');
    expect(member.role).toBe('gerente-general');
    expect(member.imageAlt).toContain('Steven Marks');
    expect(member.image.format).toBe('jpg');

    expectTypeOf<TeamMember>().toEqualTypeOf<{
      readonly name: string;
      readonly role: TeamMemberRole;
      readonly image: ImageMetadata;
      readonly imageAlt: string;
    }>();
  });

  it('NosotrosTeamSectionProps exposes the full readonly contract', () => {
    const props: NosotrosTeamSectionProps = {
      headline: 'Liderazgo & Experiencia',
      subtitle: 'De una tradición familiar a la manufactura y servicios de clase mundial',
      eyebrow: 'Nuestro Equipo',
      members: [
        {
          name: 'Steven Marks',
          role: 'gerente-general',
          image: {} as unknown as ImageMetadata,
          imageAlt: 'Retrato de Steven Marks',
        },
      ],
    };

    expect(props.headline).toBe('Liderazgo & Experiencia');
    expect(props.subtitle).toContain('tradición familiar');
    expect(props.eyebrow).toBe('Nuestro Equipo');
    expect(props.members).toHaveLength(1);
    expect(props.members[0]?.role).toBe('gerente-general');

    expectTypeOf<NosotrosTeamSectionProps>().toEqualTypeOf<{
      readonly headline: string;
      readonly subtitle: string;
      readonly eyebrow: string;
      readonly members: readonly TeamMember[];
    }>();
  });

  it('NosotrosTeamSectionProps.members is a readonly array', () => {
    const props: NosotrosTeamSectionProps = {
      headline: 'h',
      subtitle: 's',
      eyebrow: 'e',
      members: [],
    };
    expect(props.members).toEqual([]);
    expectTypeOf<NosotrosTeamSectionProps['members']>().toEqualTypeOf<
      readonly TeamMember[]
    >();
  });

  it('TeamMemberRole rejects an arbitrary string (closed union, design.md Decision 4)', () => {
    // @ts-expect-error — 'gerente-general ' (trailing space) is a typo: the
    // closed union must reject it at compile time instead of rendering wrong
    // role text at runtime.
    const invalid: TeamMemberRole = 'gerente-general ';
    expect(invalid).toBe('gerente-general ');
  });
});