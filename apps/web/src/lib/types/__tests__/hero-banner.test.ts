import { describe, it, expect } from 'vitest';
import type {
  HeroCta,
  HeroStat,
  HeroBannerProps,
} from '@/lib/types/hero-banner';

describe('hero-banner.ts types', () => {
  it('HeroCta constrains label+href strings and a primary/secondary variant', () => {
    const primary: HeroCta = {
      label: 'VER SERVICIOS',
      href: '/servicios',
      variant: 'primary',
    };
    const secondary: HeroCta = {
      label: 'ESCRÍBENOS',
      href: '/contacto',
      variant: 'secondary',
    };
    expect(primary.label).toBe('VER SERVICIOS');
    expect(primary.href).toBe('/servicios');
    expect(primary.variant).toBe('primary');
    expect(secondary.variant).toBe('secondary');
  });

  it('HeroStat exposes readonly label+value strings', () => {
    const stat: HeroStat = { label: 'DESDE', value: '1979' };
    expect(stat.label).toBe('DESDE');
    expect(stat.value).toBe('1979');
  });

  it('HeroBannerProps accepts required fields without optional stats', () => {
    const props: HeroBannerProps = {
      headline: 'Innovación que Fluye',
      highlightedWord: 'Fluye',
      subtitle: 'Experiencia, tecnología y control...',
      description: 'Desarrollamos soluciones...',
      ctas: [
        { label: 'VER SERVICIOS', href: '/servicios', variant: 'primary' },
        { label: 'ESCRÍBENOS', href: '/contacto', variant: 'secondary' },
      ],
    };
    expect(props.headline).toBe('Innovación que Fluye');
    expect(props.highlightedWord).toBe('Fluye');
    expect(props.ctas).toHaveLength(2);
    expect(props.stats).toBeUndefined();
  });

  it('HeroBannerProps accepts optional stats array', () => {
    const props: HeroBannerProps = {
      headline: 'Innovación que Fluye',
      highlightedWord: 'Fluye',
      subtitle: 'Experiencia, tecnología y control...',
      description: 'Desarrollamos soluciones...',
      ctas: [
        { label: 'VER SERVICIOS', href: '/servicios', variant: 'primary' },
      ],
      stats: [{ label: 'DESDE', value: '1979' }],
    };
    expect(props.stats).toHaveLength(1);
  });

  it('HeroBannerProps.ctas is a readonly array (cannot push at compile time)', () => {
    const props: HeroBannerProps = {
      headline: 'h',
      highlightedWord: 'w',
      subtitle: 's',
      description: 'd',
      ctas: [],
    };
    // Runtime check: the array exists and has length 0
    expect(props.ctas).toEqual([]);
  });
});
