import { describe, it, expect } from 'vitest';
import type {
  CategoriaApi,
  ProductoApi,
  ProductoCardApi,
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

// ---------------------------------------------------------------------------
// ProductoCardApi — lean card projection for anonymous users
// ---------------------------------------------------------------------------

const SAMPLE_CARD_API: ProductoCardApi = {
  id: 'p1',
  sku: 'FLJ-001',
  titulo: 'Flujómetro Universal',
  slug: 'flujometro-universal',
  descripcionBreve: 'Medidor electromagnético de alta precisión.',
  categoriaId: 'cat-fluidos',
  subcategoriaId: 'sub-caudal',
  galeria: [{ url: 'https://cdn.example.com/flj-001.webp', alt: 'Flujómetro' }],
  precio: { valor: 125000, visible: true },
  creadoEn: '2026-01-15T12:00:00.000Z',
  // Heavy fields left undefined (optional)
  descripcionLarga: undefined,
  atributos: undefined,
  fichaTecnica: undefined,
  stock: undefined,
  actualizadoEn: undefined,
  idExterno: undefined,
};

describe('ProductoCardApi type', () => {
  it('has all required fields present', () => {
    expect(SAMPLE_CARD_API.id).toBe('p1');
    expect(SAMPLE_CARD_API.sku).toBe('FLJ-001');
    expect(SAMPLE_CARD_API.titulo).toBe('Flujómetro Universal');
    expect(SAMPLE_CARD_API.slug).toBe('flujometro-universal');
    expect(SAMPLE_CARD_API.descripcionBreve).toBe('Medidor electromagnético de alta precisión.');
    expect(SAMPLE_CARD_API.categoriaId).toBe('cat-fluidos');
    expect(SAMPLE_CARD_API.subcategoriaId).toBe('sub-caudal');
    expect(SAMPLE_CARD_API.precio.valor).toBe(125000);
    expect(SAMPLE_CARD_API.galeria).toHaveLength(1);
    expect(SAMPLE_CARD_API.creadoEn).toBe('2026-01-15T12:00:00.000Z');
  });

  it('allows heavy fields to be undefined', () => {
    const lean: ProductoCardApi = {
      id: 'p2',
      sku: 'MAN-002',
      titulo: 'Manómetro Beta',
      slug: 'manometro-beta',
      descripcionBreve: 'Control de presión.',
      categoriaId: 'cat-fluidos',
      subcategoriaId: null,
      galeria: [],
      precio: { valor: 80000, visible: true },
      creadoEn: '2026-01-10T12:00:00.000Z',
    };
    expect(lean.descripcionLarga).toBeUndefined();
    expect(lean.atributos).toBeUndefined();
    expect(lean.fichaTecnica).toBeUndefined();
    expect(lean.stock).toBeUndefined();
    expect(lean.actualizadoEn).toBeUndefined();
    expect(lean.idExterno).toBeUndefined();
  });

  it('is structurally compatible: ProductoApi satisfies ProductoCardApi', () => {
    // A full ProductoApi has all required card fields, so it satisfies
    // ProductoCardApi. This ensures existing code passing ProductoApi[] to
    // functions accepting ProductoCardApi[] keeps working.
    const full: ProductoApi = {
      id: 'p1',
      sku: 'FLJ-001',
      titulo: 'Flujómetro Universal',
      slug: 'flujometro-universal',
      descripcionBreve: 'Medidor.',
      descripcionLarga: '<p>Full.</p>',
      categoriaId: 'cat-fluidos',
      subcategoriaId: null,
      galeria: [],
      atributos: [],
      fichaTecnica: null,
      precio: { valor: 1000, visible: true },
      creadoEn: '2026-01-01T00:00:00.000Z',
    };
    // Assign to ProductoCardApi — should compile without error
    const card: ProductoCardApi = full;
    expect(card.id).toBe(full.id);
    expect(card.titulo).toBe(full.titulo);
  });
});
