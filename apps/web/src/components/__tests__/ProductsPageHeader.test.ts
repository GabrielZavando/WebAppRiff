import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ProductsPageHeader from '@/components/ProductsPageHeader.astro';
import type { ViewMode } from '@/lib/types/products-page';

const buildViewHref = (view: ViewMode) => `/productos?view=${view}`;

async function render(view: ViewMode, total = 25) {
  const container = await AstroContainer.create();
  return container.renderToString(ProductsPageHeader, {
    props: {
      titulo: 'Catálogo de Productos',
      subtitulo: 'Explora nuestro catálogo.',
      total,
      view,
      buildViewHref,
    },
  });
}

describe('ProductsPageHeader', () => {
  it('renders the title and subtitle', async () => {
    const html = await render('grid');
    expect(html).toContain('<h1');
    expect(html).toContain('Catálogo de Productos');
    expect(html).toContain('Explora nuestro catálogo.');
  });

  it('renders the total product count', async () => {
    const html = await render('grid', 12);
    expect(html).toContain('12 productos');
  });

  it('renders grid/list toggle anchors with aria-pressed', async () => {
    const html = await render('list');
    expect(html).toContain('href="/productos?view=grid"');
    expect(html).toContain('href="/productos?view=list"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
  });

  it('uses lucide grid/list icons', async () => {
    const html = await render('grid');
    expect(html).toContain('lucide:layout-grid');
    expect(html).toContain('lucide:list');
  });

  it('marks the active view with the primary highlight class', async () => {
    const html = await render('list');
    const listAnchor = html.match(/<a[^>]*href="\/productos\?view=list"[^>]*>/)?.[0] ?? '';
    expect(listAnchor).toContain('border-primary');
    expect(listAnchor).toContain('bg-primary-light');
  });
});
