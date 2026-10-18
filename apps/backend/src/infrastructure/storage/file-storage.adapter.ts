import { FileStoragePort } from './file-storage.port';

export const PUBLIC_OBJECT_CACHE_CONTROL = 'public, max-age=31536000';

/**
 * Used narrow shape of a @google-cloud/storage `Bucket` (ISP — the adapter only
 * needs `name` + `file(path).save/makePublic`). Deliberately structural with no
 * import from `@google-cloud/storage`: firebase-admin resolves its own package
 * copy, so nominal `Bucket` types are CJS/ESM-incompatible while this
 * structural shape accepts the real `Bucket` returned by `getStorage(app).bucket()`.
 */
interface SaveOptions {
  metadata: { contentType: string; cacheControl: string };
}

interface PublicBucketFile {
  save(buffer: Buffer, options: SaveOptions): Promise<void>;
  makePublic(): Promise<unknown>;
}

interface PublicBucket {
  readonly name: string;
  file(path: string): PublicBucketFile;
}

export class FirebaseFileStorageAdapter implements FileStoragePort {
  constructor(private readonly bucket: PublicBucket) {}

  static fromBucket(bucket: PublicBucket): FirebaseFileStorageAdapter {
    return new FirebaseFileStorageAdapter(bucket);
  }

  /** Compact upload helper used by the CLI-free module wiring. */
  async upload(buffer: Buffer, storagePath: string, contentType: string): Promise<string> {
    const file = this.bucket.file(storagePath);
    await file.save(buffer, {
      metadata: { contentType, cacheControl: PUBLIC_OBJECT_CACHE_CONTROL },
    });
    await file.makePublic();
    return `https://storage.googleapis.com/${this.bucket.name}/${storagePath}`;
  }
}
