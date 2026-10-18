import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import { FileStoragePort, FILE_STORAGE_PORT } from '../infrastructure/storage/file-storage.port';
import { normalizeUploadedImage, validateImageContent } from './image-content';
import { buildProductUploadPath } from './storage-path';

/** Standard shape of a multipart file provided by multer + @nestjs/platform-express. */
export interface UploadedFilePayload {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

/** Response body of the uploads endpoints: `data` rides inside the envelope. */
export interface UploadResult {
  url: string;
  storagePath: string;
}

const GENERIC_FAILURE_MESSAGE = 'Failed to upload file';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(@Inject(FILE_STORAGE_PORT) private readonly storagePort: FileStoragePort) {}

  /**
   * Gallery image upload: real-content validation (magic bytes via sharp),
   * jpeg/png normalized to webp, always served as public catalog asset under
   * `productos/tmp-<uuid>/` (single path for create and edit; the bucket
   * lifecycle rule cleans orphans).
   */
  async uploadImage(file: UploadedFilePayload | undefined): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No image file received');
    }

    const validated = await validateImageContent(file.buffer);
    if (!validated.ok) {
      throw new BadRequestException('File is not a valid image (jpg, png or webp)');
    }

    const normalizedBuffer = await normalizeUploadedImage(file.buffer, validated.format);
    const storagePath = buildProductUploadPath({
      originalName: file.originalname,
      contentType: file.mimetype,
      normalizedExtension: 'webp',
    });

    return this.pushToStorage(normalizedBuffer, storagePath, 'image/webp');
  }

  /**
   * Tech-sheet upload: requires the %PDF- signature (client-declared MIME is
   * not trusted), uploaded untouched with `application/pdf`.
   */
  async uploadTechSheet(file: UploadedFilePayload | undefined): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No PDF file received');
    }
    if (!isValidPdfSignature(file.buffer)) {
      throw new BadRequestException('File is not a valid PDF document');
    }

    const storagePath = buildProductUploadPath({
      originalName: file.originalname,
      contentType: file.mimetype,
    });

    return this.pushToStorage(file.buffer, storagePath, 'application/pdf');
  }

  private async pushToStorage(buffer: Buffer, storagePath: string, contentType: string): Promise<UploadResult> {
    try {
      const url = await this.storagePort.upload(buffer, storagePath, contentType);
      return { url, storagePath };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to upload ${storagePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(GENERIC_FAILURE_MESSAGE);
    }
  }
}

function isValidPdfSignature(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString('binary') === '%PDF-';
}
