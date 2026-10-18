import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import sharp from 'sharp';

import { createFakeBucket } from '../infrastructure/storage/fake-bucket';
import { FirebaseFileStorageAdapter } from '../infrastructure/storage/file-storage.adapter';
import { UploadsService } from './uploads.service';

async function jpegBuffer(): Promise<Buffer> {
  return sharp({ create: { width: 8, height: 8, channels: 3, background: 'red' } })
    .jpeg()
    .toBuffer();
}

function pdfBuffer(): Buffer {
  return Buffer.from('%PDF-1.7 fake pdf body');
}

function makeFile(overrides: Partial<{ buffer: Buffer; mimetype: string; originalname: string; size: number }> = {}) {
  return {
    buffer: Buffer.from('x'),
    mimetype: 'image/jpeg',
    originalname: 'catalogo.jpg',
    size: 42,
    ...overrides,
  };
}

describe('UploadsService', () => {
  const bucket = createFakeBucket('staging-bucket');
  const storage = new FirebaseFileStorageAdapter(bucket);
  const service = new UploadsService(storage);

  beforeEach(() => {
    bucket.savedFiles.length = 0;
  });

  describe('uploadImage', () => {
    it('validates real bytes, normalizes to webp and returns url + storagePath', async () => {
      const result = await service.uploadImage(makeFile({ buffer: await jpegBuffer() }));

      const saved = bucket.savedFiles[0];
      expect(result.storagePath).toBe(saved.path);
      expect(result.url).toBe(`https://storage.googleapis.com/staging-bucket/${saved.path}`);
      expect(saved.path).toMatch(/^productos\/tmp-[0-9a-f-]{36}\/catalogo\.webp$/);
      expect(saved.metadata.contentType).toBe('image/webp');
    });

    it('rejects images whose real bytes are not a valid picture with 400', async () => {
      await expect(
        service.uploadImage(makeFile({ buffer: Buffer.from('not-an-image'), mimetype: 'image/png', originalname: 'a.png' })),
      ).rejects.toThrow(BadRequestException);
      expect(bucket.savedFiles).toHaveLength(0);
    });

    it('rejects a missing file with 400', async () => {
      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        service.uploadImage(undefined as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('maps storage failures to 500 with the generic message', async () => {
      const brokenStorage = {
        upload: jest.fn().mockRejectedValue(new Error('quota exceeded')),
      };
      const failing = new UploadsService(brokenStorage as never);

      await expect(
        failing.uploadImage(makeFile({ buffer: await jpegBuffer() })),
      ).rejects.toMatchObject({
        constructor: InternalServerErrorException,
        message: 'Failed to upload file',
      });
    });

    it('logs non-Error storage rejections without leaking their payload', async () => {
      const failing = new UploadsService({
        upload: jest.fn().mockRejectedValue('quota string rejection'),
      } as never);

      await expect(
        failing.uploadImage(makeFile({ buffer: await jpegBuffer() })),
      ).rejects.toMatchObject({
        constructor: InternalServerErrorException,
        message: 'Failed to upload file',
      });
    });
  });

  describe('uploadTechSheet', () => {
    it('uploads a real pdf untouched with contentType application/pdf', async () => {
      const result = await service.uploadTechSheet(
        makeFile({ buffer: pdfBuffer(), mimetype: 'application/pdf', originalname: 'ficha técnica.pdf' }),
      );

      const saved = bucket.savedFiles[0];
      expect(result.storagePath).toBe(saved.path);
      expect(saved.path).toMatch(/^productos\/tmp-[0-9a-f-]{36}\/ficha-tecnica\.pdf$/);
      expect(saved.metadata.contentType).toBe('application/pdf');
    });

    it('rejects files without the %PDF- signature with 400', async () => {
      await expect(
        service.uploadTechSheet(
          makeFile({ buffer: Buffer.from('PK-actually-a-zip'), mimetype: 'application/pdf', originalname: 'x.pdf' }),
        ),
      ).rejects.toThrow(BadRequestException);
      expect(bucket.savedFiles).toHaveLength(0);
    });

    it('rejects a missing file with 400', async () => {
      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        service.uploadTechSheet(undefined as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('maps storage failures to 500 with the generic message', async () => {
      const failing = new UploadsService({
        upload: jest.fn().mockRejectedValue(new Error('boom')),
      } as never);

      await expect(
        failing.uploadTechSheet(
          makeFile({ buffer: pdfBuffer(), mimetype: 'application/pdf', originalname: 'f.pdf' }),
        ),
      ).rejects.toMatchObject({ message: 'Failed to upload file' });
    });
  });
});
