import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ProductGallery from '@/components/ProductGallery.astro';
import type { GaleriaItemApi } from '@/lib/types/products-page';

function makeGaleria(n: number): GaleriaItemApi[] {
  return Array.from({ length: n }, (_, i) => ({
    url: `https://cdn.example.com/img-${i}.webp`,
    alt: `Vista ${i}`,
  }));
}

async function render(galeria: GaleriaItemApi[], titulo = 'Producto Demo') {
  const container = await AstroContainer.create();
  return container.renderToString(ProductGallery, { props: { galeria, titulo } });
}

describe('ProductGallery', () => {
  it('renders the main image with alt, loading and decoding', async () => {
    const html = await render(makeGaleria(3));
    const main = html.match(/<img[^>]*data-main-image[^>]*>/)?.[0] ?? '';
    expect(main).toContain('src="https://cdn.example.com/img-0.webp"');
    expect(main).toContain('alt="Vista 0"');
    expect(main).toContain('loading="lazy"');
    expect(main).toContain('decoding="async"');
  });

  it('renders one thumbnail per gallery item with data-gallery-index', async () => {
    const html = await render(makeGaleria(3));
    const thumbs = [...html.matchAll(/data-gallery-index="(\d+)"/g)].map((m) => Number(m[1]));
    expect(thumbs).toEqual([0, 1, 2]);
    // first thumbnail is selected by default
    expect(html).toContain('data-gallery-index="0"');
  });

  it('renders a placeholder when galeria is empty (no <img>)', async () => {
    const html = await render([]);
    expect(html).not.toContain('<img');
    expect(html).toContain('aria-hidden="true"');
  });

  it('uses the titulo as the main image aria-label for accessibility', async () => {
    const html = await render(makeGaleria(1), 'Medidor X');
    const main = html.match(/<img[^>]*data-main-image[^>]*>/)?.[0] ?? '';
    expect(main).toContain('aria-label="Medidor X"');
  });

  it('uses flat-design tokens (border-border, bg-white) and no rounded* utility', async () => {
    const html = await render(makeGaleria(2));
    expect(html).toContain('border-border');
    expect(html).not.toMatch(/rounded(?:-(?:sm|md|lg|xl|2xl|3xl|full|none|t|b|l|r|tl|tr|bl|br))?/);
  });

  it('does not emit raw hex literals', async () => {
    const html = await render(makeGaleria(2));
    expect(html).not.toMatch(/#[0-9A-Fa-f]{6}/);
  });
});
