import { getFirestore } from 'firebase-admin/firestore';
jest.mock('firebase-admin/firestore');
import { CotizacionRepository } from './cotizacion.repository';

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

describe('CotizacionRepository', () => {
  let repo: CotizacionRepository;

  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
    (getFirestore as jest.Mock).mockReturnValue(fakeFirestore);
    repo = new CotizacionRepository(fakeFirestore);
  });

  const baseCotizacion = () => ({
    nombre: 'Juan',
    email: 'juan@example.com',
    telefono: '+56912345678',
    nombre_empresa: 'Riff SpA',
    rut: '12345678-9',
    mensaje: 'Solicito cotización',
    estado: 'pendiente',
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  });

  describe('create', () => {
    it('writes a cotizacion doc with fields and timestamps and returns the id', async () => {
      const result = await repo.create({
        nombre: 'Juan',
        email: 'juan@example.com',
        nombre_empresa: 'Riff SpA',
        mensaje: 'Solicito cotización',
      });
      expect(result.id).toBeTruthy();
      expect(store.get(`cotizaciones/${result.id}`)).toMatchObject({
        nombre: 'Juan',
        email: 'juan@example.com',
        estado: 'pendiente',
      });
      expect(result.creadoEn).toBeInstanceOf(Date);
    });

    it('sets nullable fields to null when omitted', async () => {
      const result = await repo.create({
        nombre: 'Juan',
        email: 'juan@example.com',
        nombre_empresa: 'Riff SpA',
        mensaje: 'Solicito cotización',
      });
      expect(result.telefono).toBeNull();
      expect(result.rut).toBeNull();
    });

    it('persists provided telefono and rut', async () => {
      const result = await repo.create({
        nombre: 'Juan',
        email: 'juan@example.com',
        telefono: '+56912345678',
        nombre_empresa: 'Riff SpA',
        rut: '12345678-9',
        mensaje: 'Solicito cotización',
      });
      expect(result.telefono).toBe('+56912345678');
      expect(result.rut).toBe('12345678-9');
    });
  });

  describe('findById', () => {
    it('returns the cotizacion with its id', async () => {
      store.set('cotizaciones/c1', baseCotizacion());
      expect((await repo.findById('c1'))?.id).toBe('c1');
    });

    it('returns null when missing', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all cotizaciones with total', async () => {
      store.set('cotizaciones/c1', baseCotizacion());
      store.set('cotizaciones/c2', { ...baseCotizacion(), email: 'otro@example.com' });
      const result = await repo.findAll({});
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('filters by estado', async () => {
      store.set('cotizaciones/c1', baseCotizacion());
      store.set('cotizaciones/c2', { ...baseCotizacion(), estado: 'atendida' });
      const result = await repo.findAll({ estado: 'pendiente' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].estado).toBe('pendiente');
    });

    it('paginates results', async () => {
      store.set('cotizaciones/c1', baseCotizacion());
      store.set('cotizaciones/c2', { ...baseCotizacion(), email: 'b@example.com' });
      store.set('cotizaciones/c3', { ...baseCotizacion(), email: 'c@example.com' });
      const page1 = await repo.findAll({ page: 1, limit: 2 });
      expect(page1.data).toHaveLength(2);
      expect(page1.total).toBe(3);
      const page2 = await repo.findAll({ page: 2, limit: 2 });
      expect(page2.data).toHaveLength(1);
      expect(page2.total).toBe(3);
    });
  });

  describe('updateEstado', () => {
    it('updates the estado and returns the updated cotizacion', async () => {
      store.set('cotizaciones/c1', baseCotizacion());
      const updated = await repo.updateEstado('c1', 'atendida');
      expect(store.get('cotizaciones/c1')?.estado).toBe('atendida');
      expect(updated.estado).toBe('atendida');
    });

    it('throws when the doc does not exist after update', async () => {
      await expect(repo.updateEstado('missing', 'atendida')).rejects.toThrow(
        'Cotizacion not found after update',
      );
    });
  });

  describe('timestamp normalization (toDate)', () => {
    it('parses a Firestore-like Timestamp and a missing timestamp', async () => {
      const timestampLike = { toDate: () => new Date('2019-05-05') };
      store.set('cotizaciones/c1', { ...baseCotizacion(), creadoEn: timestampLike as never });
      store.set('cotizaciones/c2', { ...baseCotizacion(), creadoEn: undefined as never });
      const c1 = await repo.findById('c1');
      const c2 = await repo.findById('c2');
      expect(c1?.creadoEn).toEqual(new Date('2019-05-05'));
      expect(c2?.creadoEn).toBeUndefined();
    });
  });
});
