import {
  CollectionReader,
  CollectionWriter,
  MigrationDeps,
  MigrationOptions,
  MigrationReport,
  runMigration,
  StorageCopier,
} from './migrate-firestore.use-case';

function fakeReader(docs: Array<{ id: string; data: Record<string, unknown> }>): CollectionReader {
  return { listAll: async () => docs };
}

function fakeWriter(
  store: Map<string, Record<string, unknown>>,
  writtenIds: string[] = [],
): CollectionWriter {
  return {
    exists: async (id: string) => store.has(id),
    write: async (id: string, data: Record<string, unknown>) => {
      store.set(id, data);
      writtenIds.push(id);
    },
  };
}

const productWithStorage = {
  id: 'p1',
  titulo: 'Producto',
  galeria: [
    { url: 'old/galeria/1.jpg', storagePath: 'galeria/1.jpg', alt: 'a', orden: 1 },
    { url: 'old/galeria/missing.jpg', storagePath: 'galeria/missing.jpg', alt: 'b', orden: 2 },
  ],
  fichaTecnica: { url: 'old/ficha/doc.pdf', storagePath: 'ficha/doc.pdf', nombreArchivo: 'doc.pdf' },
};

const copier: StorageCopier = {
  async copy(path: string) {
    if (path === 'galeria/1.jpg') {
      return { url: 'https://storage.googleapis.com/newbucket/galeria/1.jpg', storagePath: 'galeria/1.jpg' };
    }
    if (path === 'ficha/doc.pdf') {
      return { url: 'https://storage.googleapis.com/newbucket/ficha/doc.pdf', storagePath: 'ficha/doc.pdf' };
    }
    return null;
  },
};

describe('runMigration (use-case)', () => {
  const collections = ['categorias', 'subcategorias', 'productos', 'cotizaciones', 'usuarios'];
  const exclude = ['usuarios'];

  it('copia las colecciones preservando los IDs y excluye usuarios', async () => {
    const stores: Record<string, Map<string, Record<string, unknown>>> = {};
    const writers: Record<string, CollectionWriter> = {};
    const readers: Record<string, CollectionReader> = {};
    for (const c of collections) {
      stores[c] = new Map();
      writers[c] = fakeWriter(stores[c]);
      readers[c] = fakeReader([
        { id: `${c}-1`, data: { nombre: c } },
        { id: `${c}-2`, data: { nombre: `${c}-2` } },
      ]);
    }
    const usuariosStore = new Map<string, Record<string, unknown>>();
    writers.usuarios = fakeWriter(usuariosStore);
    readers.usuarios = fakeReader([{ id: 'u1', data: { rol: 'superadmin' } }]);

    const deps: MigrationDeps = { readers, writers, log: (): void => undefined };
    const options: MigrationOptions = { collections, exclude, dryRun: false };
    const report: MigrationReport = await runMigration(deps, options);

    const catalogCollections = ['categorias', 'subcategorias', 'productos', 'cotizaciones'];
    for (const c of catalogCollections) {
      expect(stores[c].has(`${c}-1`)).toBe(true);
      expect(stores[c].has(`${c}-2`)).toBe(true);
    }
    expect(usuariosStore.size).toBe(0);
    const usuariosReport = report.collections.find((r) => r.collection === 'usuarios');
    expect(usuariosReport?.excluded).toBe(true);
  });

  it('es idempotente: omite docs ya existentes en destino', async () => {
    const store = new Map<string, Record<string, unknown>>([['cat-1', { nombre: 'viejo' }]]);
    const writtenIds: string[] = [];
    const writers: Record<string, CollectionWriter> = { categorias: fakeWriter(store, writtenIds) };
    const readers: Record<string, CollectionReader> = {
      categorias: fakeReader([{ id: 'cat-1', data: { nombre: 'nuevo' } }]),
    };
    const deps: MigrationDeps = { readers, writers, log: (): void => undefined };
    const report = await runMigration(deps, { collections: ['categorias'], exclude, dryRun: false });

    expect(store.get('cat-1')).toEqual({ nombre: 'viejo' });
    expect(writtenIds).not.toContain('cat-1');
    expect(report.collections[0].skipped).toBe(1);
    expect(report.collections[0].written).toBe(0);
  });

  it('en dry-run no escribe nada y reporta lo que haría', async () => {
    const store = new Map<string, Record<string, unknown>>();
    const writtenIds: string[] = [];
    const writers: Record<string, CollectionWriter> = { productos: fakeWriter(store, writtenIds) };
    const readers: Record<string, CollectionReader> = {
      productos: fakeReader([{ id: 'p1', data: { titulo: 'x' } }]),
    };
    const deps: MigrationDeps = { readers, writers, log: (): void => undefined };
    const report = await runMigration(deps, { collections: ['productos'], exclude, dryRun: true });

    expect(writtenIds).toHaveLength(0);
    expect(report.collections[0].written).toBe(1);
  });

  it('reescribe Storage de productos y cuenta los blobs copiados', async () => {
    const store = new Map<string, Record<string, unknown>>();
    const writtenIds: string[] = [];
    const writers: Record<string, CollectionWriter> = { productos: fakeWriter(store, writtenIds) };
    const readers: Record<string, CollectionReader> = {
      productos: fakeReader([{ id: 'p1', data: productWithStorage }]),
    };
    const deps: MigrationDeps = { readers, writers, storageCopier: copier, log: (): void => undefined };
    const report = await runMigration(deps, { collections: ['productos'], exclude, dryRun: false });

    const saved = store.get('p1') as Record<string, unknown>;
    const galeria = saved.galeria as Array<{ url: string; storagePath: string }>;
    expect(galeria[0].url).toBe('https://storage.googleapis.com/newbucket/galeria/1.jpg');
    expect(galeria[1].url).toBe('old/galeria/missing.jpg'); // no encontrado -> se conserva
    const ficha = saved.fichaTecnica as { url: string; storagePath: string };
    expect(ficha.url).toBe('https://storage.googleapis.com/newbucket/ficha/doc.pdf');
    expect(report.storageBlobsCopied).toBe(2);
  });
});
