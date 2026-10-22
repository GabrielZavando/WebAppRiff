import { describe, it, expect, expectTypeOf } from 'vitest';
import type { ImageMetadata } from 'astro';
import type { TeamMember } from '@/lib/types/team';
import type { NosotrosTeamSectionProps } from '@/lib/types/nosotros-team-section';

/**
 * Type-level tests for the home team section contract. The component now
 * consumes the shared `TeamMember` type from `team-roster`; `role` is the
 * exact display string and no closed slug union / translation helper exists.
 */
describe('nosotros-team-section.ts types', () => {
  it('uses the shared TeamMember contract for its members', () => {
    expectTypeOf<NosotrosTeamSectionProps['members']>().toEqualTypeOf<
      readonly TeamMember[]
    >();
  });

  it('exposes the full readonly props contract', () => {
    const props: NosotrosTeamSectionProps = {
      headline: 'Liderazgo & Experiencia',
      subtitle:
        'De una tradición familiar a la manufactura y servicios de clase mundial',
      eyebrow: 'Nuestro Equipo',
      members: [
        {
          id: 'ruby-barrientos',
          name: 'Ruby Barrientos',
          role: 'Directora · Gerenta Comercial',
          description:
            'A cargo de la estrategia comercial y el desarrollo de RIFF.',
          image: {} as unknown as ImageMetadata,
          imageAlt: 'Retrato de Ruby Barrientos en una oficina corporativa.',
          isFeatured: true,
        },
      ],
    };

    expect(props.members).toHaveLength(1);
    expect(props.members[0]?.role).toBe('Directora · Gerenta Comercial');

    expectTypeOf<NosotrosTeamSectionProps>().toEqualTypeOf<{
      readonly headline: string;
      readonly subtitle: string;
      readonly eyebrow: string;
      readonly members: readonly TeamMember[];
    }>();
  });

  it('members is a readonly array', () => {
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

  it('rejects a member without the shared contract fields', () => {
    // @ts-expect-error — the shared TeamMember requires id, description and isFeatured.
    const invalid: TeamMember = {
      name: 'Ruby Barrientos',
      role: 'Directora · Gerenta Comercial',
      image: {} as unknown as ImageMetadata,
      imageAlt: 'Retrato de Ruby Barrientos.',
    };

    expect(invalid.name).toBe('Ruby Barrientos');
  });
});
