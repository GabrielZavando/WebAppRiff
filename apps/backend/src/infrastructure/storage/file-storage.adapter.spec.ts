import { FirebaseFileStorageAdapter } from './file-storage.adapter';
import { FILE_STORAGE_PORT } from './file-storage.port';
import { createFakeBucket } from './fake-bucket';

describe('FirebaseFileStorageAdapter', () => {
  it('is bound by the FILE_STORAGE_PORT token', () => {
    expect(FILE_STORAGE_PORT).toBe('FILE_STORAGE_PORT');
  });

  it('saves the buffer on the bucket file and makes it public', async () => {
    const bucket = createFakeBucket('bucket-1');
    const adapter = new FirebaseFileStorageAdapter(bucket);

    await adapter.upload(Buffer.from('image-bytes'), 'productos/tmp-abc/hola.webp', 'image/webp');

    const saved = bucket.savedFiles[0];
    expect(saved.path).toBe('productos/tmp-abc/hola.webp');
    expect(saved.metadata.contentType).toBe('image/webp');
    expect(saved.metadata.cacheControl).toBe('public, max-age=31536000');
    expect(bucket.publicFiles).toContain('productos/tmp-abc/hola.webp');
  });

  it('returns the public URL https://storage.googleapis.com/<bucket>/<path>', async () => {
    const bucket = createFakeBucket('bucket-1');
    const adapter = new FirebaseFileStorageAdapter(bucket);

    const url = await adapter.upload(
      Buffer.from('pdf-bytes'),
      'productos/prod-1/tmp-x/ficha.pdf',
      'application/pdf',
    );

    expect(url).toBe(
      'https://storage.googleapis.com/bucket-1/productos/prod-1/tmp-x/ficha.pdf',
    );
  });

  it('passes through the contentType that the caller normalized', async () => {
    const bucket = createFakeBucket('bucket-2');
    const adapter = new FirebaseFileStorageAdapter(bucket);

    await adapter.upload(Buffer.from('bytes'), 'productos/tmp-a/ok.pdf', 'application/pdf');

    expect(bucket.savedFiles[0].metadata.contentType).toBe('application/pdf');
  });

  it('propagates bucket errors (caller maps them to generic failure)', async () => {
    const bucket = createFakeBucket('bucket-3');
    bucket.file = () => ({
      save: async () => {
        throw new Error('quota exceeded');
      },
      makePublic: async () => [],
    });
    const adapter = new FirebaseFileStorageAdapter(bucket);

    await expect(
      adapter.upload(Buffer.from('b'), 'productos/tmp-x/a.webp', 'image/webp'),
    ).rejects.toThrow('quota exceeded');
  });
});
