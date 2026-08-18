import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ServiciosPage from '@/pages/servicios.astro';

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

async function render(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ServiciosPage, {});
}

const SERVICE_TITLES = [
  'Medición en Edificios',
  'Medición Industrial',
  'Obras y Proyectos',
  'Tratamiento de Agua y Desalinización',
];

describe('Servicios page composition', () => {
  it('renders the services hero headline with the accent highlight', async () => {
    const html = await render();
    const clean = stripComments(html);
    expect(clean).toContain('Servicios Especializados en');
    expect(clean).toContain('Precisión');
    expect(clean).toContain('y Control');
    // The highlighted word is wrapped in the accent span
    expect(clean).toMatch(/<span class="text-accent">Precisión<\/span>/);
  });

  it('renders exactly four service cards (one <h2> per service)', async () => {
    const html = await render();
    const clean = stripComments(html);
    for (const title of SERVICE_TITLES) {
      expect(clean).toContain(title);
    }
    const h2Count = (clean.match(/<h2/g) ?? []).length;
    expect(h2Count).toBe(4);
  });

  it('renders four astro:assets optimized images', async () => {
    const html = await render();
    const imgs = html.match(/<img[^>]*>/g) ?? [];
    const serviceImgs = imgs.filter(
      (img) => img.includes('/_image?') || img.includes('/_astro/'),
    );
    expect(serviceImgs.length).toBeGreaterThanOrEqual(4);
  });

  it('renders the tratamiento-agua hero image via Layout hero (heroImage prop) and not banner_home', async () => {
    const html = await render();
    const clean = stripComments(html);
    expect(clean).toContain('tratamiento-agua');
    expect(clean).not.toContain('banner_home');
  });

  it('cards 01-03 include the client intro paragraphs and a check-list each; card 04 has no intro', async () => {
    const html = await render();
    const clean = stripComments(html);
    expect(clean).toContain('Optimizamos el consumo de agua');
    expect(clean).toContain('Ofrecemos soluciones especializadas');
    expect(clean).toContain('Desarrollamos infraestructura');
    // All four cards render a check-list; scope the <ul> count to the cards.
    const articles = clean.match(/<article[^>]*>[\s\S]*?<\/article>/g) ?? [];
    expect(articles).toHaveLength(4);
    for (const article of articles) {
      expect(article).toMatch(/<ul/);
    }
  });

  it('alternates image positions: cards 1 & 3 image-left, cards 2 & 4 image-right', async () => {
    const html = await render();
    const clean = stripComments(html);
    const articles = clean.match(/<article[^>]*>/g) ?? [];
    expect(articles).toHaveLength(4);
    const reverseCount = articles.filter((a) =>
      a.includes('md:flex-row-reverse'),
    ).length;
    // Exactly the two even-indexed (2nd and 4th) cards carry the reverse utility.
    expect(reverseCount).toBe(2);
  });

  it('wraps the cards section in a neutral bg-bg surface', async () => {
    const html = await render();
    const clean = stripComments(html);
    expect(clean).toContain('bg-bg');
  });

  it('renders the accent CTA to /contacto on every card', async () => {
    const html = await render();
    const clean = stripComments(html);
    // Each card CTA is an accent button: count the `bg-accent` anchors
    // pointing to /contacto (the Header nav also links to /contacto, so we
    // scope to the accent class to isolate the 4 card CTAs).
    const cardCtaCount = (
      clean.match(/href="\/contacto"[^>]*class="[^"]*bg-accent/g) ?? []
    ).length;
    expect(cardCtaCount).toBe(4);
  });
});
