import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ProductsEmptyState from '@/components/ProductsEmptyState.astro';

async function render(clearHref = '/productos') {
  const container = await AstroContainer.create();
  return container.renderToString(ProductsEmptyState, { props: { clearHref } });
}

describe('ProductsEmptyState', () => {
  it('renders the empty message', async () => {
    const html = await render();
    expect(html).toContain('No se encontraron productos que coincidan con tu búsqueda.');
  });

  it('renders a Limpiar filtros link to the clear href', async () => {
    const html = await render('/productos?q=flujo');
    expect(html).toContain('Limpiar filtros');
    expect(html).toContain('href="/productos?q=flujo"');
  });

  it('does not use rounded* (flat design)', async () => {
    const html = await render();
    expect(html).not.toMatch(/rounded(?:-(?:sm|md|lg|xl|2xl|3xl|full|none|t|b|l|r|tl|tr|bl|br))?/);
  });
});
