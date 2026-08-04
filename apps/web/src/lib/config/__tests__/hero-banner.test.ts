import { describe, it, expect } from 'vitest';
import {
  HERO_BANNER_CONTENT,
  splitHeadline,
} from '@/lib/config/hero-banner';

describe('splitHeadline', () => {
  it('splits on highlighted word in the middle (task 1.4)', () => {
    expect(splitHeadline('Innovación que Fluye', 'Fluye')).toEqual([
      'Innovación que ',
      '',
    ]);
  });

  it('splits when highlighted word is at the start (task 1.5)', () => {
    expect(splitHeadline('Fluye con nosotros', 'Fluye')).toEqual([
      '',
      ' con nosotros',
    ]);
  });

  it('splits when highlighted word is in the middle with trailing text (task 1.6)', () => {
    expect(splitHeadline('Innovación que Fluye hoy', 'Fluye')).toEqual([
      'Innovación que ',
      ' hoy',
    ]);
  });

  it('returns the headline untouched when word is absent (task 1.7)', () => {
    expect(splitHeadline('Bienvenido', 'Fluye')).toEqual(['Bienvenido', '']);
  });

  it('only splits on the first occurrence (task 1.8)', () => {
    expect(splitHeadline('Fluye y vuelve a Fluye', 'Fluye')).toEqual([
      '',
      ' y vuelve a Fluye',
    ]);
  });

  it('returns the headline untouched when highlightedWord is empty (task 1.9)', () => {
    expect(splitHeadline('Innovación que Fluye', '')).toEqual([
      'Innovación que Fluye',
      '',
    ]);
  });
});

describe('HERO_BANNER_CONTENT', () => {
  it('headline contains highlightedWord as substring (task 1.10)', () => {
    expect(HERO_BANNER_CONTENT.headline).toContain(
      HERO_BANNER_CONTENT.highlightedWord,
    );
  });

  it('ctas has length 2 with primary first and secondary second (task 1.11)', () => {
    expect(HERO_BANNER_CONTENT.ctas).toHaveLength(2);

    // `noUncheckedIndexedAccess: true` narrows indexed access to `T | undefined`.
    // Assert length first then access via index; type guard via non-null assertion
    // would also work but explicit indexing keeps the intent clearer.
    const { ctas } = HERO_BANNER_CONTENT;
    const primary = ctas[0];
    const secondary = ctas[1];
    expect(primary?.variant).toBe('primary');
    expect(primary?.label).toBe('VER SERVICIOS');
    expect(primary?.href).toBe('/servicios');

    expect(secondary?.variant).toBe('secondary');
    expect(secondary?.label).toBe('ESCRÍBENOS');
    expect(secondary?.href).toBe('/contacto');
  });

  it('subtitle and description are non-empty strings (task 1.12)', () => {
    expect(typeof HERO_BANNER_CONTENT.subtitle).toBe('string');
    expect(HERO_BANNER_CONTENT.subtitle.length).toBeGreaterThan(0);

    expect(typeof HERO_BANNER_CONTENT.description).toBe('string');
    expect(HERO_BANNER_CONTENT.description.length).toBeGreaterThan(0);
  });
});
