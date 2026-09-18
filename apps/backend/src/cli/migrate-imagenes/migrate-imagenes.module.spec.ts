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

function configWith(missing: readonly string[], overrides: Record<string, string> = {}): ConfigService {
  const get = jest.fn((key: string) => {
    if (missing.includes(key)) return undefined;
    if (overrides[key] !== undefined) return overrides[key];
    return `value-${key}`;
  });
  return { get } as unknown as ConfigService;
}

/**
 * Cubre R5 / SC-006 (fail-fast de configuración): el factory del módulo debe
 * validar TODA la configuración requerida en el bootstrap y abortar con un
 * mensaje explícito nombrando las variables faltantes, ANTES de cualquier
 * escritura (no se abre el bucket ni se sube nada). Se verifican las variables
 * que el módulo realmente requiere (`FIREBASE_PROJECT_ID` y
 * `FIREBASE_STORAGE_BUCKET`); las credenciales Firebase se resuelven vía ADC y
 * el webhook de rebuild (R4) es best-effort, no un aborto.
 */
describe('resolveImageStorageUploader (fail-fast de configuración)', () => {
  const app = {} as App;

  beforeEach(() => jest.clearAllMocks());

  it('fails fast naming FIREBASE_PROJECT_ID when it is missing, without touching Storage', () => {
    const config = configWith(['FIREBASE_PROJECT_ID']);

    expect(() => resolveImageStorageUploader(app, config)).toThrow(
      /Missing required environment variable\(s\): FIREBASE_PROJECT_ID/,
    );
    expect(mockStorage.bucket).not.toHaveBeenCalled();
    expect(mockFile.save).not.toHaveBeenCalled();
    expect(mockFile.makePublic).not.toHaveBeenCalled();
  });

  it('fails fast naming FIREBASE_STORAGE_BUCKET when missing, without touching Storage', () => {
    const config = configWith(['FIREBASE_STORAGE_BUCKET']);

    expect(() => resolveImageStorageUploader(app, config)).toThrow(
      /Missing required environment variable\(s\): FIREBASE_STORAGE_BUCKET/,
    );
    expect(mockStorage.bucket).not.toHaveBeenCalled();
    expect(mockFile.save).not.toHaveBeenCalled();
    expect(mockFile.makePublic).not.toHaveBeenCalled();
  });

  it('lists every missing required variable in a single explicit message', () => {
    const config = configWith(['FIREBASE_PROJECT_ID', 'FIREBASE_STORAGE_BUCKET']);

    expect(() => resolveImageStorageUploader(app, config)).toThrow(
      /Missing required environment variable\(s\): FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET/,
    );
    expect(mockFile.save).not.toHaveBeenCalled();
  });

  it('builds the uploader with the configured bucket when all config is present', () => {
    const bucketName = 'webappriff.firebasestorage.app';
    const config = configWith([], { FIREBASE_STORAGE_BUCKET: bucketName });

    const uploader = resolveImageStorageUploader(app, config);

    expect(uploader).toBeInstanceOf(FirebaseStorageUploader);
    expect(mockStorage.bucket).toHaveBeenCalledWith(bucketName);
  });
});
