import { getFirestore } from 'firebase-admin/firestore';
jest.mock('firebase-admin/firestore');
import { ProductoRepository } from './producto.repository';

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
  get: jest.Mock;
};

const collectionRef = (
  coll: string,
  filters: Array<[string, string, unknown]> = [],
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
      collectionRef(coll, [...filters, [field, op, value]]),
    ),
    limit: jest.fn(() => collectionRef(coll, filters)),
    get: jest.fn(async () => {
      let docs = Array.from(store.entries())
        .filter(([k]) => k.startsWith(`${coll}/`))
        .map(([k, data]) => ({ id: k.split('/')[1], data: () => data, ref: makeDoc(coll, k.split('/')[1]) }));
      docs = apply(docs);
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
      expect(await repo.findAll({})).toHaveLength(2);
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
      expect(await repo.findAll({ categoriaId: 'cat-1' })).toHaveLength(1);
      expect(await repo.findAll({ subcategoriaId: 'sub-1' })).toHaveLength(1);
      expect(await repo.findAll({ destacado: true })).toHaveLength(1);
      expect(await repo.findAll({ publicado: false })).toHaveLength(1);
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
      expect(await repo.findAll({ search: 'tubo' })).toHaveLength(1);
      expect(await repo.findAll({ search: 'SKU-9' })).toHaveLength(1);
      expect(await repo.findAll({ search: 'rápida' })).toHaveLength(1);
      expect(await repo.findAll({ search: 'zzz' })).toHaveLength(0);
    });

    it('sorts by titulo ascending and descending', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', titulo: 'Beta' });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', titulo: 'Alfa' });
      store.set('productos/p3', { ...baseProduct(), id: 'p3', titulo: 'Gamma' });
      const asc = await repo.findAll({ sortBy: 'titulo', sortDir: 'asc' });
      expect(asc.map((p) => p.titulo)).toEqual(['Alfa', 'Beta', 'Gamma']);
      const desc = await repo.findAll({ sortBy: 'titulo', sortDir: 'desc' });
      expect(desc.map((p) => p.titulo)).toEqual(['Gamma', 'Beta', 'Alfa']);
    });

    it('resolves equal sort keys without error', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', titulo: 'Igual' });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', titulo: 'Igual' });
      const result = await repo.findAll({ sortBy: 'titulo' });
      expect(result).toHaveLength(2);
    });

    it('sorts by precio.valor and by creadoEn (missing timestamp treated as 0)', async () => {
      store.set('productos/p1', { ...baseProduct(), id: 'p1', creadoEn: new Date('2020-01-01'), precio: { valor: 100, visible: true } });
      store.set('productos/p2', { ...baseProduct(), id: 'p2', creadoEn: undefined as never, precio: { valor: 200, visible: true } });
      const byPrecio = await repo.findAll({ sortBy: 'precio.valor', sortDir: 'desc' });
      expect(byPrecio.map((p) => p.id)).toEqual(['p2', 'p1']);
      const byCreado = await repo.findAll({ sortBy: 'creadoEn', sortDir: 'asc' });
      expect(byCreado.map((p) => p.id)).toEqual(['p2', 'p1']);
    });

    it('ignores unknown sort fields via default branch', async () => {
      store.set('productos/p1', baseProduct());
      store.set('productos/p2', { ...baseProduct(), id: 'p2', sku: 'SKU-2' });
      const result = await repo.findAll({ sortBy: 'unknown' as never });
      expect(result).toHaveLength(2);
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
});
