import { Bucket } from '@google-cloud/storage';

/**
 * Fake of the @google-cloud/storage `Bucket` surface used by
 * `FirebaseFileStorageAdapter` (only `file(save, makePublic)` is needed).
 * The adapter must depend on this narrow shape (ISP) so tests avoid GCS.
 */
export interface FakeBucketFile {
  save(buffer: Buffer, options: { metadata: { contentType: string; cacheControl: string } }): Promise<void>;
  makePublic(): Promise<[]>;
}

export interface FakeBucket {
  name: string;
  file(path: string): FakeBucketFile;
  savedFiles: { path: string; metadata: { contentType?: string; cacheControl?: string } }[];
  publicFiles: string[];
}

export function createFakeBucket(name = 'riff-catalogo-staging.appspot.com'): FakeBucket {
  const bucket: FakeBucket = {
    name,
    savedFiles: [],
    publicFiles: [],
    file(path: string): FakeBucketFile {
      const handle: FakeBucketFile = {
        save: async (buffer, options) => {
          bucket.savedFiles.push({ path, metadata: options.metadata });
        },
        makePublic: async () => {
          bucket.publicFiles.push(path);
          return [];
        },
      };
      return handle;
    },
  };
  return bucket;
}

/** Adapter-mostly type: the Narrow is structurally compatible for DI. */
export type FakeNarrowBucket = FakeBucket & Bucket;
