import { describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { UploadFieldComponent } from './upload-field.component';
import { UploadedAsset } from '../../upload.service';

const API_BASE = 'http://localhost:3000/api/v1';

function makeFile(name: string, sizeBytes: number, type: string): File {
  const file = new File(['x'.repeat(sizeBytes)], name, { type });
  return file;
}

function chooseFile(fixture: ComponentFixture<UploadFieldComponent>, file: File): void {
  const input = (fixture.nativeElement as HTMLElement).querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  // jsdom lacks DataTransfer; stub the FileList property directly.
  Object.defineProperty(input, 'files', {
    value: [file] as unknown as FileList,
    configurable: true,
  });
  input.dispatchEvent(new Event('change'));
}

describe('UploadFieldComponent (task 3.3 + 3.4, spec admin-uploads / admin-catalog-crud)', () => {
  let fixture: ComponentFixture<UploadFieldComponent>;
  let http: HttpTestingController;

  function setup(inputs: Partial<Record<string, unknown>>): void {
    TestBed.configureTestingModule({
      imports: [UploadFieldComponent],
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(UploadFieldComponent);
    for (const [key, value] of Object.entries(inputs)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fixture.componentInstance as any)[key] = value;
    }
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    http.verify();
  });

  it('renders a file input with the gallery accept list and a filename preview', () => {
    setup({ kind: 'gallery-image' });
    const input = (fixture.nativeElement as HTMLElement).querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe('.jpg,.jpeg,.png,.webp');
  });

  it('renders the pdf accept list for tech-sheet kind', () => {
    setup({ kind: 'tech-sheet' });
    const input = (fixture.nativeElement as HTMLElement).querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe('.pdf');
  });

  it('[size guard] rejects an oversized image immediately without calling HTTP', () => {
    setup({ kind: 'gallery-image' });
    const uploads: UploadedAsset[] = [];
    vi.resetModules();
    fixture.componentInstance.uploaded.subscribe((asset) => uploads.push(asset as UploadedAsset));

    chooseFile(fixture, makeFile('big.jpg', 5 * 1024 * 1024 + 1, 'image/jpeg'));
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('5 MB');
    expect(uploads).toHaveLength(0);
  });

  it('[size guard] rejects an oversized PDF immediately without calling HTTP', () => {
    setup({ kind: 'tech-sheet' });
    const uploads: UploadedAsset[] = [];
    fixture.componentInstance.uploaded.subscribe((asset) => uploads.push(asset as UploadedAsset));

    chooseFile(fixture, makeFile('big.pdf', 10 * 1024 * 1024 + 1, 'application/pdf'));
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('10 MB');
    expect(uploads).toHaveLength(0);
  });

  it('uploads a valid image and emits url + storagePath (201 autoloads fields)', () => {
    setup({ kind: 'gallery-image' });
    const uploadingStates: boolean[] = [];
    const uploads: UploadedAsset[] = [];
    fixture.componentInstance.uploadingChange.subscribe((state) => uploadingStates.push(state as boolean));
    fixture.componentInstance.uploaded.subscribe((asset) => uploads.push(asset as UploadedAsset));

    chooseFile(fixture, makeFile('small.jpg', 1024, 'image/jpeg'));
    expect(uploadingStates).toEqual([true]);

    const req = http.expectOne(`${API_BASE}/uploads/images`);
    const body = req.request.body as FormData;
    expect(body.get('productoId')).toBeNull();
    req.flush({ data: { url: 'https://x/a.webp', storagePath: 'productos/prod-1/tmp-x/a.webp' }, error: null, meta: null });

    expect(uploads).toEqual([
      { url: 'https://x/a.webp', storagePath: 'productos/prod-1/tmp-x/a.webp' },
    ]);
    expect(uploadingStates).toEqual([true, false]);
    fixture.detectChanges();
    const alt = fixture.nativeElement as HTMLElement;
    expect(alt.querySelector('img')).not.toBeNull();
  });

  it('shows an actionable error (spanish) for backend 400 and keeps nothing uploaded', () => {
    setup({ kind: 'gallery-image' });
    const uploads: UploadedAsset[] = [];
    fixture.componentInstance.uploaded.subscribe((asset) => uploads.push(asset as UploadedAsset));

    chooseFile(fixture, makeFile('fake.jpg', 1024, 'image/jpeg'));
    const req = http.expectOne(`${API_BASE}/uploads/images`);
    req.flush(
      { data: null, error: { message: 'File is not a valid image (jpg, png or webp)', code: null }, meta: null },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(uploads).toHaveLength(0);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('no es una imagen válida');
  });

  it('shows an actionable error for backend 500 storage failures', () => {
    setup({ kind: 'gallery-image' });
    fixture.componentInstance.uploaded.subscribe();

    chooseFile(fixture, makeFile('small.jpg', 1024, 'image/jpeg'));
    const req = http.expectOne(`${API_BASE}/uploads/images`);
    req.flush(
      { data: null, error: { message: 'Failed to upload file', code: null }, meta: null },
      { status: 500, statusText: 'Internal Server Error' },
    );

    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No se pudo subir el archivo');
  });

  it('emits uploadingChange(false) after a failed upload (guard releases save button)', () => {
    setup({ kind: 'tech-sheet' });
    const uploadingStates: boolean[] = [];
    fixture.componentInstance.uploadingChange.subscribe((state) => uploadingStates.push(state as boolean));

    chooseFile(fixture, makeFile('f.pdf', 2048, 'application/pdf'));
    const req = http.expectOne(`${API_BASE}/uploads/tech-sheet`);
    req.flush(
      { data: null, error: { message: 'Failed to upload file', code: null }, meta: null },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(uploadingStates).toEqual([true, false]);
  });

  it('previews the existing gallery url when provided (edit reload)', () => {
    setup({ kind: 'gallery-image', previewUrl: 'https://x/existing.webp' });
    const img = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://x/existing.webp');
  });
});
