/**
 * In-memory fake Firestore for backend unit and e2e tests.
 *
 * Supports the subset of the Firestore API used by the repository layer:
 * collection → doc / add / where / orderBy / select / offset / limit / count / get.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FakeFirestoreData = Record<string, unknown>;

export interface FakeDocSnapshot {
  id: string;
  exists: boolean;
  data(): FakeFirestoreData | undefined;
  ref: FakeDocRef;
}

export interface FakeDocRef {
  id: string;
  get(): Promise<FakeDocSnapshot>;
  set(data: FakeFirestoreData): Promise<void>;
  update(data: Partial<FakeFirestoreData>): Promise<void>;
  delete(): Promise<void>;
}

export interface FakeQuerySnapshot {
  docs: FakeDocSnapshot[];
  size: number;
  empty: boolean;
}

export interface FakeCountQuerySnapshot {
  data(): { count: number };
}

export interface FakeCollectionRef {
  doc(id?: string): FakeDocRef;
  add(data: FakeFirestoreData): Promise<{ id: string }>;
  where(field: string, op: string, value: unknown): FakeCollectionRef;
  orderBy(field: string, direction?: 'asc' | 'desc'): FakeCollectionRef;
  select(...fields: string[]): FakeCollectionRef;
  offset(n: number): FakeCollectionRef;
  limit(n: number): FakeCollectionRef;
  count(): { get(): Promise<FakeCountQuerySnapshot> };
  get(): Promise<FakeQuerySnapshot>;
}

export interface Firestore {
  collection(name: string): FakeCollectionRef;
  listCollections(): Promise<Array<{ id: string }>>;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

let autoIdCounter = 0;
const generateId = (): string => {
  autoIdCounter += 1;
  return `auto-${autoIdCounter}-${Math.random().toString(36).slice(2, 8)}`;
};

export function createFakeFirestore(
  seedData?: Record<string, FakeFirestoreData[]>,
): Firestore {
  // store: collectionName → Map<docId, docData>
  const store = new Map<string, Map<string, FakeFirestoreData>>();

  // Seed initial data
  if (seedData) {
    for (const [collName, docs] of Object.entries(seedData)) {
      const collMap = new Map<string, FakeFirestoreData>();
      for (const doc of docs) {
        const id = (doc.id as string) ?? generateId();
        collMap.set(id, { ...doc, id });
      }
      store.set(collName, collMap);
    }
  }

  const ensureColl = (name: string): Map<string, FakeFirestoreData> => {
    if (!store.has(name)) {
      store.set(name, new Map());
    }
    return store.get(name)!;
  };

  const makeDocRef = (collName: string, docId: string): FakeDocRef => ({
    id: docId,
    async get(): Promise<FakeDocSnapshot> {
      const coll = ensureColl(collName);
      const data = coll.get(docId);
      return {
        id: docId,
        exists: data !== undefined,
        data: () => (data !== undefined ? { ...data } : undefined),
        ref: makeDocRef(collName, docId),
      };
    },
    async set(data: FakeFirestoreData): Promise<void> {
      const coll = ensureColl(collName);
      coll.set(docId, { ...data, id: docId });
    },
    async update(data: Partial<FakeFirestoreData>): Promise<void> {
      const coll = ensureColl(collName);
      const current = coll.get(docId);
      if (current !== undefined) {
        coll.set(docId, { ...current, ...data });
      }
    },
    async delete(): Promise<void> {
      const coll = ensureColl(collName);
      coll.delete(docId);
    },
  });

  const makeCollectionRef = (
    collName: string,
    filters: Array<[string, string, unknown]> = [],
    sortField: string | null = null,
    sortDir: 'asc' | 'desc' = 'asc',
    selectedFields: string[] | null = null,
    offsetN = 0,
    limitN: number | null = null,
  ): FakeCollectionRef => {
    const applyFilters = (docs: FakeDocSnapshot[]): FakeDocSnapshot[] =>
      docs.filter((d) =>
        filters.every(([field, op, val]) => {
          const docData = d.data();
          if (!docData) return false;
          if (op === '==') return docData[field] === val;
          return true;
        }),
      );

    const applySort = (docs: FakeDocSnapshot[]): FakeDocSnapshot[] => {
      if (!sortField) return docs;
      return [...docs].sort((a, b) => {
        const aVal = a.data()?.[sortField] ?? 0;
        const bVal = b.data()?.[sortField] ?? 0;
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDir === 'desc' ? -cmp : cmp;
      });
    };

    const applyProjection = (doc: FakeDocSnapshot): FakeDocSnapshot => {
      if (!selectedFields) return doc;
      const original = doc.data();
      if (!original) return doc;
      const projected: FakeFirestoreData = {};
      for (const f of selectedFields) {
        if (f in original) {
          projected[f] = original[f];
        }
      }
      return { ...doc, data: () => projected };
    };

    const resolveDocs = (): FakeDocSnapshot[] => {
      const coll = ensureColl(collName);
      let docs: FakeDocSnapshot[] = Array.from(coll.entries()).map(
        ([id, data]) => ({
          id,
          exists: true,
          data: () => ({ ...data }),
          ref: makeDocRef(collName, id),
        }),
      );
      docs = applyFilters(docs);
      docs = applySort(docs);
      return docs;
    };

    return {
      doc(id?: string): FakeDocRef {
        const docId = id ?? generateId();
        return makeDocRef(collName, docId);
      },

      async add(data: FakeFirestoreData): Promise<{ id: string }> {
        const id = generateId();
        await makeDocRef(collName, id).set(data);
        return { id };
      },

      where(field: string, op: string, value: unknown): FakeCollectionRef {
        return makeCollectionRef(
          collName,
          [...filters, [field, op, value]],
          sortField,
          sortDir,
          selectedFields,
          offsetN,
          limitN,
        );
      },

      orderBy(
        field: string,
        direction: 'asc' | 'desc' = 'asc',
      ): FakeCollectionRef {
        return makeCollectionRef(
          collName,
          filters,
          field,
          direction,
          selectedFields,
          offsetN,
          limitN,
        );
      },

      select(...fields: string[]): FakeCollectionRef {
        return makeCollectionRef(
          collName,
          filters,
          sortField,
          sortDir,
          fields,
          offsetN,
          limitN,
        );
      },

      offset(n: number): FakeCollectionRef {
        return makeCollectionRef(
          collName,
          filters,
          sortField,
          sortDir,
          selectedFields,
          n,
          limitN,
        );
      },

      limit(n: number): FakeCollectionRef {
        return makeCollectionRef(
          collName,
          filters,
          sortField,
          sortDir,
          selectedFields,
          offsetN,
          n,
        );
      },

      count() {
        return {
          async get(): Promise<FakeCountQuerySnapshot> {
            const docs = resolveDocs();
            return { data: () => ({ count: docs.length }) };
          },
        };
      },

      async get(): Promise<FakeQuerySnapshot> {
        let docs = resolveDocs();
        docs = docs.slice(offsetN);
        if (limitN !== null) {
          docs = docs.slice(0, limitN);
        }
        docs = docs.map(applyProjection);
        return { docs, size: docs.length, empty: docs.length === 0 };
      },
    };
  };

  return {
    collection(name: string): FakeCollectionRef {
      return makeCollectionRef(name);
    },
    async listCollections(): Promise<Array<{ id: string }>> {
      return Array.from(store.keys()).map((name) => ({ id: name }));
    },
  };
}
