import { App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

import { FirebaseFileStorageAdapter } from './file-storage.adapter';
import { FileStoragePort } from './file-storage.port';

/**
 * Builds a lazy `FileStoragePort`: the firebase bucket handle is resolved on
 * the first upload call (not at module boot). Keeps application boot order
 * decoupled from Storage Reachability, mirrors the firebase-admin singleton
 * reuse (`FirebaseModule`) and keeps DI graph tests cheap.
 */
export function buildLazyFileStoragePort(app: App, bucketName: string): FileStoragePort {
  let adapter: FirebaseFileStorageAdapter | null = null;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- @google-cloud/storage CJS/ESM dual-package type mismatch (only in jest), same as the CLI adapter
  // @ts-ignore
  const resolveAdapter = (): FirebaseFileStorageAdapter => {
    adapter ??= FirebaseFileStorageAdapter.fromBucket(getStorage(app).bucket(bucketName));
    return adapter;
  };

  return {
    upload: (buffer: Buffer, storagePath: string, contentType: string) =>
      resolveAdapter().upload(buffer, storagePath, contentType),
  };
}
