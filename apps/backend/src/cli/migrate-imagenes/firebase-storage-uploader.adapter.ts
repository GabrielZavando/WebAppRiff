import { App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { ImageStoragePort } from './ports';

/**
 * Implementación de `ImageStoragePort` que sube el buffer optimizado a Firebase
 * Storage en la ruta indicada, lo marca como público (catálogo público) y devuelve
 * la URL pública. Reusa la app de Firebase provista por `FirebaseModule`.
 *
 * Apunta a un bucket **explícito** (`bucketName`) porque `FirebaseModule`
 * inicializa la app sin `storageBucket` por defecto; `getStorage(app).bucket()`
 * sin argumento lanza "Bucket name not specified".
 */
export class FirebaseStorageUploader implements ImageStoragePort {
  constructor(private readonly bucket: import('@google-cloud/storage').Bucket) {}

  static fromApp(app: App, bucketName: string): FirebaseStorageUploader {
    return new FirebaseStorageUploader(getStorage(app).bucket(bucketName));
  }

  async upload(buffer: Buffer, storagePath: string): Promise<string> {
    const bucket = this.bucket;
    const file = bucket.file(storagePath);
    await file.save(buffer, {
      metadata: { contentType: 'image/webp', cacheControl: 'public, max-age=31536000' },
    });
    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
  }
}
