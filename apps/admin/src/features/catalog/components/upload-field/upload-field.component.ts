import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, inject } from '@angular/core';

import { AlertComponent } from '../../../../shared/components/ui/alert/alert.component';
import { ApiError } from '../../../../shared/api/api-client.service';
import { UploadedAsset, UploadService } from '../../upload.service';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

const GALLERY_ACCEPT = '.jpg,.jpeg,.png,.webp';
const TECH_SHEET_ACCEPT = '.pdf';

export const MAX_IMAGE_BYTES_LIMIT = MAX_IMAGE_BYTES;
export const MAX_PDF_BYTES_LIMIT = MAX_PDF_BYTES;

/**
 * File upload control for the product form (task 3.3, design D7; spec
 * `admin-catalog-crud`): a styled native file input, immediate client-side
 * size check (5 MB images / 10 MB PDF — the backend re-validates hard),
 * thumbnail preview for gallery images and a file name preview for PDFs,
 * `uploading` state (save stays disabled while uploading) and an actionable
 * error in Spanish for every failure mode.
 */
@Component({
  selector: 'app-upload-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AlertComponent],
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-3">
        <label
          class="inline-flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          data-upload-trigger
        >
          <span>{{ kind === 'tech-sheet' ? 'Subir PDF' : 'Subir imagen' }}</span>
          <input
            type="file"
            class="sr-only"
            [attr.accept]="accept"
            [attr.aria-label]="kind === 'tech-sheet' ? 'Subir ficha técnica PDF' : 'Subir imagen de galería'"
            (change)="onFileSelected($event)"
            [disabled]="uploading"
          />
        </label>
        @if (isImage) {
          @if (previewUrl !== '') {
            <img
              [src]="previewUrl"
              class="h-14 w-14 border object-cover"
              alt="Vista previa de la imagen cargada"
            />
          } @else {
            <span class="text-xs text-neutral-600">Sin imagen</span>
          }
        } @else {
          <span class="text-xs text-neutral-600">{{ previewFileName !== '' ? previewFileName : 'Sin PDF' }}</span>
        }
        @if (uploading) {
          <span class="text-xs" role="status">Subiendo…</span>
        }
      </div>
      @if (errorMessage !== '') {
        <app-alert variant="error" [message]="errorMessage" />
      }
    </div>
  `,
})
export class UploadFieldComponent {
  private readonly uploadService = inject(UploadService);

  @Input() kind: 'gallery-image' | 'tech-sheet' = 'gallery-image';
  /** Existing thumbnail for reloads (preview). */
  @Input() previewUrl = '';
  /** Existing tech sheet file name for reloads (preview). */
  @Input() previewFileName = '';

  @Output() uploaded = new EventEmitter<UploadedAsset>();
  /** Save button stays disabled while any upload is in flight. */
  @Output() uploadingChange = new EventEmitter<boolean>();

  uploading = false;
  errorMessage = '';

  get isImage(): boolean {
    return this.kind === 'gallery-image';
  }

  get accept(): string {
    return this.isImage ? GALLERY_ACCEPT : TECH_SHEET_ACCEPT;
  }

  /** Max size in MB for the immediate client-side guard (task 3.3). */
  get maxValueMb(): number {
    return this.isImage ? MAX_IMAGE_BYTES : MAX_PDF_BYTES;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (file === null) {
      return;
    }

    this.errorMessage = '';

    this.uploading = true;
    this.errorMessage = '';

    if (file.size > this.maxValueMb) {
      this.uploading = false;
      this.errorMessage = `El archivo pesa más de ${this.maxValueMb / (1024 * 1024)} MB. Elige un archivo más liviano.`;
      input.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file, file.name);
    this.uploadingChange.emit(true);

    const request$ = this.isImage
      ? this.uploadService.uploadImage(formData)
      : this.uploadService.uploadTechSheet(formData);

    request$.subscribe({
      next: (asset) => {
        this.uploading = false;
        this.uploadingChange.emit(false);
        this.uploaded.emit(asset);
        if (this.isImage) {
          this.previewUrl = asset.url;
        } else {
          this.previewFileName = file.name;
        }
      },
      error: (error: unknown) => {
        this.uploading = false;
        this.uploadingChange.emit(false);
        this.errorMessage = this.mapUploadError(error);
      },
    });

    input.value = '';
  }

  /** Spanish actionable mapping of upload failures (envelope + status aware). */
  mapUploadError(error: unknown): string {
    if (error instanceof ApiError) {
      if (error.status === 400) {
        return this.isImage
          ? 'El archivo no es una imagen válida. Usa .jpg, .jpeg, .png o .webp.'
          : 'El archivo no es un PDF válido.';
      }
      if (error.status === 413) {
        return `El archivo pesa más de ${this.maxValueMb / (1024 * 1024)} MB.`;
      }
      if (error.status === 401) {
        return 'Tu sesión expiró. Inicia sesión nuevamente para subir archivos.';
      }
      if (error.status === 403) {
        return 'No tienes permiso para subir archivos.';
      }
    }
    return 'No se pudo subir el archivo. Intenta nuevamente.';
  }
}
