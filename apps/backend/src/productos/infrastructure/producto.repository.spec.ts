import { getFirestore } from 'firebase-admin/firestore';
jest.mock('firebase-admin/firestore');
import { ProductoRepository, toProductoCard, CARD_FIELDS } from './producto.repository';
import { ProductoCard } from '../domain/producto.entity';

const store = new Map<string, Record<string, unknown>>();

type DocRef = {
  id: string;
  set: jest.Mock;
  get: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

const makeDoc = (coll: string, id: string): DocRef => ({
  id,
  set: jest.fn(async (data: Record<string, unknown>) => {
    store.set(`${coll}/${id}`, { ...data, id });
  }),
  get: jest.fn(async () => {
    const data = store.get(`${coll}/${id}`);
    return { exists: data !== undefined, id, data: () => data, ref: makeDoc(coll, id) };
  }),
  update: jest.fn(async (data: Record<string, unknown>) => {
    if (!store.has(`${coll}/${id}`)) return;
    const cur = store.get(`${coll}/${id}`) ?? {};
    store.set(`${coll}/${id}`, { ...cur, ...data });
  }),
  delete: jest.fn(async () => {
    store.delete(`${coll}/${id}`);
  }),
});

type FakeDoc = { id: string; data: () => Record<string, unknown>; ref: DocRef };

type CollectionRef = {
  doc: jest.Mock;
  add: jest.Mock;
  where: jest.Mock;
  limit: jest.Mock;
  offset: jest.Mock;
  orderBy: jest.Mock;
  select: jest.Mock;
  count: jest.Mock;
  get: jest.Mock;
};

const collectionRef = (
  coll: string,
  filters: Array<[string, string, unknown]> = [],
  orderField?: string,
  orderDir?: string,
  selectFields?: string[],
  offsetN?: number,
  limitN?: number,
): CollectionRef => {
  const apply = (list: FakeDoc[]) =>
    list.filter((d) => filters.every(([f, op, v]) => (op === '==' ? d.data()[f] === v : true)));
  return {
    doc: jest.fn((id?: string) => makeDoc(coll, id ?? `auto-${Math.random().toString(36).slice(2)}`)),
    add: jest.fn(async (data: Record<string, unknown>) => {
      const id = `auto-${Math.random().toString(36).slice(2)}`;
      await makeDoc(coll, id).set(data);
      return { id };
    }),
    where: jest.fn((field: string, op: string, value: unknown) =>
      collectionRef(coll, [...filters, [field, op, value]], orderField, orderDir, selectFields, offsetN, limitN),
    ),
    limit: jest.fn((n: number) => collectionRef(coll, filters, orderField, orderDir, selectFields, offsetN, n)),
    offset: jest.fn((n: number) => collectionRef(coll, filters, orderField, orderDir, selectFields, n, limitN)),
    orderBy: jest.fn((field: string, dir?: string) =>
      collectionRef(coll, filters, field, dir, selectFields, offsetN, limitN),
    ),
    select: jest.fn((...fields: string[]) =>
      collectionRef(coll, filters, orderField, orderDir, fields, offsetN, limitN),
    ),
    count: jest.fn(() => ({
      get: jest.fn(async () => {
        let docs = Array.from(store.entries())
          .filter(([k]) => k.startsWith(`${coll}/`))
          .map(([k, data]) => ({ id: k.split('/')[1], data: () => data, ref: makeDoc(coll, k.split('/')[1]) }));
        docs = apply(docs);
        return { data: () => ({ count: docs.length }) };
      }),
    })),
    get: jest.fn(async () => {
      let docs = Array.from(store.entries())
        .filter(([k]) => k.startsWith(`${coll}/`))
        .map(([k, data]) => ({ id: k.split('/')[1], data: () => data, ref: makeDoc(coll, k.split('/')[1]) }));
      docs = apply(docs);

      // Sort
      if (orderField) {
        const dir = orderDir === 'desc' ? -1 : 1;
        docs.sort((a, b) => {
          const av = (a.data() as Record<string, unknown>)[orderField];
          const bv = (b.data() as Record<string, unknown>)[orderField];
          const avNum = av && typeof (av as { toDate?: () => Date }).toDate === 'function'
            ? (av as { toDate: () => Date }).toDate().getTime()
            : av instanceof Date
              ? av.getTime()
              : (av as number) ?? 0;
          const bvNum = bv && typeof (bv as { toDate?: () => Date }).toDate === 'function'
            ? (bv as { toDate: () => Date }).toDate().getTime()
            : bv instanceof Date
              ? bv.getTime()
              : (bv as number) ?? 0;
          if (avNum < bvNum) return -1 * dir;
          if (avNum > bvNum) return 1 * dir;
          return 0;
        });
      }

      // Offset
      if (offsetN && offsetN > 0) {
        docs = docs.slice(offsetN);
      }

      // Limit
      if (limitN !== undefined) {
        docs = docs.slice(0, limitN);
      }

      return { docs, empty: docs.length === 0, size: docs.length };
    }),
  };
};

const fakeFirestore = { collection: jest.fn((c: string) => collectionRef(c)) } as never;

describe('ProductoRepository', () => {
  let repo: ProductoRepository;

  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
    (getFirestore as jest.Mock).mockReturnValue(fakeFirestore);
    repo = new ProductoRepository(fakeFirestore);
  });

  const baseProduct = () => ({
    idExterno: null,
    sku: 'SKU-1',
    titulo: 'Válvula',
    slug: 'valvula',
    descripcionBreve: 'Breve',
    descripcionLarga: '',
    categoriaId: 'cat-1',
    subcategoriaId: null,
    atributos: [],
    precio: { valor: 100, visible: true },
    stock: { disponible: true, cantidad: null },
    galeria: [],
    fichaTecnica: null,
    destacado: false,
    publicado: true,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  });

  describe('create', () => {
    it('writes a producto doc with fields and timestamps and returns the id', async () => {
      const result = await repo.create({
        sku: 'SKU-1',
        titulo: 'Válvula',
        slug: 'valvula',
        descripcionBreve: 'Breve',
        descripcionLarga: '',
        categoriaId: 'cat-1',
        subcategoriaId: null,
        atributos: [],
        precio: { valor: 100, visible: true },
        stock: { disponible: true, cantidad: null },
        galeria: [],
        fichaTecnica: null,
        destacado: false,
        publicado: true,
      });
      expect(result.id).toBeTruthy();
      expect(store.get(`productos/${result.id}`)).toMatchObject({
        sku: 'SKU-1',
        categoriaId: 'cat-1',
      });
      expect(result.creadoEn).toBeInstanceOf(Date);
    });

    it('uses the explicit id when provided instead of auto-generating', async () => {
      const result = await repo.create({
        id: 'prod-001',
        sku: 'SKU-1',
        titulo: 'Válvula',
        slug: 'valvula',
        descripcionBreve: 'Breve',
        descripcionLarga: '',
        categoriaId: 'cat-1',
        subcategoriaId: null,
        atributos: [],
        precio: { valor: 100, visible: true },
        stock: { disponible: true, cantidad: null },
        galeria: [],
        fichaTecnica: null,
        destacado: false,
        publicado: true,
      });
      expect(result.id).toBe('prod-001');
      expect(store.get('productos/prod-001')).toMatchObject({
        sku: 'SKU-1',
        categoriaId: 'cat-1',
      });
    });
  });

  describe('findById', () => {
    it('returns the producto with its id', async () => {
      store.set('productos/p1', baseProduct());
      expect((await repo.findById('p1'))?.id).toBe('p1');
    });

    it('returns null when missing', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('returns the matching producto', async () => {
      store.set('productos/p1', baseProduct());
      expect((await repo.findBySlug('valvula'))?.id).toBe('p1');
    });

    it('returns null when no match', async () => {
      expect(await repo.findBySlug('nope')).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all productos', async () => {
      store.set('productos/p1', baseProduct());
      store.set('productos/p2', { ...baseProduct(), id: 'p2', sku: 'SKU-2', categoriaId: 'cat-2' });
      const result = await repo.findAll({});
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('filters by categoriaId, subcategoriaId, destacado and publicado', async () => {
      store.set('productos/p1', baseProduct());
      store.set('productos/p2', {
        ...baseProduct(),
        id: 'p2',
        sku: 'SKU-2',
        categoriaId: 'cat-2',
        destacado: true,
        publicado: false,
        subcategoriaId: 'sub-1',
      });
      expect((await repo.findAll({ categoriaId: 'cat-1' })).items).toHaveLength(1);
      expect((await repo.findAll({ subcategoriaId: 'sub-1' })).items).toHaveLength(1);
      expect((await repo.findAll({ destacado: true })).items).toHaveLength(1);
      expect((await repo.findAll({ publicado: false })).items).toHaveLength(1);
    });

    it('filters by search term across titulo, sku and descripcionBreve', async () => {
      store.set('productos/p1', baseProduct());
      store.set('productos/p2', {
        ...baseProduct(),
        id: 'p2',
        sku: 'SKU-9-TUBO',
        titulo: 'Tubo',
        descripcionBreve: 'Conexión rápida',
      });
      expect((await repo.findAll({ search: 'tubo' })).items).toHaveLength(1);
      expect((await repo.findAll({ search: 'SKU-9' })).items).toHaveLength(1);
      expect((await repo.findAll({ search: 'rápida' })).items).toHaveLength(1);
      expect((await repo.findAll({ search: 'zzz' })).items).toHaveLength(0);
    });

    it('sorts by titulo ascending and descending', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', titulo: 'Beta' });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', titulo: 'Alfa' });
      store.set('productos/p3', { ...baseProduct(), id: 'p3', titulo: 'Gamma' });
      const asc = await repo.findAll({ sortBy: 'titulo', sortDir: 'asc' });
      expect(asc.items.map((p) => p.titulo)).toEqual(['Alfa', 'Beta', 'Gamma']);
      const desc = await repo.findAll({ sortBy: 'titulo', sortDir: 'desc' });
      expect(desc.items.map((p) => p.titulo)).toEqual(['Gamma', 'Beta', 'Alfa']);
    });

    it('resolves equal sort keys without error', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', titulo: 'Igual' });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', titulo: 'Igual' });
      const result = await repo.findAll({ sortBy: 'titulo' });
      expect(result.items).toHaveLength(2);
    });

    it('sorts by precio.valor and by creadoEn (missing timestamp treated as 0)', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', creadoEn: new Date('2020-01-01'), precio: { valor: 100, visible: true } });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', creadoEn: undefined as never, precio: { valor: 200, visible: true } });
      const byPrecio = await repo.findAll({ sortBy: 'precio.valor', sortDir: 'desc' });
      expect(byPrecio.items.map((p) => p.id)).toEqual(['p2', 'p1']);
      const byCreado = await repo.findAll({ sortBy: 'creadoEn', sortDir: 'asc' });
      expect(byCreado.items.map((p) => p.id)).toEqual(['p2', 'p1']);
    });

    it('ignores unknown sort fields via default branch', async () => {
      store.set('productos/p1', baseProduct());
      store.set('productos/p2', { ...baseProduct(), id: 'p2', sku: 'SKU-2' });
      const result = await repo.findAll({ sortBy: 'unknown' as never });
      expect(result.items).toHaveLength(2);
    });

    it('hits sortValue default branch with search + unknown sortBy (in-memory path)', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', titulo: 'Valvula' });
      const result = await repo.findAll({ search: 'valv', sortBy: 'unknown' as never });
      expect(result.items).toHaveLength(1);
    });
  });

  describe('timestamp normalization (toDate)', () => {
    it('parses a Firestore-like Timestamp and a missing timestamp', async () => {
      const timestampLike = { toDate: () => new Date('2019-05-05') };
      store.set('productos/p1', { ...baseProduct(), creadoEn: timestampLike as never });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', creadoEn: undefined as never });
      const p1 = await repo.findById('p1');
      const p2 = await repo.findById('p2');
      expect(p1?.creadoEn).toEqual(new Date('2019-05-05'));
      expect(p2?.creadoEn).toBeUndefined();
    });
  });

  describe('update', () => {
    it('updates the doc and returns the merged producto', async () => {
      store.set('productos/p1', baseProduct());
      const updated = await repo.update('p1', { titulo: 'Nuevo', publicado: false });
      expect(store.get('productos/p1')?.titulo).toBe('Nuevo');
      expect(updated.titulo).toBe('Nuevo');
      expect(updated.publicado).toBe(false);
    });

    it('throws when the doc does not exist after update', async () => {
      await expect(repo.update('missing', { titulo: 'x' })).rejects.toThrow(
        'Producto not found after update',
      );
    });
  });

  describe('remove', () => {
    it('deletes the doc', async () => {
      store.set('productos/p1', baseProduct());
      await repo.remove('p1');
      expect(store.has('productos/p1')).toBe(false);
    });
  });

  // ─── T4.1 — toProductoCard ────────────────────────────────────

  describe('toProductoCard', () => {
    it('converts a full Firestore document into ProductoCard', () => {
      const doc = {
        sku: 'SKU-1',
        titulo: 'Válvula',
        slug: 'valvula',
        descripcionBreve: 'Breve',
        categoriaId: 'cat-1',
        subcategoriaId: null,
        precio: { valor: 100, visible: true },
        destacado: false,
        publicado: true,
        creadoEn: new Date('2025-01-15'),
        galeria: [{ url: 'img.jpg', storagePath: '/img', alt: 'alt', orden: 0 }],
      };
      const card = toProductoCard('p1', doc);
      expect(card.id).toBe('p1');
      expect(card.sku).toBe('SKU-1');
      expect(card.titulo).toBe('Válvula');
      expect(card.slug).toBe('valvula');
      expect(card.descripcionBreve).toBe('Breve');
      expect(card.categoriaId).toBe('cat-1');
      expect(card.subcategoriaId).toBeNull();
      expect(card.precio).toEqual({ valor: 100, visible: true });
      expect(card.destacado).toBe(false);
      expect(card.publicado).toBe(true);
      expect(card.creadoEn).toEqual(new Date('2025-01-15'));
      expect(card.galeria).toHaveLength(1);
    });

    it('applies correct defaults for missing optional fields', () => {
      const doc = {
        sku: 'SKU-2',
        titulo: 'Tubo',
        slug: 'tubo',
        categoriaId: 'cat-1',
        precio: { valor: 50, visible: false },
        destacado: true,
        publicado: false,
        creadoEn: new Date('2025-06-01'),
      };
      const card = toProductoCard('p2', doc);
      expect(card.descripcionBreve).toBe('');
      expect(card.subcategoriaId).toBeNull();
      expect(card.galeria).toEqual([]);
      expect(card.precio).toEqual({ valor: 50, visible: false });
    });

    it('returns a ProductoCard (no heavy fields)', () => {
      const doc = {
        sku: 'SKU-3',
        titulo: 'Bomba',
        slug: 'bomba',
        descripcionBreve: 'Desc',
        categoriaId: 'cat-1',
        precio: { valor: 200, visible: true },
        destacado: false,
        publicado: true,
        creadoEn: new Date(),
        galeria: [],
        // Heavy fields present in raw doc — must NOT appear on card
        descripcionLarga: 'Larga',
        atributos: [],
        fichaTecnica: null,
        stock: { disponible: true, cantidad: 10 },
        actualizadoEn: new Date(),
        idExterno: 'ext-1',
      };
      const card = toProductoCard('p3', doc);
      expect(card).not.toHaveProperty('descripcionLarga');
      expect(card).not.toHaveProperty('atributos');
      expect(card).not.toHaveProperty('fichaTecnica');
      expect(card).not.toHaveProperty('stock');
      expect(card).not.toHaveProperty('actualizadoEn');
      expect(card).not.toHaveProperty('idExterno');
    });
  });

  // ─── T4.3 — CARD_FIELDS ──────────────────────────────────────

  describe('CARD_FIELDS', () => {
    it('contains the exact card projection fields', () => {
      const expected = [
        'id',
        'sku',
        'titulo',
        'slug',
        'descripcionBreve',
        'categoriaId',
        'subcategoriaId',
        'precio',
        'destacado',
        'publicado',
        'creadoEn',
        'galeria',
      ];
      expect(CARD_FIELDS).toEqual(expected);
    });
  });

  // ─── T4.5 — findAll native path (card projection, no search) ─

  describe('findAll — native path (card projection)', () => {
    it('returns ProductoListResult with items and total using native Firestore', async () => {
      store.set('productos/p1', baseProduct());
      store.set('productos/p2', { ...baseProduct(), id: 'p2', sku: 'SKU-2' });
      const result = await repo.findAll({ projection: 'card' });
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('returns ProductoCard (lean) items when projection is card', async () => {
      store.set('productos/p1', baseProduct());
      const result = await repo.findAll({ projection: 'card' });
      const card = result.items[0];
      expect(card).not.toHaveProperty('descripcionLarga');
      expect(card).not.toHaveProperty('atributos');
      expect(card).not.toHaveProperty('fichaTecnica');
      expect(card).not.toHaveProperty('stock');
      expect(card).not.toHaveProperty('actualizadoEn');
      expect(card).not.toHaveProperty('idExterno');
    });

    it('applies where filters and default orderBy (creadoEn desc) in native path', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', publicado: true, creadoEn: new Date('2025-01-01') });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', publicado: false, creadoEn: new Date('2025-06-01') });
      const result = await repo.findAll({ projection: 'card', publicado: true });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('p1');
      expect(result.total).toBe(1);
    });

    it('uses offset and limit for pagination in native path', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', titulo: 'A' });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', titulo: 'B' });
      store.set('productos/p3', { ...baseProduct(), id: 'p3', titulo: 'C' });
      const result = await repo.findAll({ projection: 'card', page: 2, limit: 1 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('p2');
      expect(result.total).toBe(3);
    });
  });

  // ─── T4.6 — findAll in-memory path (search) ──────────────────

  describe('findAll — in-memory path (search)', () => {
    it('fetches all docs, filters in-memory, returns paginated slice', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', titulo: 'Bomba Centrífuga', sku: 'BOM-01', descripcionBreve: 'Bomba de agua' });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', titulo: 'Tubo PVC', sku: 'TUB-02', descripcionBreve: 'Conexión' });
      store.set('productos/p3', { ...baseProduct(), id: 'p3', titulo: 'Bomba Sumergible', sku: 'BOM-03', descripcionBreve: 'Sumergible' });
      const result = await repo.findAll({ search: 'bomba', page: 1, limit: 1 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(2);
      expect(result.items[0].titulo).toContain('Bomba');
    });

    it('applies in-memory sort when search is present', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', titulo: 'Bomba Zeta' });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', titulo: 'Bomba Alpha' });
      const result = await repo.findAll({ search: 'bomba', sortBy: 'titulo', sortDir: 'asc' });
      expect(result.items.map((i) => i.titulo)).toEqual(['Bomba Alpha', 'Bomba Zeta']);
      expect(result.total).toBe(2);
    });

    it('returns card projection items via in-memory path when search is present', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', titulo: 'Bomba Centrífuga' });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', titulo: 'Tubo PVC' });
      const result = await repo.findAll({ search: 'bomba', projection: 'card' });
      expect(result.items).toHaveLength(1);
      const card = result.items[0];
      expect(card).not.toHaveProperty('descripcionLarga');
      expect(card).not.toHaveProperty('stock');
      expect(card).not.toHaveProperty('actualizadoEn');
    });
  });

  // ─── T4.7 — findAll in-memory path (alternative sortBy) ──────

  describe('findAll — in-memory path (alternative sortBy)', () => {
    it('fetches all docs, sorts in-memory by precio.valor, returns paginated slice', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', precio: { valor: 200, visible: true } });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', precio: { valor: 50, visible: true } });
      store.set('productos/p3', { ...baseProduct(), id: 'p3', precio: { valor: 100, visible: true } });
      const result = await repo.findAll({ sortBy: 'precio.valor', sortDir: 'asc', page: 1, limit: 2 });
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('p2'); // precio 50
      expect(result.items[1].id).toBe('p3'); // precio 100
      expect(result.total).toBe(3);
    });

    it('fetches all docs, sorts in-memory by titulo', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', titulo: 'Gamma' });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', titulo: 'Alpha' });
      store.set('productos/p3', { ...baseProduct(), id: 'p3', titulo: 'Beta' });
      const result = await repo.findAll({ sortBy: 'titulo', sortDir: 'asc', page: 1, limit: 10 });
      expect(result.items.map((i) => i.titulo)).toEqual(['Alpha', 'Beta', 'Gamma']);
      expect(result.total).toBe(3);
    });

    it('fetches all docs, sorts in-memory by actualizadoEn', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', actualizadoEn: new Date('2025-01-01') });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', actualizadoEn: new Date('2025-06-01') });
      const result = await repo.findAll({ sortBy: 'actualizadoEn', sortDir: 'desc' });
      expect(result.items[0].id).toBe('p2');
      expect(result.items[1].id).toBe('p1');
    });
  });

  // ─── T4.9 — count with same where filters ─────────────────────

  describe('findAll — count', () => {
    it('counts only docs matching where filters (native path)', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', publicado: true });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', publicado: false });
      store.set('productos/p3', { ...baseProduct(), id: 'p3', publicado: true });
      const result = await repo.findAll({ projection: 'card', publicado: true });
      expect(result.total).toBe(2);
    });

    it('counts all docs when no filters applied (native path)', async () => {
      store.set('productos/p1', baseProduct());
      store.set('productos/p2', { ...baseProduct(), id: 'p2' });
      const result = await repo.findAll({ projection: 'card' });
      expect(result.total).toBe(2);
    });
  });

  // ─── T4.11 — page beyond total ───────────────────────────────

  describe('findAll — page clamping', () => {
    it('clamps page to last valid page when page exceeds total pages', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', titulo: 'A', creadoEn: new Date('2025-01-01') });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', titulo: 'B', creadoEn: new Date('2025-06-01') });
      // 2 items, limit 1 → 2 pages; page 10 clamps to page 2
      // orderBy creadoEn desc → page 1 = p2, page 2 = p1
      const result = await repo.findAll({ projection: 'card', page: 10, limit: 1 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('p1'); // page 2 = oldest
      expect(result.total).toBe(2);
    });

    it('clamps page to last valid page', async () => {
      store.set('productos/p1', baseProduct());
      store.set('productos/p2', { ...baseProduct(), id: 'p2' });
      store.set('productos/p3', { ...baseProduct(), id: 'p3' });
      // 3 items, limit 2 → 2 pages; page 5 should clamp to page 2
      const result = await repo.findAll({ projection: 'card', page: 5, limit: 2 });
      expect(result.items).toHaveLength(1); // page 2 has 1 item
      expect(result.total).toBe(3);
      expect(result.items[0].id).toBe('p3');
    });

    it('clamps page for in-memory path too', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', titulo: 'A' });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', titulo: 'B' });
      const result = await repo.findAll({ search: 'x', sortBy: 'titulo', page: 99, limit: 10 });
      // search 'x' won't match anything → total=0, items=[]
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
