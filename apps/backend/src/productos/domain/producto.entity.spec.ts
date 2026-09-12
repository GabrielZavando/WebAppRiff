import {
  ProductoCard,
  ProductoListResult,
  ProductoFilter,
} from './producto.entity';

describe('Domain types — productos', () => {
  // ─── T3.1 — ProductoCard ───────────────────────────────────────

  describe('ProductoCard', () => {
    it('should have all required card fields', () => {
      const card: ProductoCard = {
        id: 'abc',
        sku: 'SKU-001',
        titulo: 'Product Title',
        slug: 'product-title',
        descripcionBreve: 'Short description',
        categoriaId: 'cat-1',
        subcategoriaId: 'sub-1',
        precio: { valor: 99.99, visible: true },
        destacado: false,
        publicado: true,
        creadoEn: new Date(),
        galeria: [],
      };

      expect(card.id).toBe('abc');
      expect(card.sku).toBe('SKU-001');
      expect(card.titulo).toBe('Product Title');
      expect(card.slug).toBe('product-title');
      expect(card.descripcionBreve).toBe('Short description');
      expect(card.categoriaId).toBe('cat-1');
      expect(card.subcategoriaId).toBe('sub-1');
      expect(card.precio).toEqual({ valor: 99.99, visible: true });
      expect(card.destacado).toBe(false);
      expect(card.publicado).toBe(true);
      expect(card.creadoEn).toBeInstanceOf(Date);
      expect(card.galeria).toEqual([]);
    });

    it('should NOT have heavy/full fields', () => {
      // These fields should not exist on ProductoCard.
      // TypeScript compile-time check: assigning them should cause a type error.
      // Runtime check: verify they are not present on a valid object.
      const card: ProductoCard = {
        id: 'abc',
        sku: 'SKU-001',
        titulo: 'Product Title',
        slug: 'product-title',
        descripcionBreve: 'Short description',
        categoriaId: 'cat-1',
        subcategoriaId: 'sub-1',
        precio: { valor: 99.99, visible: true },
        destacado: false,
        publicado: true,
        creadoEn: new Date(),
        galeria: [],
      };

      expect(card).not.toHaveProperty('descripcionLarga');
      expect(card).not.toHaveProperty('atributos');
      expect(card).not.toHaveProperty('fichaTecnica');
      expect(card).not.toHaveProperty('stock');
      expect(card).not.toHaveProperty('actualizadoEn');
      expect(card).not.toHaveProperty('idExterno');
    });
  });

  // ─── T3.3 — ProductoListResult ─────────────────────────────────

  describe('ProductoListResult', () => {
    it('should have items (array) and total (number)', () => {
      const result: ProductoListResult = {
        items: [],
        total: 0,
      };

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('should be generic and work with ProductoCard', () => {
      const result: ProductoListResult<ProductoCard> = {
        items: [],
        total: 0,
      };

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ─── T3.5 — ProductoFilter with pagination ─────────────────────

  describe('ProductoFilter (extended)', () => {
    it('should accept page and limit as optional numbers', () => {
      const filter: ProductoFilter = {
        page: 2,
        limit: 24,
      };

      expect(filter.page).toBe(2);
      expect(filter.limit).toBe(24);
    });

    it('should still accept all existing filter fields', () => {
      const filter: ProductoFilter = {
        categoriaId: 'cat-1',
        subcategoriaId: 'sub-1',
        destacado: true,
        publicado: true,
        search: 'bomba',
        sortBy: 'precio.valor',
        sortDir: 'asc',
        page: 1,
        limit: 10,
      };

      expect(filter.categoriaId).toBe('cat-1');
      expect(filter.search).toBe('bomba');
      expect(filter.sortBy).toBe('precio.valor');
      expect(filter.page).toBe(1);
      expect(filter.limit).toBe(10);
    });
  });
});
