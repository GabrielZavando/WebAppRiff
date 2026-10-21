import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import RepresentacionesHero from '@/components/RepresentacionesHero.astro';
import { REPRESENTACIONES_PAGE_CONTENT } from '@/lib/config/representaciones-page';

async function render(): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(RepresentacionesHero, {
    props: { ...REPRESENTACIONES_PAGE_CONTENT.hero },
  });
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

describe('RepresentacionesHero', () => {
  it('renders the eyebrow and the headline with the highlighted phrase in text-primary', async () => {
    const html = await render();
    expect(html).toContain('ALIANZAS GLOBALES DE ALTA PRECISIÓN');
    expect(html).toContain('Alianzas Estratégicas y ');
    // Tolerate Astro's scoped-style data attributes (the component has a
    // <style> block, so elements carry `data-astro-cid-*`).
    expect(html).toMatch(
      /<span class="text-primary"[^>]*>Representación Exclusiva<\/span>/,
    );
  });

  it('renders the <h1> fully uppercase', async () => {
    const html = await render();
    const clean = html.replace(/<!--[\s\S]*?-->/g, '');
    const h1Match = clean.match(/<h1[^>]*>/);
    if (!h1Match) throw new Error('h1 not found');
    expect(h1Match[0]).toContain('uppercase');
  });

  it('renders the intro paragraph', async () => {
    const html = await render();
    expect(html).toContain(
      'Conectando a la minería, industria química y empresas sanitarias de Chile',
    );
  });

  it('uses the brand navy secondary surface', async () => {
    const html = await render();
    expect(html).toMatch(/<section[^>]*class="[^"]*bg-secondary/);
  });

  it('renders exactly three metric cards with their values and labels', async () => {
    const html = await render();
    const metricCount = (html.match(/data-metric/g) ?? []).length;
    expect(metricCount).toBe(3);
    expect(html).toContain('05');
    expect(html).toContain('02');
    expect(html).toContain('100%');
    expect(html).toContain('Representaciones Exclusivas');
    expect(html).toContain('Distribuciones Oficiales');
    expect(html).toContain('Garantía Directa de Fábrica');
  });

  it('stays flat: no rounded or shadow classes in the static markup', async () => {
    const html = await render();
    expect(html).not.toMatch(/class="[^"]*\brounded/);
    expect(html).not.toMatch(/class="[^"]*\bshadow/);
  });
});
