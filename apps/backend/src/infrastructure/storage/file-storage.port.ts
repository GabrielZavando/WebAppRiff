/**
 * Port for uploading arbitrary binary blobs (normalized images, PDFs) to
 * persistent storage. Infrastructure detail: the concrete adapter uses
 * firebase-admin Storage; domain/application layers depend only on this
 * abstraction (DIP, see docs/backend-standards.md).
 */
export interface FileStoragePort {
  /**
   * Uploads `buffer` to `storagePath` (already validated and sanitized by the
   * caller) with the given `contentType`, makes the object public and returns
   * the resulting public URL.
   */
  upload(buffer: Buffer, storagePath: string, contentType: string): Promise<string>;
}

export const FILE_STORAGE_PORT = 'FILE_STORAGE_PORT';
