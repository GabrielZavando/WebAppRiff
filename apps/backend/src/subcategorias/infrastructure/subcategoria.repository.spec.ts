import { getFirestore } from 'firebase-admin/firestore';
jest.mock('firebase-admin/firestore');
import { SubcategoriaRepository } from './subcategoria.repository';

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

describe('SubcategoriaRepository', () => {
  let repo: SubcategoriaRepository;

  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
    (getFirestore as jest.Mock).mockReturnValue(fakeFirestore);
    repo = new SubcategoriaRepository(fakeFirestore);
  });

  const baseSub = () => ({
    categoriaId: 'cat-1',
    nombre: 'Válvulas',
    slug: 'valvulas',
    orden: 1,
    activa: true,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  });

  describe('create', () => {
    it('writes a subcategoria doc with the given fields and returns the id', async () => {
      const result = await repo.create({
        categoriaId: 'cat-1',
        nombre: 'Válvulas',
        slug: 'valvulas',
        orden: 2,
        activa: true,
      });
      expect(result.id).toBeTruthy();
      expect(store.get(`subcategorias/${result.id}`)).toMatchObject({
        categoriaId: 'cat-1',
        nombre: 'Válvulas',
        slug: 'valvulas',
        orden: 2,
        activa: true,
      });
    });
  });

  describe('findAll', () => {
    it('returns all subcategorias', async () => {
      store.set('subcategorias/s1', baseSub());
      store.set('subcategorias/s2', { ...baseSub(), id: 's2', categoriaId: 'cat-2' });
      expect(await repo.findAll()).toHaveLength(2);
    });

    it('filters by categoriaId and activa', async () => {
      store.set('subcategorias/s1', baseSub());
      store.set('subcategorias/s2', { ...baseSub(), id: 's2', categoriaId: 'cat-2', activa: false });
      expect(await repo.findAll({ categoriaId: 'cat-1' })).toHaveLength(1);
      expect(await repo.findAll({ activa: true })).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('returns the subcategoria with its id', async () => {
      store.set('subcategorias/s1', baseSub());
      expect((await repo.findById('s1'))?.id).toBe('s1');
    });

    it('returns null when missing', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findByCategoriaAndSlug', () => {
    it('returns the matching subcategoria', async () => {
      store.set('subcategorias/s1', baseSub());
      const sub = await repo.findByCategoriaAndSlug('cat-1', 'valvulas');
      expect(sub?.id).toBe('s1');
    });

    it('returns null when no match', async () => {
      expect(await repo.findByCategoriaAndSlug('cat-1', 'nope')).toBeNull();
    });
  });

  describe('existsById', () => {
    it('returns true when present', async () => {
      store.set('subcategorias/s1', baseSub());
      expect(await repo.existsById('s1')).toBe(true);
    });

    it('returns false when missing', async () => {
      expect(await repo.existsById('missing')).toBe(false);
    });
  });

  describe('belongsToCategoria', () => {
    it('returns true when the subcategoria belongs to the category', async () => {
      store.set('subcategorias/s1', baseSub());
      expect(await repo.belongsToCategoria('s1', 'cat-1')).toBe(true);
    });

    it('returns false when it belongs to a different category', async () => {
      store.set('subcategorias/s1', baseSub());
      expect(await repo.belongsToCategoria('s1', 'cat-2')).toBe(false);
    });
  });

  describe('hasAssociatedProducts', () => {
    it('returns true when a product references the subcategoria', async () => {
      store.set('productos/p1', { subcategoriaId: 's1' });
      expect(await repo.hasAssociatedProducts('s1')).toBe(true);
    });

    it('returns false when no product references it', async () => {
      expect(await repo.hasAssociatedProducts('s1')).toBe(false);
    });
  });

  describe('update', () => {
    it('updates the doc and returns the merged subcategoria', async () => {
      store.set('subcategorias/s1', baseSub());
      const updated = await repo.update('s1', { nombre: 'Nuevo', slug: 'nuevo' });
      expect(store.get('subcategorias/s1')?.nombre).toBe('Nuevo');
      expect(updated.nombre).toBe('Nuevo');
      expect(updated.slug).toBe('nuevo');
    });
  });

  describe('remove', () => {
    it('deletes the doc', async () => {
      store.set('subcategorias/s1', baseSub());
      await repo.remove('s1');
      expect(store.has('subcategorias/s1')).toBe(false);
    });
  });
});
