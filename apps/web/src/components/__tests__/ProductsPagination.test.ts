import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ProductsPagination from '@/components/ProductsPagination.astro';
import { buildPaginationItems } from '@/lib/products/buildPaginationItems';
import type { PaginationModel } from '@/lib/types/products-page';

const buildHref = (page: number) => `/productos?page=${page}`;

function makePagination(totalPages: number, currentPage: number): PaginationModel {
  return {
    page: currentPage,
    pageSize: 9,
    total: totalPages * 9,
    totalPages,
    items: buildPaginationItems(currentPage, totalPages),
  };
}

async function render(pagination: PaginationModel) {
  const container = await AstroContainer.create();
  return container.renderToString(ProductsPagination, { props: { pagination, buildHref } });
}

function getNav(html: string): string {
  const match = html.match(/<nav[\s\S]*?<\/nav>/);
  if (!match) throw new Error('Nav not found in rendered HTML');
  return match[0];
}

describe('ProductsPagination', () => {
  it('renders nothing when there is only one page', async () => {
    const html = await render(makePagination(1, 1));
    expect(html).not.toContain('Paginación de productos');
  });

  it('renders a <nav> with the correct aria-label', async () => {
    const html = await render(makePagination(3, 1));
    const nav = getNav(html);
    expect(nav).toContain('aria-label="Paginación de productos"');
  });

  it('renders the previous chevron as lucide:chevron-left (no text label)', async () => {
    const html = await render(makePagination(3, 2));
    const nav = getNav(html);
    expect(nav).toContain('lucide:chevron-left');
    expect(nav).not.toContain('>Anterior<');
    // The previous anchor carries an accessible label.
    expect(nav).toContain('aria-label="Página anterior"');
  });

  it('renders the next chevron as lucide:chevron-right (no text label)', async () => {
    const html = await render(makePagination(3, 2));
    const nav = getNav(html);
    expect(nav).toContain('lucide:chevron-right');
    expect(nav).not.toContain('>Siguiente<');
    expect(nav).toContain('aria-label="Página siguiente"');
  });

  it('marks the previous control as disabled on the first page (chevron-only span, no anchor)', async () => {
    const html = await render(makePagination(3, 1));
    const nav = getNav(html);
    expect(nav).toContain('aria-disabled="true"');
    expect(nav).not.toContain('rel="prev"');
  });

  it('marks the next control as disabled on the last page (chevron-only span, no anchor)', async () => {
    const html = await render(makePagination(3, 3));
    const nav = getNav(html);
    expect(nav).toContain('aria-disabled="true"');
    expect(nav).not.toContain('rel="next"');
  });

  it('renders page anchors with hrefs from buildHref and aria-current on the current page', async () => {
    const html = await render(makePagination(3, 2));
    const nav = getNav(html);
    expect(nav).toContain('href="/productos?page=1"');
    expect(nav).toContain('href="/productos?page=3"');
    const current = nav.match(/<a[^>]*aria-current="page"[^>]*>2<\/a>/)?.[0] ?? '';
    expect(current).not.toBe('');
    expect(current).toContain('bg-primary');
    expect(current).toContain('text-white');
  });

  it('the active page has bg-primary text-white and no border indicator (per design decision)', async () => {
    const html = await render(makePagination(5, 3));
    const nav = getNav(html);
    const current = nav.match(/<a[^>]*aria-current="page"[^>]*>3<\/a>/)?.[0] ?? '';
    expect(current).toContain('bg-primary');
    expect(current).toContain('text-white');
    // No bottom-border indicator below the active number (decision: solo fondo).
    expect(current).not.toMatch(/border-b-2|border-b-primary/);
  });

  it('inactive pages use text-text-2 (no bg-primary)', async () => {
    const html = await render(makePagination(3, 2));
    const nav = getNav(html);
    // Page "1" is inactive here.
    const inactive = nav.match(/<a[^>]*href="\/productos\?page=1"[^>]*>1<\/a>/)?.[0] ?? '';
    expect(inactive).not.toBe('');
    expect(inactive).not.toContain('aria-current="page"');
    expect(inactive).not.toContain('bg-primary');
  });

  it('renders an ellipsis as a non-link span', async () => {
    const html = await render(makePagination(8, 4));
    const nav = getNav(html);
    expect(nav).toContain('aria-hidden="true"');
    expect(nav).toContain('…');
  });
});
