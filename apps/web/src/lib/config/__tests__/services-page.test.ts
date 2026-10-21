import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import {
  SERVICIOS_PAGE_HERO,
  SERVICIOS_PORTFOLIO_SECTION,
  SERVICIOS_FIELD_SECTION,
  SERVICIOS_PAGE_CONTENT,
} from '@/lib/config/services-page';
import { SERVICES_DATA } from '@/lib/config/services-section';
import ServiciosPage from '@/pages/servicios.astro';

// Single source of truth for the home <-> /servicios deep-link contract:
// every home SERVICES_DATA slug MUST have a matching anchor on the services
// page and vice versa. Keep in sync with both configs.
const HOME_SERVICE_SLUGS = [
  'medicion-en-edificios',
  'medicion-industrial',
  'obras-y-proyectos',
  'tratamiento-de-agua',
];

const PORTFOLIO_ANCHOR_IDS = [
  'solucion-medicion-fluidos',
  'solucion-tratamiento-agua',
  'solucion-productos-quimicos',
  'solucion-control-accesorios',
];

// Kebab-case: lowercase alphanumeric segments joined by single hyphens
// (no leading/trailing/double hyphens, no underscores).
const KEBAB_CASE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe('SERVICIOS_PORTFOLIO_SECTION', () => {
  it('has exactly four solutions with non-empty core fields', () => {
    expect(SERVICIOS_PORTFOLIO_SECTION.solutions).toHaveLength(4);
    for (const solution of SERVICIOS_PORTFOLIO_SECTION.solutions) {
      expect(solution.id).toMatch(KEBAB_CASE_PATTERN);
      expect(solution.icon).toMatch(/^lucide:[a-z0-9-]+$/);
      expect(solution.category.length).toBeGreaterThan(0);
      expect(solution.title.length).toBeGreaterThan(0);
      expect(solution.description.length).toBeGreaterThan(0);
      expect(solution.specsTitle.length).toBeGreaterThan(0);
      expect(solution.specs.length).toBeGreaterThanOrEqual(2);
      expect(solution.specs.length).toBeLessThanOrEqual(4);
      expect(solution.tagsLabel.length).toBeGreaterThan(0);
      expect(solution.tags.length).toBeGreaterThan(0);
      expect(solution.ctaLabel.length).toBeGreaterThan(0);
      expect(solution.ctaHref).toBe('/contacto');
    }
  });

  it('exposes the four expected portfolio anchor ids in render order', () => {
    expect(
      SERVICIOS_PORTFOLIO_SECTION.solutions.map((solution) => solution.id),
    ).toEqual(PORTFOLIO_ANCHOR_IDS);
  });

  it('maps the solution icons to the Lucide set', () => {
    expect(
      SERVICIOS_PORTFOLIO_SECTION.solutions.map((solution) => solution.icon),
    ).toEqual([
      'lucide:gauge',
      'lucide:droplets',
      'lucide:flask-conical',
      'lucide:settings-2',
    ]);
  });

  it('keeps the section copy from the reference design', () => {
    expect(SERVICIOS_PORTFOLIO_SECTION.eyebrow).toBe(
      'LÍNEA DE EQUIPAMIENTO & TECNOLOGÍA',
    );
    expect(SERVICIOS_PORTFOLIO_SECTION.headline).toBe(
      'Nuestras Soluciones — Portafolio Técnico',
    );
    expect(SERVICIOS_PORTFOLIO_SECTION.intro).toMatch(
      /^Suministro especializado, instrumentación/,
    );
  });
});

