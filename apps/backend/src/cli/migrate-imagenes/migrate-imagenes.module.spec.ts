import { ConfigService } from '@nestjs/config';
import { App } from 'firebase-admin/app';
import { FirebaseStorageUploader } from './firebase-storage-uploader.adapter';
import { resolveImageStorageUploader } from './migrate-imagenes.module';

const mockFile = { save: jest.fn(), makePublic: jest.fn() };
const mockBucket = { name: 'my-bucket', file: jest.fn().mockReturnValue(mockFile) };
const mockStorage = { bucket: jest.fn().mockReturnValue(mockBucket) };

jest.mock('firebase-admin/storage', () => ({
  getStorage: jest.fn(() => mockStorage),
}));

/**
 * Cubre el escenario del spec "Missing required environment variable fails fast":
 * el factory del módulo debe lanzar un error claro (sin secretos) cuando
 * `FIREBASE_STORAGE_BUCKET` no está configurado, y construir el uploader cuando sí.
 */
describe('resolveImageStorageUploader', () => {
  const app = {} as App;

  beforeEach(() => jest.clearAllMocks());

  it('throws a clear error when FIREBASE_STORAGE_BUCKET is missing (no secrets logged)', () => {
    const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    expect(() => resolveImageStorageUploader(app, config)).toThrow(
      'Missing required environment variable: FIREBASE_STORAGE_BUCKET',
    );
  });

  it('builds the uploader with the configured bucket', () => {
    const bucketName = 'webappriff.firebasestorage.app';
    const config = { get: jest.fn().mockReturnValue(bucketName) } as unknown as ConfigService;

    const uploader = resolveImageStorageUploader(app, config);

    expect(uploader).toBeInstanceOf(FirebaseStorageUploader);
    expect(mockStorage.bucket).toHaveBeenCalledWith(bucketName);
  });
});
