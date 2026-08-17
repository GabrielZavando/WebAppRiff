import { describe, it, expect } from 'vitest';
import type {
  CategoriaApi,
  ProductoApi,
  ProductCardModel,
  ProductsPageFilters,
  SubcategoriaApi,
} from '@/lib/types/products-page';

// This file mainly guards the shape of the public types. A runtime assertion on
// a sample object is enough to keep the contract from silently drifting.
const SAMPLE_PRODUCTO: ProductoApi = {
  id: 'p1',
  sku: 'FLJ-001',
  titulo: 'Flujómetro Universal',
  slug: 'flujometro-universal',
  descripcionBreve: 'Medidor electromagnético de alta precisión.',
  descripcionLarga: '<p>Descripción completa del flujómetro.</p>',
  categoriaId: 'cat-fluidos',
  subcategoriaId: 'sub-caudal',
  galeria: [{ url: 'https://cdn.example.com/flj-001.webp', alt: 'Flujómetro' }],
  atributos: [{ nombre: 'Precisión', valor: '±2%' }],
  fichaTecnica: null,
  precio: { valor: 125000, visible: true },
  creadoEn: '2026-01-15T12:00:00.000Z',
};

const SAMPLE_CATEGORIA: CategoriaApi = {
  id: 'cat-fluidos',
  nombre: 'Medición de Fluidos',
  slug: 'medicion-de-fluidos',
  orden: 1,
  activa: true,
};

const SAMPLE_SUBCATEGORIA: SubcategoriaApi = {
  id: 'sub-caudal',
  categoriaId: 'cat-fluidos',
  nombre: 'Caudal',
  slug: 'caudal',
  orden: 1,
  activa: true,
};

const SAMPLE_FILTERS: ProductsPageFilters = {
  q: '',
  categoriaId: '',
  subcategoriaIds: [],
  sortBy: 'creadoEn',
  sortDir: 'desc',
  view: 'grid',
  page: 1,
  pageSize: 9,
};

const SAMPLE_CARD: ProductCardModel = {
  slug: 'flujometro-universal',
  titulo: 'Flujómetro Universal',
  categoriaId: 'cat-fluidos',
  subcategoriaId: 'sub-caudal',
  categoriaNombre: 'Medición de Fluidos',
  descripcionBreve: 'Medidor electromagnético.',
  imageUrl: 'https://cdn.example.com/flj-001.webp',
  imageAlt: 'Flujómetro',
  cotizarHref: '/cotizacion?producto=flujometro-universal',
  detalleHref: '/productos/flujometro-universal',
};

describe('products-page types', () => {
  it('exposes a valid ProductoApi sample', () => {
    expect(SAMPLE_PRODUCTO.id).toBe('p1');
    expect(SAMPLE_PRODUCTO.subcategoriaId).toBe('sub-caudal');
    expect(SAMPLE_PRODUCTO.precio.valor).toBe(125000);
  });

  it('exposes a valid CategoriaApi / SubcategoriaApi sample', () => {
    expect(SAMPLE_CATEGORIA.nombre).toBe('Medición de Fluidos');
    expect(SAMPLE_SUBCATEGORIA.categoriaId).toBe(SAMPLE_CATEGORIA.id);
  });

  it('exposes a valid ProductsPageFilters default', () => {
    expect(SAMPLE_FILTERS.view).toBe('grid');
    expect(SAMPLE_FILTERS.pageSize).toBe(9);
    expect(SAMPLE_FILTERS.sortBy).toBe('creadoEn');
  });

  it('exposes a valid ProductCardModel sample', () => {
    expect(SAMPLE_CARD.cotizarHref).toContain('/cotizacion?producto=');
    expect(SAMPLE_CARD.detalleHref).toContain('/productos/');
  });
});
