import { getFirestore } from 'firebase-admin/firestore';
jest.mock('firebase-admin/firestore');
import { CategoriaRepository } from './categoria.repository';

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

const collectionRef = (coll: string, filters: Array<[string, string, unknown]> = []): CollectionRef => {
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

describe('CategoriaRepository', () => {
  let repo: CategoriaRepository;

  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
    (getFirestore as jest.Mock).mockReturnValue(fakeFirestore);
    repo = new CategoriaRepository(fakeFirestore);
  });

  const baseCategoria = () => ({
    nombre: 'Válvulas',
    slug: 'valvulas',
    orden: 1,
    activa: true,
    esDefault: false,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  });

  describe('create', () => {
    it('writes a categoria doc with esDefault false and returns the id', async () => {
      const result = await repo.create({ nombre: 'Válvulas', slug: 'valvulas', orden: 2, activa: true });
      expect(result.id).toBeTruthy();
      expect(result.esDefault).toBe(false);
      expect(store.get(`categorias/${result.id}`)).toMatchObject({
        nombre: 'Válvulas',
        slug: 'valvulas',
        esDefault: false,
      });
    });

    it('uses the provided id when given (deterministic seed id)', async () => {
      const result = await repo.create({
        nombre: 'Medición de Fluidos',
        slug: 'medicion-de-fluidos',
        orden: 1,
        activa: true,
        id: 'medicion-de-fluidos',
      });
      expect(result.id).toBe('medicion-de-fluidos');
      expect(store.has('categorias/medicion-de-fluidos')).toBe(true);
    });

    it('honors esDefault true when provided', async () => {
      const result = await repo.create({
        nombre: 'Sin categoría',
        slug: 'sin-categoria',
        orden: 0,
        activa: true,
        id: 'sin-categoria',
        esDefault: true,
      });
      expect(result.esDefault).toBe(true);
      expect(store.get('categorias/sin-categoria')?.esDefault).toBe(true);
    });
  });

  describe('findAll', () => {
    it('returns all categories', async () => {
      store.set('categorias/c1', baseCategoria());
      store.set('categorias/c2', { ...baseCategoria(), id: 'c2', activa: false });
      const all = await repo.findAll();
      expect(all).toHaveLength(2);
    });

    it('filters by activa when provided', async () => {
      store.set('categorias/c1', baseCategoria());
      store.set('categorias/c2', { ...baseCategoria(), id: 'c2', activa: false });
      const active = await repo.findAll({ activa: true });
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('c1');
    });
  });

  describe('findById', () => {
    it('returns the category with its id', async () => {
      store.set('categorias/c1', baseCategoria());
      const cat = await repo.findById('c1');
      expect(cat?.id).toBe('c1');
    });

    it('returns null when missing', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('returns the matching category', async () => {
      store.set('categorias/c1', baseCategoria());
      const cat = await repo.findBySlug('valvulas');
      expect(cat?.id).toBe('c1');
    });

    it('returns null when no match', async () => {
      expect(await repo.findBySlug('nope')).toBeNull();
    });
  });

  describe('update', () => {
    it('updates the doc and returns the merged category', async () => {
      store.set('categorias/c1', baseCategoria());
      const updated = await repo.update('c1', { nombre: 'Nuevo', slug: 'nuevo' });
      expect(store.get('categorias/c1')?.nombre).toBe('Nuevo');
      expect(updated.nombre).toBe('Nuevo');
      expect(updated.slug).toBe('nuevo');
    });
  });

  describe('remove', () => {
    it('deletes the doc', async () => {
      store.set('categorias/c1', baseCategoria());
      await repo.remove('c1');
      expect(store.has('categorias/c1')).toBe(false);
    });
  });

  describe('hasAssociatedProducts', () => {
    it('returns true when a product references the category', async () => {
      store.set('productos/p1', { categoriaId: 'c1' });
      expect(await repo.hasAssociatedProducts('c1')).toBe(true);
    });

    it('returns false when no product references the category', async () => {
      expect(await repo.hasAssociatedProducts('c1')).toBe(false);
    });
  });

  describe('ensureDefault', () => {
    it('creates the default category when missing', async () => {
      await repo.ensureDefault();
      const def = store.get('categorias/sin-categoria');
      expect(def).toMatchObject({ esDefault: true, nombre: 'Sin categoría', slug: 'sin-categoria' });
    });

    it('is idempotent (does not overwrite an existing default)', async () => {
      store.set('categorias/sin-categoria', { ...baseCategoria(), esDefault: true, nombre: 'Original' });
      await repo.ensureDefault();
      expect(store.get('categorias/sin-categoria')?.nombre).toBe('Original');
    });
  });
});
