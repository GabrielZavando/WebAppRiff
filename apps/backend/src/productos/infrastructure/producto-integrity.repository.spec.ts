import { getFirestore } from 'firebase-admin/firestore';
jest.mock('firebase-admin/firestore');
import { ProductoIntegrityRepository } from './producto-integrity.repository';

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

describe('ProductoIntegrityRepository', () => {
  let repo: ProductoIntegrityRepository;

  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
    (getFirestore as jest.Mock).mockReturnValue(fakeFirestore);
    repo = new ProductoIntegrityRepository(fakeFirestore);
  });

  describe('existsBySku', () => {
    it('returns true when a product with the sku exists', async () => {
      store.set('productos/p1', { sku: 'SKU-1' });
      expect(await repo.existsBySku('SKU-1')).toBe(true);
    });

    it('returns false when no product has the sku', async () => {
      expect(await repo.existsBySku('SKU-X')).toBe(false);
    });

    it('excludes the given id (self-update does not collide)', async () => {
      store.set('productos/p1', { sku: 'SKU-1' });
      expect(await repo.existsBySku('SKU-1', 'p1')).toBe(false);
    });

    it('still detects a collision on a different id', async () => {
      store.set('productos/p1', { sku: 'SKU-1' });
      store.set('productos/p2', { sku: 'SKU-1' });
      expect(await repo.existsBySku('SKU-1', 'p1')).toBe(true);
    });
  });

  describe('existsBySlug', () => {
    it('returns true when a product with the slug exists', async () => {
      store.set('productos/p1', { slug: 'valvula' });
      expect(await repo.existsBySlug('valvula')).toBe(true);
    });

    it('returns false when no product has the slug', async () => {
      expect(await repo.existsBySlug('nope')).toBe(false);
    });

    it('excludes the given id', async () => {
      store.set('productos/p1', { slug: 'valvula' });
      expect(await repo.existsBySlug('valvula', 'p1')).toBe(false);
    });
  });
});
