import { describe, expect, it } from 'vitest';

import {
  Categoria,
  CategoriaCreatePayload,
  FichaTecnica,
  GaleriaItem,
  Precio,
  Producto,
  ProductoCreatePayload,
  ProductoListMeta,
  Stock,
  Subcategoria,
  SubcategoriaCreatePayload,
} from './models';

/**
 * Type mirrors of the backend catalog entities (task 3.1 / design D2). The
 * mirror is deliberate per-workspace duplication (same practice as
 * `apps/web/src/lib/api`); these tests pin the wire shapes the UI relies on,
 * so a backend drift breaks here first.
 */
describe('catalog models (task 3.1)', () => {
  it('builds a categoria and its create payload with the backend field set', () => {
    const categoria: Categoria = {
      id: 'c1',
      nombre: 'Herramientas',
      slug: 'herramientas',
      orden: 1,
      activa: true,
      esDefault: false,
      creadoEn: '2026-10-14T10:00:00Z',
      actualizadoEn: '2026-10-14T10:00:00Z',
    };
    const payload: CategoriaCreatePayload = {
      nombre: 'Herramientas',
      slug: 'herramientas',
      orden: 1,
      activa: true,
    };

    expect(Object.keys(categoria).sort()).toEqual(
      ['actualizadoEn', 'activa', 'creadoEn', 'esDefault', 'id', 'nombre', 'orden', 'slug'].sort(),
    );
    expect(payload.nombre).toBe('Herramientas');
  });

  it('builds a subcategoria linked to its parent category', () => {
    const subcategoria: Subcategoria = {
      id: 's1',
      categoriaId: 'c1',
      nombre: 'Taladros',
      slug: 'taladros',
      orden: 0,
      activa: true,
      creadoEn: '2026-10-14T10:00:00Z',
      actualizadoEn: '2026-10-14T10:00:00Z',
    };
    const payload: SubcategoriaCreatePayload = {
      categoriaId: 'c1',
      nombre: 'Taladros',
    };

    expect(subcategoria.categoriaId).toBe('c1');
    expect(payload).not.toHaveProperty('esDefault');
  });

  it('builds the full producto wire shape including nested DTOs', () => {
    const precio: Precio = { valor: 129990, visible: true };
    const stock: Stock = { disponible: true, cantidad: 12 };
    const galeriaItem: GaleriaItem = {
      url: 'https://storage.googleapis.com/bucket/productos/p1/0.webp',
      storagePath: 'productos/p1/0.webp',
      alt: 'Taladro inalámbrico',
      orden: 0,
    };
    const ficha: FichaTecnica = {
      url: 'https://storage.googleapis.com/bucket/productos/p1/ficha.pdf',
      storagePath: 'productos/p1/ficha.pdf',
      nombreArchivo: 'ficha-tecnica.pdf',
    };

    const producto: Producto = {
      id: 'p1',
      idExterno: null,
      sku: 'RIF-001',
      titulo: 'Taladro inalámbrico 18V',
      slug: 'taladro-inalambrico-18v',
      descripcionBreve: 'Taladro de percusión 18V.',
      descripcionLarga: '<p>Descripción completa.</p>',
      categoriaId: 'c1',
      subcategoriaId: 's1',
      atributos: [{ nombre: 'Voltaje', valor: '18V' }],
      precio,
      stock,
      galeria: [galeriaItem],
      fichaTecnica: ficha,
      destacado: true,
      publicado: true,
      creadoEn: '2026-10-14T10:00:00Z',
      actualizadoEn: '2026-10-14T10:00:00Z',
    };
    const payload: ProductoCreatePayload = {
      sku: producto.sku,
      titulo: producto.titulo,
      categoriaId: producto.categoriaId,
      subcategoriaId: producto.subcategoriaId,
      precio: producto.precio,
      stock: producto.stock,
      galeria: producto.galeria,
      fichaTecnica: producto.fichaTecnica,
      atributos: producto.atributos,
      destacado: producto.destacado,
      publicado: producto.publicado,
    };

    expect(producto.precio.valor).toBe(129990);
    expect(producto.stock.cantidad).toBe(12);
    expect(producto.galeria[0]?.orden).toBe(0);
    expect(producto.fichaTecnica?.nombreArchivo).toBe('ficha-tecnica.pdf');
    expect(payload.sku).toBe('RIF-001');
  });

  it('types the product list meta used by the pagination counter', () => {
    const meta: ProductoListMeta = { page: 1, limit: 24, total: 100 };

    expect(meta.total).toBe(100);
    expect(meta.limit).toBe(24);
  });
});
