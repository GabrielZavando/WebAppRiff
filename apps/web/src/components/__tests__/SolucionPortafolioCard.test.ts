import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import SolucionPortafolioCard from '@/components/SolucionPortafolioCard.astro';
import type { SolucionPortafolio } from '@/lib/types/services-page';
import { SERVICIOS_PORTFOLIO_SECTION } from '@/lib/config/services-page';

const solution = SERVICIOS_PORTFOLIO_SECTION.solutions[0]!;

async function render(
  props: Partial<SolucionPortafolio> = {},
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(SolucionPortafolioCard, {
    props: { ...solution, ...props },
  });
}

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

describe('SolucionPortafolioCard — main content', () => {
  it('renders a Lucide icon with aria-hidden', async () => {
    const html = stripComments(await render());
    const icon = html.match(/<svg[^>]*aria-hidden="true"[^>]*>/);
    expect(icon).not.toBeNull();
  });

  it('renders the category in primary uppercase', async () => {
    const html = stripComments(await render());
    const category = html.match(/<span[^>]*data-category[^>]*>[\s\S]*?<\/span>/);
    expect(category).not.toBeNull();
    expect(category![0]).toContain('Instrumentación de Precisión');
    expect(category![0]).toContain('text-primary');
    expect(category![0]).toContain('uppercase');
  });

  it('renders the title as an h3 in text-secondary', async () => {
    const html = stripComments(await render());
    const title = html.match(/<h3[^>]*>[\s\S]*?Medición de Fluidos[\s\S]*?<\/h3>/);
    expect(title).not.toBeNull();
    expect(title![0]).toContain('text-secondary');
  });

  it('renders the description in text-text-2', async () => {
    const html = stripComments(await render());
    const description = html.match(/<p[^>]*data-description[^>]*>/);
    expect(description).not.toBeNull();
    expect(description![0]).toContain('text-text-2');
  });

  it('renders the anchor id and a scroll margin', async () => {
    const html = stripComments(await render());
    const article = html.match(/<article[^>]*>/);
    expect(article).not.toBeNull();
    expect(article![0]).toContain('id="solucion-medicion-fluidos"');
    expect(article![0]).toContain('scroll-mt-');
  });

  it('uses a two-column grid from lg', async () => {
    const html = stripComments(await render());
    expect(html).toContain('lg:grid-cols-12');
  });
});

describe('SolucionPortafolioCard — specifications', () => {
  it('renders the panel title as h4 and one box per spec', async () => {
    const html = stripComments(await render());
    expect(html).toMatch(
      /<h4[^>]*>[\s\S]*?Especificaciones Técnicas Clave[\s\S]*?<\/h4>/,
    );
    const specs = html.match(/data-spec(?:\s|>)/g) ?? [];
    expect(specs).toHaveLength(3);
    expect(html).toContain('Precisión Estándar:');
    expect(html).toContain('±0.2% a ±0.5%');
  });

  it('does not render the panel when specs are empty', async () => {
    const html = stripComments(await render({ specs: [] }));
    expect(html).not.toContain('data-spec-panel');
  });
});

describe('SolucionPortafolioCard — tags and CTA', () => {
  it('renders the tags label and one chip per tag', async () => {
    const html = stripComments(await render());
    expect(html).toContain('Sectores e Industrias:');
    const tags = html.match(/data-tag(?:\s|>)/g) ?? [];
    expect(tags).toHaveLength(5);
    const chip = html.match(/<span[^>]*\sdata-tag(?:\s|>)[^>]*>/);
    expect(chip![0]).toContain('border');
    expect(chip![0]).toContain('border-border');
  });

  it('does not render chips when tags are empty', async () => {
    const html = stripComments(await render({ tags: [] }));
    const tags = html.match(/data-tag(?:\s|>)/g) ?? [];
    expect(tags).toHaveLength(0);
  });

  it('renders the accent CTA to /contacto with a decorative arrow', async () => {
    const html = stripComments(await render());
    const cta = html.match(/<a[^>]*href="\/contacto"[^>]*>/);
    expect(cta).not.toBeNull();
    expect(cta![0]).toContain('bg-accent');
    expect(html).toContain('Solicitar Asesoría Técnica');
    expect(html).toMatch(/<svg[^>]*data-icon="arrow-right"[^>]*aria-hidden="true"/);
  });
});

describe('SolucionPortafolioCard — flat design', () => {
  it('does not use rounded or shadow classes', async () => {
    const html = stripComments(await render());
    expect(html).not.toMatch(/class="[^"]*rounded/);
    expect(html).not.toMatch(/class="[^"]*shadow/);
  });
});
