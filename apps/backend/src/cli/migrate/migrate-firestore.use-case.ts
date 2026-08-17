/**
 * Lógica central de migración de Firestore, desacoplada de firebase-admin.
 *
 * El use-case opera sobre interfaces mínimas (`CollectionReader`,
 * `CollectionWriter`, `StorageCopier`) de modo que es totalmente testeable con
 * fakes (sin red). El adaptador Firebase vive en `firebase-migration.adapter.ts`.
 */

export interface DocRecord {
  id: string;
  data: Record<string, unknown>;
}

export interface CollectionReader {
  listAll(): Promise<DocRecord[]>;
}

export interface CollectionWriter {
  exists(id: string): Promise<boolean>;
  write(id: string, data: Record<string, unknown>): Promise<void>;
}

export interface BlobCopyResult {
  url: string;
  storagePath: string;
}

export interface StorageCopier {
  copy(storagePath: string): Promise<BlobCopyResult | null>;
}

export interface MigrationDeps {
  readers: Record<string, CollectionReader>;
  writers: Record<string, CollectionWriter>;
  storageCopier?: StorageCopier;
  log?: (message: string) => void;
}

export interface MigrationOptions {
  collections: string[];
  exclude: string[];
  dryRun: boolean;
  storageCollections?: string[];
}

export interface CollectionReport {
  collection: string;
  read: number;
  written: number;
  skipped: number;
  excluded: boolean;
}

export interface MigrationReport {
  collections: CollectionReport[];
  storageBlobsCopied: number;
}

interface GaleriaItem {
  url?: string;
  storagePath?: string;
  alt?: string;
  orden?: number;
  [key: string]: unknown;
}

interface FichaTecnica {
  url?: string;
  storagePath?: string;
  nombreArchivo?: string;
  [key: string]: unknown;
}

/**
 * Reescribe las referencias de Storage de un producto (galería + ficha técnica)
 * usando el `StorageCopier`. Los blobs no encontrados en el origen se conservan
 * y se registra una advertencia (ya estaban rotos en origen).
 */
export async function rewriteProductStorage(
  product: Record<string, unknown>,
  copier: StorageCopier,
  log: (message: string) => void = (): void => undefined,
): Promise<{ data: Record<string, unknown>; blobsCopied: number }> {
  let blobsCopied = 0;
  const data: Record<string, unknown> = { ...product };

  const galeria = Array.isArray(product.galeria) ? (product.galeria as GaleriaItem[]) : [];
  const newGaleria: GaleriaItem[] = [];
  for (const item of galeria) {
    if (item && item.storagePath) {
      const result = await copier.copy(item.storagePath);
      if (result) {
        newGaleria.push({ ...item, url: result.url, storagePath: result.storagePath });
        blobsCopied += 1;
        continue;
      }
      log(`[warn] blob no encontrado en origen: ${item.storagePath}`);
    }
    newGaleria.push(item);
  }
  data.galeria = newGaleria;

  const ficha = product.fichaTecnica as FichaTecnica | null | undefined;
  if (ficha && ficha.storagePath) {
    const result = await copier.copy(ficha.storagePath);
    if (result) {
      data.fichaTecnica = { ...ficha, url: result.url, storagePath: result.storagePath };
      blobsCopied += 1;
    } else {
      log(`[warn] blob no encontrado en origen: ${ficha.storagePath}`);
    }
  }

  return { data, blobsCopied };
}

/**
 * Copia las colecciones configuradas del origen al destino preservando los IDs
 * de documento. Omite `exclude`. Es idempotente: si el doc ya existe en destino
 * no lo sobrescribe. En `--dry-run` no escribe y reporta lo que haría.
 */
export async function runMigration(
  deps: MigrationDeps,
  options: MigrationOptions,
): Promise<MigrationReport> {
  const log = deps.log ?? ((): void => undefined);
  const storageCollections = new Set(options.storageCollections ?? ['productos']);
  const reports: CollectionReport[] = [];
  let storageBlobsCopied = 0;

  for (const collection of options.collections) {
    if (options.exclude.includes(collection)) {
      reports.push({ collection, read: 0, written: 0, skipped: 0, excluded: true });
      log(`[skip] colección "${collection}" excluida`);
      continue;
    }

    const reader = deps.readers[collection];
    const writer = deps.writers[collection];
    if (!reader || !writer) {
      throw new Error(`Faltan reader/writer para la colección "${collection}"`);
    }

    const docs = await reader.listAll();
    let written = 0;
    let skipped = 0;

    const applyStorage = storageCollections.has(collection) && deps.storageCopier !== undefined;

    for (const doc of docs) {
      let data = doc.data;
      if (applyStorage && deps.storageCopier) {
        const result = await rewriteProductStorage(data, deps.storageCopier, log);
        data = result.data;
        storageBlobsCopied += result.blobsCopied;
      }

      if (options.dryRun) {
        written += 1;
        continue;
      }

      if (await writer.exists(doc.id)) {
        skipped += 1;
        continue;
      }

      await writer.write(doc.id, data);
      written += 1;
    }

    reports.push({ collection, read: docs.length, written, skipped, excluded: false });
    log(`[done] ${collection}: leídos=${docs.length} escritos=${written} omitidos=${skipped}`);
  }

  return { collections: reports, storageBlobsCopied };
}
