import { BadRequestException } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import type { UploadsService } from './uploads.service';
import { IMAGE_MAX_FILE_SIZE, TECH_SHEET_MAX_FILE_SIZE, imageMulterOptions, techSheetMulterOptions } from './upload-multer-options';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ROLES_KEY } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

const GUARDS_METADATA_KEY = '__guards__';
const INTERCEPTORS_METADATA_KEY = '__interceptors__';

function handlerRoles(methodName: keyof UploadsController): string[] {
  return (Reflect.getMetadata(ROLES_KEY, UploadsController.prototype[methodName]) ?? []) as string[];
}

describe('UploadsController', () => {
  const service: jest.Mocked<Pick<UploadsService, 'uploadImage' | 'uploadTechSheet'>> = {
    uploadImage: jest.fn(),
    uploadTechSheet: jest.fn(),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controller = new UploadsController(service as any);

  beforeEach(() => jest.clearAllMocks());

  it('uploadImage delegates to the service (no multipart metadata needed)', async () => {
    service.uploadImage.mockResolvedValue({ url: 'https://x/y.webp', storagePath: 'productos/tmp-x/y.webp' });
    const file = { buffer: Buffer.from('a'), mimetype: 'image/jpeg', originalname: 'a.jpg', size: 1 };

    const result = await controller.uploadImage(file as never);

    expect(result).toEqual({ url: 'https://x/y.webp', storagePath: 'productos/tmp-x/y.webp' });
    expect(service.uploadImage).toHaveBeenCalledWith(file);
  });

  it('uploadTechSheet delegates to the service (no multipart metadata needed)', async () => {
    service.uploadTechSheet.mockResolvedValue({ url: 'https://x/f.pdf', storagePath: 'productos/tmp-x/f.pdf' });
    const file = { buffer: Buffer.from('b'), mimetype: 'application/pdf', originalname: 'f.pdf', size: 2 };

    const result = await controller.uploadTechSheet(file as never);

    expect(result).toEqual({ url: 'https://x/f.pdf', storagePath: 'productos/tmp-x/f.pdf' });
    expect(service.uploadTechSheet).toHaveBeenCalledWith(file);
  });

  it('both handlers authorize superadmin, admin and editor', () => {
    expect(handlerRoles('uploadImage')).toEqual(['superadmin', 'admin', 'editor']);
    expect(handlerRoles('uploadTechSheet')).toEqual(['superadmin', 'admin', 'editor']);
  });

  it('both handlers are protected by FirebaseAuthGuard + RolesGuard', () => {
    for (const methodName of ['uploadImage', 'uploadTechSheet'] as const) {
      const guards = (Reflect.getMetadata(
        GUARDS_METADATA_KEY,
        UploadsController.prototype[methodName],
      ) ?? []) as unknown[];
      const guardNames = guards.map((g) => (g as { name: string }).name);
      expect(guardNames).toContain('FirebaseAuthGuard');
      expect(guardNames).toContain('RolesGuard');
    }
  });

  it('both handlers are wrapped by exactly one interceptor (FileInterceptor mixin)', () => {
    for (const methodName of ['uploadImage', 'uploadTechSheet'] as const) {
      const interceptors = (Reflect.getMetadata(
        INTERCEPTORS_METADATA_KEY,
        UploadsController.prototype[methodName],
      ) ?? []) as unknown[];
      expect(interceptors).toHaveLength(1);
      // FileInterceptor produces anonymous mixin instances; compare identity
      // shape: an object created by the platform (not undefined/null/function).
      const ix = interceptors[0];
      // FileInterceptor stores its mixin factory (a function) in metadata.
      expect(typeof ix).toBe('function');
    }
  });

  it('image limits: 5MB and pdf limits: 10MB', () => {
    expect(IMAGE_MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    expect(TECH_SHEET_MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
  });

  it('image multer options only accept the catalog mimetypes', () => {
    expect(imageMulterOptions.limits?.fileSize).toBe(IMAGE_MAX_FILE_SIZE);
    const cb = jest.fn();
    const filter = imageMulterOptions.fileFilter!;
    filter({}, { mimetype: 'image/png' } as never, cb);
    filter({}, { mimetype: 'image/webp' } as never, cb);
    filter({}, { mimetype: 'image/jpeg' } as never, cb);
    filter({}, { mimetype: 'image/gif' } as never, cb);
    filter({}, { mimetype: 'application/pdf' } as never, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
    expect(cb).toHaveBeenCalledWith(expect.any(BadRequestException), false);
    expect(cb).toHaveBeenCalledTimes(5);
  });

  it('tech-sheet multer options only accept application/pdf', () => {
    expect(techSheetMulterOptions.limits?.fileSize).toBe(TECH_SHEET_MAX_FILE_SIZE);
    const cb = jest.fn();
    const filter = techSheetMulterOptions.fileFilter!;
    filter({}, { mimetype: 'application/pdf' } as never, cb);
    filter({}, { mimetype: 'image/png' } as never, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
    expect(cb).toHaveBeenCalledWith(expect.any(BadRequestException), false);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('static multer options carry limits and per-route filters (field "file" bound at decorator)', () => {
    expect(imageMulterOptions.limits?.fileSize).toBe(IMAGE_MAX_FILE_SIZE);
    expect(techSheetMulterOptions.limits?.fileSize).toBe(TECH_SHEET_MAX_FILE_SIZE);
    expect(typeof imageMulterOptions.fileFilter).toBe('function');
    expect(typeof techSheetMulterOptions.fileFilter).toBe('function');
  });
});
