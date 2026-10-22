import { describe, it, expect, expectTypeOf } from 'vitest';
import type { ImageMetadata } from 'astro';
import type { TeamMember } from '@/lib/types/team';

describe('team.ts types', () => {
  it('exposes the shared readonly TeamMember contract', () => {
    const member: TeamMember = {
      id: 'ruby-barrientos',
      name: 'Ruby Barrientos',
      role: 'Directora · Gerenta Comercial',
      description: 'A cargo de la estrategia comercial y el desarrollo de RIFF.',
      image: {} as unknown as ImageMetadata,
      imageAlt: 'Retrato de Ruby Barrientos en una oficina corporativa.',
      isFeatured: true,
    };

    expect(member.id).toBe('ruby-barrientos');
    expect(member.isFeatured).toBe(true);

    expectTypeOf<TeamMember>().toEqualTypeOf<{
      readonly id: string;
      readonly name: string;
      readonly role: string;
      readonly description: string;
      readonly image: ImageMetadata;
      readonly imageAlt: string;
      readonly isFeatured: boolean;
    }>();
  });

  it('types role as a display string, not a slug union', () => {
    expectTypeOf<TeamMember['role']>().toEqualTypeOf<string>();
  });

  it('types isFeatured as a boolean', () => {
    expectTypeOf<TeamMember['isFeatured']>().toEqualTypeOf<boolean>();
  });

  it('rejects a member without the required description', () => {
    // @ts-expect-error — description is required by the shared contract.
    const invalid: TeamMember = {
      id: 'ruby-barrientos',
      name: 'Ruby Barrientos',
      role: 'Directora · Gerenta Comercial',
      image: {} as unknown as ImageMetadata,
      imageAlt: 'Retrato de Ruby Barrientos.',
      isFeatured: true,
    };

    expect(invalid.name).toBe('Ruby Barrientos');
  });
});