describe('SERVICIOS_FIELD_SECTION', () => {
  it('has exactly four services with non-empty core fields and 1-based indexes', () => {
    expect(SERVICIOS_FIELD_SECTION.services).toHaveLength(4);
    SERVICIOS_FIELD_SECTION.services.forEach((service, index) => {
      expect(service.index).toBe(index + 1);
      expect(service.slug).toMatch(KEBAB_CASE_PATTERN);
      expect(service.sector.length).toBeGreaterThan(0);
      expect(service.title.length).toBeGreaterThan(0);
      expect(service.description.length).toBeGreaterThan(0);
      expect(service.imageAlt.length).toBeGreaterThan(0);
      expect(service.image).toBeTruthy();
      expect(service.imageCaptionLabel.length).toBeGreaterThan(0);
      expect(service.imageCaption.length).toBeGreaterThan(0);
      expect(service.ctaLabel.length).toBeGreaterThan(0);
      expect(service.ctaHref).toBe('/contacto');
    });
  });

  it('uses exactly one body variant per service in the reference order', () => {
    const kinds = SERVICIOS_FIELD_SECTION.services.map(
      (service) => service.body.kind,
    );
    expect(kinds).toEqual(['features', 'bullets', 'tags', 'bullets']);
  });

  it('keeps the feature, bullet and tag counts from the reference design', () => {
    const [first, second, third, fourth] = SERVICIOS_FIELD_SECTION.services;
    expect(first!.body).toMatchObject({ kind: 'features' });
    if (first!.body.kind === 'features') {
      expect(first!.body.features).toHaveLength(2);
    }
    expect(second!.body).toMatchObject({ kind: 'bullets' });
    if (second!.body.kind === 'bullets') {
      expect(second!.body.bullets).toHaveLength(3);
    }
    expect(third!.body).toMatchObject({ kind: 'tags' });
    if (third!.body.kind === 'tags') {
      expect(third!.body.tags).toHaveLength(5);
    }
    expect(fourth!.body).toMatchObject({ kind: 'bullets' });
    if (fourth!.body.kind === 'bullets') {
      expect(fourth!.body.bullets).toHaveLength(3);
    }
  });

  it('keeps the section copy from the reference design', () => {
    expect(SERVICIOS_FIELD_SECTION.eyebrow).toBe(
      'EJECUCIÓN, MONTAJE & POSTVENTA',
    );
    expect(SERVICIOS_FIELD_SECTION.headline).toBe(
      'Servicios Especializados en Terreno',
    );
    expect(SERVICIOS_FIELD_SECTION.intro).toMatch(
      /^Cuadrillas de ingenieros y técnicos calificados/,
    );
  });

  it('images map to the existing assets in render order', () => {
    const sources = SERVICIOS_FIELD_SECTION.services.map((service) =>
      typeof service.image === 'string' ? service.image : service.image.src,
    );
    expect(sources[0]).toContain('edificios.jpg');
    expect(sources[1]).toContain('medidores-de-agua.webp');
    expect(sources[2]).toContain('planta-tratamiento.webp');
    expect(sources[3]).toContain('osmosis-inversa.jpg');
  });
});

describe('SERVICIOS_PAGE_HERO', () => {
  it('headline is the industrial portfolio title and highlights "Servicios Industriales"', () => {
    expect(SERVICIOS_PAGE_HERO.headline).toBe(
      'Portafolio industrial de soluciones & Servicios Industriales',
    );
    expect(SERVICIOS_PAGE_HERO.highlightedWord).toBe('Servicios Industriales');
    expect(SERVICIOS_PAGE_HERO.subtitle.length).toBeGreaterThan(0);
  });
});

describe('SERVICIOS_PAGE_CONTENT wiring', () => {
  it('binds hero and the two sections together', () => {
    expect(SERVICIOS_PAGE_CONTENT.hero).toBe(SERVICIOS_PAGE_HERO);
    expect(SERVICIOS_PAGE_CONTENT.portfolioSection).toBe(
      SERVICIOS_PORTFOLIO_SECTION,
    );
    expect(SERVICIOS_PAGE_CONTENT.fieldServicesSection).toBe(
      SERVICIOS_FIELD_SECTION,
    );
  });
});

describe('home SERVICES_DATA <-> /servicios slug contract', () => {
  it('home SERVICES_DATA exposes exactly the four expected kebab-case slugs in render order', () => {
    const homeSlugs = SERVICES_DATA.map((service) => service.slug);
    expect(homeSlugs).toEqual(HOME_SERVICE_SLUGS);
    for (const slug of homeSlugs) {
      expect(slug).toMatch(KEBAB_CASE_PATTERN);
    }
  });

  it('maps the home SERVICES_DATA slugs 1:1 onto the field-services slugs', () => {
    const homeSlugs = SERVICES_DATA.map((service) => service.slug);
    const pageSlugs = SERVICIOS_FIELD_SECTION.services.map(
      (service) => service.slug,
    );
    expect(pageSlugs).toEqual(homeSlugs);
    expect(new Set(pageSlugs)).toEqual(new Set(homeSlugs));
  });

  it('renders both anchor sets on the /servicios page', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ServiciosPage, {});
    const clean = html.replace(/<!--[\s\S]*?-->/g, '');
    const articles = clean.match(/<article[^>]*>/g) ?? [];
    expect(articles).toHaveLength(8);

    const anchorIds = articles.map((article) => {
      const match = article.match(/id="([^"]+)"/);
      return match ? match[1]! : null;
    });
    expect(anchorIds).toEqual([...PORTFOLIO_ANCHOR_IDS, ...HOME_SERVICE_SLUGS]);
  });
});
