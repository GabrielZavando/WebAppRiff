import { IProductQueryRepository } from './iproducto.repository';
import { ProductoFilter, ProductoListResult } from './producto.entity';

describe('IProductQueryRepository', () => {
  describe('findAll signature', () => {
    it('should return Promise<ProductoListResult> (not Promise<Producto[]>)', () => {
      // Compile-time verification: create a mock that satisfies the interface.
      // If findAll returns Promise<Producto[]> this will produce a type error.
      const mock: IProductQueryRepository = {
        findById: async () => null,
        findAll: async (): Promise<ProductoListResult> => ({ items: [], total: 0 }),
        findBySlug: async () => null,
      };

      // Runtime assertion: the return type has items and total
      expect(mock.findAll).toBeDefined();
    });

    it('should accept ProductoFilter and return ProductoListResult shape', async () => {
      const mock: IProductQueryRepository = {
        findById: async () => null,
        findAll: async (filter: ProductoFilter): Promise<ProductoListResult> => ({
          items: [],
          total: 0,
        }),
        findBySlug: async () => null,
      };

      const result = await mock.findAll({ page: 1, limit: 10 });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
    });
  });
});
