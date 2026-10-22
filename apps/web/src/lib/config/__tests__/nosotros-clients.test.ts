import { describe, it, expect } from 'vitest';
import {
  CLIENT_LOGOS,
  CLIENTS_CAROUSEL_DURATION_SECONDS,
} from '@/lib/config/nosotros-clients';

describe('CLIENT_LOGOS', () => {
  it('exposes exactly 41 client logos', () => {
    expect(CLIENT_LOGOS).toHaveLength(41);
  });

  it('is ordered alphabetically by company name (alt)', () => {
    const alts = CLIENT_LOGOS.map((logo) => logo.alt);
    const sorted = [...alts].sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' }),
    );
    expect(alts).toEqual(sorted);
  });

  it('exposes unique, non-empty alt texts', () => {
    const alts = CLIENT_LOGOS.map((logo) => logo.alt);
    expect(new Set(alts).size).toBe(CLIENT_LOGOS.length);
    for (const alt of alts) {
      expect(typeof alt).toBe('string');
      expect(alt.trim().length).toBeGreaterThan(0);
    }
  });

  it('imports every logo as an astro:assets ImageMetadata', () => {
    for (const logo of CLIENT_LOGOS) {
      expect(typeof logo.image.src).toBe('string');
      expect(logo.image.src.length).toBeGreaterThan(0);
      expect(logo.image.width).toBeGreaterThan(0);
      expect(logo.image.height).toBeGreaterThan(0);
    }
    expect(new Set(CLIENT_LOGOS.map((logo) => logo.image.src)).size).toBe(41);
  });

  it('uses the trimmed variants so logos fill the height at their real aspect ratio', () => {
    for (const logo of CLIENT_LOGOS) {
      expect(logo.image.src).toContain('/src/assets/img/slider/trimmed/');
    }
    const andina = CLIENT_LOGOS.find((logo) => logo.alt === 'Andina');
    if (!andina) throw new Error('Andina logo is missing from the config');
    // The delivered canvas is square (400x400); the trimmed logo is wide (295x50).
    expect(andina.image.width / andina.image.height).toBeGreaterThan(4);
  });
});

describe('CLIENTS_CAROUSEL_DURATION_SECONDS', () => {
  it('is 120 seconds per full cycle', () => {
    expect(CLIENTS_CAROUSEL_DURATION_SECONDS).toBe(120);
  });
});
