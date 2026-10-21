import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ServiciosPage from '@/pages/servicios.astro';
import IndexPage from '@/pages/index.astro';

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

async function render(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ServiciosPage, {});
}

const PORTFOLIO_ANCHOR_IDS = [
  'solucion-medicion-fluidos',
  'solucion-tratamiento-agua',
  'solucion-productos-quimicos',
  'solucion-control-accesorios',
];

const FIELD_SERVICE_SLUGS = [
  'medicion-en-edificios',
  'medicion-industrial',
  'obras-y-proyectos',
  'tratamiento-de-agua',
];

const PORTFOLIO_TITLES = [
  'Medición de Fluidos',
  'Tratamiento de Agua',
  'Productos Químicos',
  'Control y Accesorios',
];

const FIELD_TITLES = [
  'Medición en Edificios',
  'Medición Industrial',
  'Obras y Proyectos',
  'Tratamiento de Agua y Desalinización',
];

describe('Servicios page — hero', () => {
  it('renders the new hero headline with the primary highlight', async () => {
    const clean = stripComments(await render());
    const text = clean.replace(/<[^>]+>/g, '');
    expect(text).toContain(
      'Portafolio industrial de soluciones &amp; Servicios Industriales',
    );
    expect(clean).toMatch(
      /<span class="text-primary">Servicios Industriales<\/span>/,
    );
  });

  it('uses the exact same banner overlay as Inicio', async () => {
    const overlay =
      /<div class="absolute inset-0 bg-secondary\/80" aria-hidden="true"><\/div>/g;
    const servicios = stripComments(await render());
    const homeContainer = await AstroContainer.create();
    const home = stripComments(
      await homeContainer.renderToString(IndexPage, {}),
    );
    expect(home.match(overlay) ?? []).toHaveLength(1);
    expect(servicios.match(overlay) ?? []).toHaveLength(1);
  });

  it('renders the tratamiento-agua hero image and not banner_home', async () => {
    const clean = stripComments(await render());
    expect(clean).toContain('tratamiento-agua');
    expect(clean).not.toContain('banner_home');
  });
});

describe('Servicios page — sections', () => {
  it('renders exactly two section h2 headings', async () => {
    const clean = stripComments(await render());
    expect(clean).toContain('Nuestras Soluciones — Portafolio Técnico');
    expect(clean).toContain('Servicios Especializados en Terreno');
    const h2Count = (clean.match(/<h2/g) ?? []).length;
    expect(h2Count).toBe(2);
  });

  it('renders the eight content rows and their titles', async () => {
    const clean = stripComments(await render());
    const articles = clean.match(/<article[^>]*>/g) ?? [];
    expect(articles).toHaveLength(8);
    for (const title of [...PORTFOLIO_TITLES, ...FIELD_TITLES]) {
      expect(clean).toContain(title);
    }
  });

  it('renders the two section surfaces with the expected tokens', async () => {
    const clean = stripComments(await render());
    const portfolio = clean.match(/<section[^>]*data-section="portfolio"[^>]*>/);
    const field = clean.match(/<section[^>]*data-section="field-services"[^>]*>/);
    expect(portfolio).not.toBeNull();
    expect(portfolio![0]).toContain('bg-bg');
    expect(field).not.toBeNull();
    expect(field![0]).toContain('bg-primary-100');
    expect(field![0]).toContain('border-y');
    expect(field![0]).toContain('border-border');
  });
});

describe('Servicios page — anchors', () => {
  it('renders the portfolio and field-service anchors in order', async () => {
    const clean = stripComments(await render());
    const articles = clean.match(/<article[^>]*>/g) ?? [];
    const anchorIds = articles.map((article) => {
      const match = article.match(/id="([^"]+)"/);
      return match ? match[1]! : null;
    });
    expect(anchorIds).toEqual([
      ...PORTFOLIO_ANCHOR_IDS,
      ...FIELD_SERVICE_SLUGS,
    ]);
  });

  it('gives every anchored article a scroll margin', async () => {
    const clean = stripComments(await render());
    const articles = clean.match(/<article[^>]*>/g) ?? [];
    for (const article of articles) {
      expect(article).toContain('id="');
      expect(article).toContain('scroll-mt-');
    }
  });
});

describe('Servicios page — images and CTAs', () => {
  it('renders exactly four optimized images inside the field-service articles', async () => {
    const clean = stripComments(await render());
    const articles = clean.match(/<article[^>]*>[\s\S]*?<\/article>/g) ?? [];
    const fieldArticles = articles.filter((article) =>
      FIELD_SERVICE_SLUGS.some((slug) => article.includes(`id="${slug}"`)),
    );
    expect(fieldArticles).toHaveLength(4);
    const images = fieldArticles.flatMap(
      (article) => article.match(/<img[^>]*>/g) ?? [],
    );
    expect(images).toHaveLength(4);
    for (const image of images) {
      expect(image).toMatch(/src="\/_(astro|image)\?/);
    }
  });

  it('renders one accent CTA to /contacto per content row', async () => {
    const clean = stripComments(await render());
    const articles = clean.match(/<article[^>]*>[\s\S]*?<\/article>/g) ?? [];
    expect(articles).toHaveLength(8);
    for (const article of articles) {
      const cta = article.match(/<a[^>]*href="\/contacto"[^>]*>/);
      expect(cta).not.toBeNull();
      expect(cta![0]).toContain('bg-accent');
    }
  });
});
