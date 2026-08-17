import { App, cert, initializeApp } from 'firebase-admin/app';
import { Firestore, Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { Storage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { normalizePrivateKey } from '../../infrastructure/firebase/firebase.config';
import {
  BlobCopyResult,
  CollectionReader,
  CollectionWriter,
  StorageCopier,
} from './migrate-firestore.use-case';

export interface ServiceAccountLike {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/** Inicializa una app Firebase con un nombre explícito para poder tener origen y destino a la vez. */
export function initFirebaseApp(name: string, sa: ServiceAccountLike): App {
  return initializeApp(
    {
      projectId: sa.projectId,
      credential: cert({
        projectId: sa.projectId,
        clientEmail: sa.clientEmail,
        privateKey: normalizePrivateKey(sa.privateKey),
      }),
    },
    name,
  );
}

/** Lee todos los documentos de una colección con paginación (lotes de 500). */
export function createCollectionReader(fs: Firestore, collection: string): CollectionReader {
  return {
    async listAll(): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
      const out: Array<{ id: string; data: Record<string, unknown> }> = [];
      let last: QueryDocumentSnapshot | null = null;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        let query: Query = fs.collection(collection);
        if (last) {
          query = query.startAfter(last);
        }
        query = query.limit(500);
        const snapshot = await query.get();
        if (snapshot.empty) {
          break;
        }
        snapshot.forEach((doc) => {
          out.push({ id: doc.id, data: doc.data() as Record<string, unknown> });
        });
        last = snapshot.docs[snapshot.docs.length - 1] ?? null;
        if (snapshot.size < 500) {
          break;
        }
      }
      return out;
    },
  };
}

export function createCollectionWriter(fs: Firestore, collection: string): CollectionWriter {
  return {
    async exists(id: string): Promise<boolean> {
      const snap = await fs.collection(collection).doc(id).get();
      return snap.exists;
    },
    async write(id: string, data: Record<string, unknown>): Promise<void> {
      await fs.collection(collection).doc(id).set(data);
    },
  };
}

/**
 * Copia un blob del bucket origen al bucket destino conservando la misma ruta y
 * reconstruye la URL pública con el nombre del bucket destino.
 */
export function createStorageCopier(
  sourceStorage: Storage,
  destStorage: Storage,
  newBucketName: string,
): StorageCopier {
  return {
    async copy(storagePath: string): Promise<BlobCopyResult | null> {
      const srcFile = sourceStorage.bucket().file(storagePath);
      const [exists] = await srcFile.exists();
      if (!exists) {
        return null;
      }
      const destFile = destStorage.bucket().file(storagePath);
      await srcFile.copy(destFile);
      return {
        url: `https://storage.googleapis.com/${newBucketName}/${storagePath}`,
        storagePath,
      };
    },
  };
}

export function getFirestoreFor(app: App): Firestore {
  return getFirestore(app);
}

export function getStorageFor(app: App): Storage {
  return getStorage(app);
}
