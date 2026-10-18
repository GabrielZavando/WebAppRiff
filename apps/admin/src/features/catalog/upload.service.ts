import { Injectable, inject } from '@angular/core';

import { ApiClientService } from '../../shared/api/api-client.service';

export interface UploadedAsset {
  url: string;
  storagePath: string;
}

/**
 * Upload domain service (task 3.2 of change `admin-uploads`): multipart calls
 * to the explicit upload routes (`POST /uploads/images`,
 * `POST /uploads/tech-sheet`) through `ApiClientService.postFormData`, which
 * keeps the standard envelope unwrap and maps failures to `ApiError` with the
 * backend message. Storage paths are always `productos/tmp-<uuid>/` (design
 * D5 amended: create and edit share the single lifecycle-matchable prefix).
 */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly api = inject(ApiClientService);

  uploadImage(formData: FormData): ObservableResult<UploadedAsset> {
    return this.api.postFormData<UploadedAsset>('uploads/images', formData);
  }

  uploadTechSheet(formData: FormData): ObservableResult<UploadedAsset> {
    return this.api.postFormData<UploadedAsset>('uploads/tech-sheet', formData);
  }
}

type ObservableResult<T> = import('rxjs').Observable<T>;
