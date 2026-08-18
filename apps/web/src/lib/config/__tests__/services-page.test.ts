import { describe, it, expect } from 'vitest';
import {
  SERVICIOS_PAGE_HERO,
  SERVICIOS_PAGE_SERVICES,
  SERVICIOS_PAGE_CONTENT,
} from '@/lib/config/services-page';

describe('SERVICIOS_PAGE_SERVICES', () => {
  it('has exactly four services with non-empty core fields and 1-based numbers', () => {
    expect(SERVICIOS_PAGE_SERVICES).toHaveLength(4);
    SERVICIOS_PAGE_SERVICES.forEach((service, index) => {
      expect(service.number).toBe(index + 1);
      expect(service.sector.length).toBeGreaterThan(0);
      expect(service.title.length).toBeGreaterThan(0);
      expect(service.imageAlt.length).toBeGreaterThan(0);
      expect(service.image).toBeTruthy();
    });
  });

  it('all four cards carry bullets; cards 01-03 carry an intro; card 03 has no tags; card 04 has no intro', () => {
    // All four cards now render a check-list (cards 01 and 03 migrated from none/tags).
    SERVICIOS_PAGE_SERVICES.forEach((service) => {
      expect(service.bullets).toBeDefined();
      expect(service.bullets!.length).toBeGreaterThan(0);
    });
    // Bullet counts per the client copy: 8 / 8 / 4 / 3.
    expect(SERVICIOS_PAGE_SERVICES[0]!.bullets).toHaveLength(8);
    expect(SERVICIOS_PAGE_SERVICES[1]!.bullets).toHaveLength(8);
    expect(SERVICIOS_PAGE_SERVICES[2]!.bullets).toHaveLength(4);
    expect(SERVICIOS_PAGE_SERVICES[3]!.bullets).toHaveLength(3);
    // Cards 01-03 carry the lead-in intro paragraph.
    expect(SERVICIOS_PAGE_SERVICES[0]!.intro!.length).toBeGreaterThan(0);
    expect(SERVICIOS_PAGE_SERVICES[1]!.intro!.length).toBeGreaterThan(0);
    expect(SERVICIOS_PAGE_SERVICES[2]!.intro!.length).toBeGreaterThan(0);
    // Card 03 dropped tags in favor of bullets; card 04 has no intro.
    expect(SERVICIOS_PAGE_SERVICES[2]!.tags).toBeUndefined();
    expect(SERVICIOS_PAGE_SERVICES[3]!.intro).toBeUndefined();
  });

  it('intro paragraphs open with the client-specified lead-ins', () => {
    expect(SERVICIOS_PAGE_SERVICES[0]!.intro).toMatch(/^Optimizamos el consumo de agua/);
    expect(SERVICIOS_PAGE_SERVICES[1]!.intro).toMatch(/^Ofrecemos soluciones especializadas/);
    expect(SERVICIOS_PAGE_SERVICES[2]!.intro).toMatch(/^Desarrollamos infraestructura/);
  });

  it('images map to the existing assets in render order', () => {
    const sources = SERVICIOS_PAGE_SERVICES.map((s) =>
      typeof s.image === 'string' ? s.image : s.image.src,
    );
    expect(sources[0]).toContain('edificios.jpg');
    expect(sources[1]).toContain('medidores-de-agua.webp');
    expect(sources[2]).toContain('planta-tratamiento.webp');
    expect(sources[3]).toContain('osmosis-inversa.jpg');
  });
});

describe('SERVICIOS_PAGE_HERO', () => {
  it('headline contains "Precisión" and highlightedWord is "Precisión"', () => {
    expect(SERVICIOS_PAGE_HERO.headline).toContain('Precisión');
    expect(SERVICIOS_PAGE_HERO.highlightedWord).toBe('Precisión');
    expect(SERVICIOS_PAGE_HERO.subtitle.length).toBeGreaterThan(0);
  });
});

describe('SERVICIOS_PAGE_CONTENT wiring', () => {
  it('binds hero and services together', () => {
    expect(SERVICIOS_PAGE_CONTENT.hero).toBe(SERVICIOS_PAGE_HERO);
    expect(SERVICIOS_PAGE_CONTENT.services).toBe(SERVICIOS_PAGE_SERVICES);
  });
});
