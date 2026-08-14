import { describe, it, expect } from 'vitest';
import { SITE_CREDITS_CONTENT } from '@/lib/config/site-credits';
import type { SiteCreditsProps } from '@/lib/types/site-credits';

/**
 * Runtime tests for the SiteCredits content config.
 *
 * The type-level contract is asserted in
 * `lib/types/__tests__/site-credits.test.ts`; this suite validates the actual
 * runtime values of `SITE_CREDITS_CONTENT`.
 */
describe('SITE_CREDITS_CONTENT', () => {
  it('exposes the developer attribution label', () => {
    expect(SITE_CREDITS_CONTENT.developerLabel).toBe(
      'Diseñado y desarrollado por:',
    );
  });

  it('exposes the developer name', () => {
    expect(SITE_CREDITS_CONTENT.developerName).toBe('Gabriel Zavando');
  });

  it('exposes the developer URL as an absolute external link', () => {
    expect(SITE_CREDITS_CONTENT.developerUrl).toBe('https://gabrielzavando.cl');
  });

  it('is assignable to SiteCreditsProps (readonly contract)', () => {
    const props: SiteCreditsProps = SITE_CREDITS_CONTENT;
    expect(props).toEqual(SITE_CREDITS_CONTENT);
  });
});
