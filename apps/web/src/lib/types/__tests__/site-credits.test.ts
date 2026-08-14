import { describe, it, expectTypeOf, expect } from 'vitest';
import type { SiteCreditsProps } from '@/lib/types/site-credits';

/**
 * Type-level tests for the SiteCredits type contract.
 *
 * These interfaces are declarative (no runtime code emitted by `import type`),
 * so the contract verification happens at TypeScript compile time via
 * `npm run typecheck` (tsc). Vitest still executes them at runtime as a smoke
 * check that the import path resolves and a runtime value of the expected
 * shape can be constructed.
 */
describe('site-credits.ts types', () => {
  it('SiteCreditsProps exposes three readonly string fields', () => {
    const props: SiteCreditsProps = {
      developerLabel: 'Diseñado y desarrollado por:',
      developerName: 'Gabriel Zavando',
      developerUrl: 'https://gabrielzavando.cl',
    };

    expect(props.developerLabel).toBe('Diseñado y desarrollado por:');
    expect(props.developerName).toBe('Gabriel Zavando');
    expect(props.developerUrl).toBe('https://gabrielzavando.cl');

    expectTypeOf<SiteCreditsProps>().toEqualTypeOf<{
      readonly developerLabel: string;
      readonly developerName: string;
      readonly developerUrl: string;
    }>();
  });

  it('SiteCreditsProps requires all three fields (no partial)', () => {
    // A literal missing any field is NOT assignable — the contract requires
    // all three fields.
    expectTypeOf<{ developerLabel: string }>().not.toMatchTypeOf<SiteCreditsProps>();
    expectTypeOf<{ developerName: string }>().not.toMatchTypeOf<SiteCreditsProps>();
    expectTypeOf<{ developerUrl: string }>().not.toMatchTypeOf<SiteCreditsProps>();
  });
});
