import { Firestore } from 'firebase-admin/firestore';
import { ContactRepository } from './contact.repository';

interface StoredDoc {
  [key: string]: unknown;
}

const createMockFirestore = (): {
  firestore: { collection: (name: string) => unknown };
  docs: Map<string, StoredDoc>;
} => {
  const docs = new Map<string, StoredDoc>();
  let counter = 0;

  const collection = (collectionName: string): unknown => ({
    doc: (id?: string) => {
      counter += 1;
      const docId = id ?? `auto-${counter}`;
      return {
        id: docId,
        set: async (data: StoredDoc): Promise<void> => {
          docs.set(`${collectionName}/${docId}`, { ...data, id: docId });
        },
        get: async () => {
          const data = docs.get(`${collectionName}/${docId}`);
          return {
            id: docId,
            exists: data !== undefined,
            data: () => data,
          };
        },
      };
    },
  });

  return { firestore: { collection }, docs };
};

const buildRepository = (): {
  firestore: { collection: (name: string) => unknown };
  docs: Map<string, StoredDoc>;
  repository: ContactRepository;
} => {
  const { firestore, docs } = createMockFirestore();
  return {
    firestore,
    docs,
    repository: new ContactRepository(firestore as unknown as Firestore),
  };
};

describe('ContactRepository', () => {
  it('persists every field in the contactos collection', async () => {
    const { firestore, docs, repository } = buildRepository();

    const created = await repository.create({
      nombre: 'Ana López',
      empresa: 'Corp Ltda',
      email: 'ana@corp.com',
      telefono: '+56912345678',
      areasDeInteres: ['medicion-fluidos', 'tratamiento-agua'],
      mensaje: 'Necesito soporte técnico',
    });

    expect(created.id).toBeTruthy();
    expect(created.creadoEn).toBeInstanceOf(Date);
    expect(docs.get(`contactos/${created.id}`)).toMatchObject({
      nombre: 'Ana López',
      empresa: 'Corp Ltda',
      email: 'ana@corp.com',
      telefono: '+56912345678',
      areasDeInteres: ['medicion-fluidos', 'tratamiento-agua'],
      mensaje: 'Necesito soporte técnico',
    });

    const stored = await (
      firestore.collection('contactos') as {
        doc: (id: string) => { get: () => Promise<{ exists: boolean }> };
      }
    )
      .doc(created.id)
      .get();
    expect(stored.exists).toBe(true);
  });

  it('defaults areasDeInteres to an empty array', async () => {
    const { docs, repository } = buildRepository();

    const created = await repository.create({
      nombre: 'Ana',
      empresa: 'Corp',
      email: 'ana@corp.com',
      telefono: '123',
      mensaje: 'Hola',
    });

    expect(docs.get(`contactos/${created.id}`)).toMatchObject({
      areasDeInteres: [],
    });
  });
});
