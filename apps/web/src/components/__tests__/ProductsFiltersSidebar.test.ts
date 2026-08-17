import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ProductsFiltersSidebar from '@/components/ProductsFiltersSidebar.astro';
import type {
  CategoriaApi,
  SubcategoriaApi,
  ProductsPageFilters,
} from '@/lib/types/products-page';

const CATEGORIES: CategoriaApi[] = [
  { id: 'cat-fluidos', nombre: 'Medición de Fluidos', slug: 'm', orden: 1, activa: true },
  { id: 'cat-bombas', nombre: 'Bombas', slug: 'b', orden: 2, activa: true },
];
const SUBS: SubcategoriaApi[] = [
  { id: 'sub-caudal', categoriaId: 'cat-fluidos', nombre: 'Caudal', slug: 'caudal', orden: 1, activa: true },
  { id: 'sub-presion', categoriaId: 'cat-fluidos', nombre: 'Presión', slug: 'presion', orden: 2, activa: true },
  { id: 'sub-bomba', categoriaId: 'cat-bombas', nombre: 'Bomba', slug: 'bomba', orden: 1, activa: true },
];

async function render(partial: Partial<ProductsPageFilters> = {}) {
  const filtros: ProductsPageFilters = {
    q: '',
    categoriaId: '',
    subcategoriaIds: [],
    sortBy: 'creadoEn',
    sortDir: 'desc',
    view: 'grid',
    page: 1,
    pageSize: 9,
    ...partial,
  };
  const container = await AstroContainer.create();
  return container.renderToString(ProductsFiltersSidebar, {
    props: { categories: CATEGORIES, subcategories: SUBS, filtros },
  });
}

function checkboxTags(html: string): string[] {
  return [
    ...html.matchAll(/<input[^>]*type="checkbox"[^>]*name="subcategoriaId"[^>]*>/g),
  ].map((m) => m[0] ?? '');
}

describe('ProductsFiltersSidebar', () => {
  it('renders a GET form to /productos with the expected id', async () => {
    const html = await render({ q: '', view: 'grid', categoriaId: '', subcategoriaIds: [] });
    const form = html.match(/<form[\s\S]*?<\/form>/)?.[0] ?? '';
    expect(form).toContain('method="get"');
    expect(form).toContain('action="/productos"');
    expect(html).toContain('id="products-filter-form"');
  });

  it('preserves the current q and view as hidden fields', async () => {
    const html = await render({ q: 'flujo', view: 'list', categoriaId: '', subcategoriaIds: [] });
    expect(html).toContain('<input type="hidden" name="q" value="flujo"');
    expect(html).toContain('<input type="hidden" name="view" value="list"');
  });

  it('renders a category <select name="categoriaId"> with "Todas las categorías" first', async () => {
    const html = await render({ q: '', view: 'grid', categoriaId: '', subcategoriaIds: [] });
    const select = html.match(/<select[^>]*name="categoriaId"[\s\S]*?<\/select>/)?.[0] ?? '';
    expect(select).toContain('name="categoriaId"');
    const firstOption = select.match(/<option[^>]*>([^<]*)<\/option>/)?.[0] ?? '';
    expect(firstOption).toContain('Todas las categorías');
  });

  it('bakes every subcategory group, all hidden + disabled when no category is selected', async () => {
    const html = await render({ q: '', view: 'grid', categoriaId: '', subcategoriaIds: [] });
    const groups = [...html.matchAll(/<fieldset[^>]*data-categoria-id="([^"]+)"[^>]*>/g)].map((m) => m[0]);
    expect(groups.length).toBe(2); // cat-fluidos + cat-bombas both have subcategories
    groups.forEach((g) => expect(g).toContain('hidden'));
    checkboxTags(html).forEach((c) => expect(c).toContain('disabled'));
  });

  it('reveals only the selected category group (no hidden, checkboxes enabled) and hides the others', async () => {
    const html = await render({ q: '', view: 'grid', categoriaId: 'cat-fluidos', subcategoriaIds: [] });
    const fluidosGroup = html.match(/<fieldset[^>]*data-categoria-id="cat-fluidos"[\s\S]*?<\/fieldset>/)?.[0] ?? '';
    const bombasGroup = html.match(/<fieldset[^>]*data-categoria-id="cat-bombas"[\s\S]*?<\/fieldset>/)?.[0] ?? '';
    expect(fluidosGroup).not.toContain(' hidden');
    expect(bombasGroup).toContain('hidden');
    checkboxTags(fluidosGroup).forEach((c) => expect(c).not.toContain('disabled'));
    checkboxTags(bombasGroup).forEach((c) => expect(c).toContain('disabled'));
    // Only the fluidos group's checkboxes are enabled and carry the expected values.
    const enabledValues = checkboxTags(fluidosGroup).map((c) => c.match(/value="([^"]*)"/)?.[1] ?? '');
    expect(enabledValues).toEqual(['sub-caudal', 'sub-presion']);
  });

  it('checks the subcategories present in filtros.subcategoriaIds within the visible group', async () => {
    const html = await render({ q: '', view: 'grid', categoriaId: 'cat-fluidos', subcategoriaIds: ['sub-presion'] });
    const fluidosGroup = html.match(/<fieldset[^>]*data-categoria-id="cat-fluidos"[\s\S]*?<\/fieldset>/)?.[0] ?? '';
    const checked =
      fluidosGroup.match(/<input[^>]*type="checkbox"[^>]*name="subcategoriaId"[^>]*checked[^>]*>/)?.[0] ?? '';
    expect(checked).toContain('value="sub-presion"');
  });

  it('the apply button uses bg-primary', async () => {
    const html = await render({ q: '', view: 'grid', categoriaId: '', subcategoriaIds: [] });
    const button = html.match(/<button[^>]*type="submit"[\s\S]*?<\/button>/)?.[0] ?? '';
    expect(button).toContain('bg-primary');
    expect(button).toContain('Aplicar filtros');
  });

  it('renders a Limpiar filtros link that drops category/subcategory but keeps q', async () => {
    const html = await render({ q: 'flujo', view: 'grid', categoriaId: 'cat-fluidos', subcategoriaIds: [] });
    expect(html).toContain('Limpiar filtros');
    expect(html).toContain('href="/productos?q=flujo"');
  });

  it('renders the "FILTRO DE BÚSQUEDA" title in uppercase with a divider line below', async () => {
    const html = await render({ q: '', view: 'grid', categoriaId: '', subcategoriaIds: [] });
    expect(html).toContain('FILTRO DE BÚSQUEDA');
    const titleBlock =
      html.match(/<div[^>]*>[\s\S]*?<h2[^>]*>FILTRO DE BÚSQUEDA<\/h2>[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(titleBlock).toContain('border-b');
    expect(titleBlock).toContain('border-border');
  });

  it('renders a "Categorías" label immediately above the category <select>', async () => {
    const html = await render({ q: '', view: 'grid', categoriaId: '', subcategoriaIds: [] });
    const label = html.match(/<label[^>]*for="filtro-categoria"[^>]*>([^<]+)<\/label>/)?.[0] ?? '';
    expect(label).toContain('Categorías');
  });

  it('renders the subcategory groups below the category <select>', async () => {
    const html = await render({ q: '', view: 'grid', categoriaId: '', subcategoriaIds: [] });
    const selectEnd = html.indexOf('</select>');
    const firstGroup = html.indexOf('data-categoria-id=');
    expect(selectEnd).toBeGreaterThan(-1);
    expect(firstGroup).toBeGreaterThan(selectEnd);
  });
});
