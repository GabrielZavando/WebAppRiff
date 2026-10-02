import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import {
  SERVICIOS_PAGE_HERO,
  SERVICIOS_PAGE_SERVICES,
  SERVICIOS_PAGE_CONTENT,
} from '@/lib/config/services-page';
import { SERVICES_DATA } from '@/lib/config/services-section';
import ServiciosPage from '@/pages/servicios.astro';

// Single source of truth for the home <-> /servicios deep-link contract
// (SC-002/SC-008): every home SERVICES_DATA slug MUST have a matching anchor
// on the services page and vice versa. Keep in sync with both configs.
const HOME_SERVICE_SLUGS = [
  'medicion-en-edificios',
  'medicion-industrial',
  'obras-y-proyectos',
  'tratamiento-de-agua',
];

// Kebab-case: lowercase alphanumeric segments joined by single hyphens
// (no leading/trailing/double hyphens, no underscores).
const KEBAB_CASE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

describe('home SERVICES_DATA <-> /servicios slug contract (SC-002/SC-008)', () => {
  it('home SERVICES_DATA exposes exactly the four expected kebab-case slugs in render order', () => {
    const homeSlugs = SERVICES_DATA.map((service) => service.slug);
    expect(homeSlugs).toEqual(HOME_SERVICE_SLUGS);
    for (const slug of homeSlugs) {
      expect(slug).toMatch(KEBAB_CASE_PATTERN);
    }
  });

  it('every ServicePageService exposes a non-empty kebab-case slug', () => {
    expect(SERVICIOS_PAGE_SERVICES).toHaveLength(4);
    for (const service of SERVICIOS_PAGE_SERVICES) {
      expect(typeof service.slug).toBe('string');
      expect(service.slug.length).toBeGreaterThan(0);
      expect(service.slug).toMatch(KEBAB_CASE_PATTERN);
    }
  });

  it('maps the home SERVICES_DATA slugs 1:1 onto the /servicios page service slugs', () => {
    const homeSlugs = SERVICES_DATA.map((service) => service.slug);
    const pageSlugs = SERVICIOS_PAGE_SERVICES.map((service) => service.slug);
    expect(pageSlugs).toEqual(homeSlugs);
    expect(new Set(pageSlugs)).toEqual(new Set(homeSlugs));
  });

  it('renders one ServiceCard anchor id per home slug on the /servicios page', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ServiciosPage, {});
    const clean = html.replace(/<!--[\s\S]*?-->/g, '');
    const articles = clean.match(/<article[^>]*>/g) ?? [];
    expect(articles).toHaveLength(4);
    // Each card root <article> must carry id="{slug}" so the home CTAs can
    // deep-link to /servicios#{slug} (SC-002). Fails in RED: the component
    // does not render the anchor id yet.
    const anchorIds = articles.map((article) => {
      const match = article.match(/id="([^"]+)"/);
      return match ? match[1]! : null;
    });
    expect(anchorIds).toEqual(HOME_SERVICE_SLUGS);
  });
});
