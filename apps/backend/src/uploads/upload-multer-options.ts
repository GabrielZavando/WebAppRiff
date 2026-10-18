import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';

/** Multipart field carrying the binary payload on both upload endpoints. */
export const UPLOADS_FILE_FIELD = 'file';

export const IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const TECH_SHEET_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const CATALOG_IMAGE_MIMETYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type MulterFileStub = { mimetype: string };
type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

/**
 * First validation layer for gallery images (design D6): a fast declared-MIME
 * allowlist + the 5 MB hard limit. Real byte validation happens in the service
 * (magic bytes via sharp) because declared MIME is client-controlled. Rejects
 * with a BadRequestException (an HttpException) so the pipeline answers 400.
 */
export const imageMulterOptions: MulterOptions = {
  limits: { fileSize: IMAGE_MAX_FILE_SIZE },
  fileFilter: (_req: unknown, file: MulterFileStub, cb: FileFilterCallback): void => {
    if (CATALOG_IMAGE_MIMETYPES.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new BadRequestException('Only jpg, jpeg, png or webp files are allowed'), false);
  },
};

/**
 * First validation layer for tech sheets: 10 MB hard limit + declared MIME
 * application/pdf (the %PDF- byte signature is verified in the service).
 */
export const techSheetMulterOptions: MulterOptions = {
  limits: { fileSize: TECH_SHEET_MAX_FILE_SIZE },
  fileFilter: (_req: unknown, file: MulterFileStub, cb: FileFilterCallback): void => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
      return;
    }
    cb(new BadRequestException('Only PDF files are allowed'), false);
  },
};
