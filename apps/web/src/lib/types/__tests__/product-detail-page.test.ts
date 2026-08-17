import { describe, it, expect } from 'vitest';
import type {
  ProductDetailPage,
  AtributoApi,
  FichaTecnicaApi,
  GaleriaItemApi,
} from '@/lib/types/products-page';

// Guards the shape of the product detail page types. A runtime assertion on a
// sample object is enough to keep the contract from silently drifting.
const SAMPLE_GALERIA: readonly GaleriaItemApi[] = [
  { url: 'https://cdn.example.com/p1-1.webp', alt: 'Vista frontal' },
  { url: 'https://cdn.example.com/p1-2.webp', alt: 'Vista lateral' },
];

const SAMPLE_ATRIBUTOS: readonly AtributoApi[] = [
  { nombre: 'Precisión', valor: '±2% de la lectura' },
  { nombre: 'Rango', valor: '0.1 a 9 m/s' },
];

const SAMPLE_FICHA: FichaTecnicaApi = {
  url: 'https://cdn.example.com/catalogo.pdf',
  storagePath: 'productos/p1/catalogo.pdf',
  nombreArchivo: 'catalogo-tecnico.pdf',
};

const SAMPLE_DETAIL: ProductDetailPage = {
  id: 'p1',
  sku: 'FLJ-001',
  slug: 'flujometro-universal',
  titulo: 'Flujómetro Universal',
  descripcionBreve: 'Medidor electromagnético de alta precisión.',
  descripcionLarga: '<p>Descripción completa en HTML.</p>',
  categoriaId: 'cat-fluidos',
  categoriaNombre: 'Medición de Fluidos',
  galeria: SAMPLE_GALERIA,
  atributos: SAMPLE_ATRIBUTOS,
  fichaTecnica: SAMPLE_FICHA,
  cotizarHref: '/cotizacion?producto=flujometro-universal',
};

describe('product-detail-page types', () => {
  it('exposes a valid AtributoApi sample', () => {
    const first = SAMPLE_ATRIBUTOS[0]!;
    expect(first.nombre).toBe('Precisión');
    expect(first.valor).toBe('±2% de la lectura');
  });

  it('exposes a valid FichaTecnicaApi sample', () => {
    expect(SAMPLE_FICHA.url).toBe('https://cdn.example.com/catalogo.pdf');
    expect(SAMPLE_FICHA.nombreArchivo).toBe('catalogo-tecnico.pdf');
    expect(SAMPLE_FICHA.storagePath).toBe('productos/p1/catalogo.pdf');
  });

  it('exposes a valid ProductDetailPage sample with gallery, attributes and doc', () => {
    expect(SAMPLE_DETAIL.titulo).toBe('Flujómetro Universal');
    expect(SAMPLE_DETAIL.categoriaNombre).toBe('Medición de Fluidos');
    expect(SAMPLE_DETAIL.galeria).toHaveLength(2);
    expect(SAMPLE_DETAIL.atributos).toHaveLength(2);
    expect(SAMPLE_DETAIL.fichaTecnica?.nombreArchivo).toBe('catalogo-tecnico.pdf');
    expect(SAMPLE_DETAIL.cotizarHref).toBe('/cotizacion?producto=flujometro-universal');
  });

  it('allows a null fichaTecnica (no technical sheet)', () => {
    const withoutFicha: ProductDetailPage = {
      ...SAMPLE_DETAIL,
      fichaTecnica: null,
    };
    expect(withoutFicha.fichaTecnica).toBeNull();
  });

  it('allows empty galeria and atributos', () => {
    const minimal: ProductDetailPage = {
      ...SAMPLE_DETAIL,
      galeria: [],
      atributos: [],
    };
    expect(minimal.galeria).toHaveLength(0);
    expect(minimal.atributos).toHaveLength(0);
  });
});
