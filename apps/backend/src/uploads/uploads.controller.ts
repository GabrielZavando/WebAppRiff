import { Controller, Post, UploadedFile, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UploadsService, UploadResult, UploadedFilePayload } from './uploads.service';
import { imageMulterOptions, techSheetMulterOptions } from './upload-multer-options';
import { UploadMulterErrorFilter } from './upload-exception.filter';

/**
 * HTTP file uploads to Firebase Storage through the BFF (capability
 * `admin-uploads`). Two explicit multipart routes with independent validation
 * and size limits (design D1). Roles mirror product edits: superadmin, admin
 * and editor. Responses always ride the standard envelope `{url, storagePath}`.
 */
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('images')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'editor')
  @UseInterceptors(FileInterceptor('file', imageMulterOptions))
  @UseFilters(UploadMulterErrorFilter)
  uploadImage(
    @UploadedFile() file: UploadedFilePayload | undefined,
  ): Promise<UploadResult> {
    return this.uploadsService.uploadImage(file);
  }

  @Post('tech-sheet')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'editor')
  @UseInterceptors(FileInterceptor('file', techSheetMulterOptions))
  @UseFilters(UploadMulterErrorFilter)
  uploadTechSheet(
    @UploadedFile() file: UploadedFilePayload | undefined,
  ): Promise<UploadResult> {
    return this.uploadsService.uploadTechSheet(file);
  }
}
