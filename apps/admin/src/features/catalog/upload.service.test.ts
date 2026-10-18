import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { UploadService, UploadedAsset } from './upload.service';

/** Contract (task 3.2): UploadService uploads gallery images and tech sheets. */
describe('UploadService', () => {
  let service: UploadService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(UploadService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('uploadImage POSTs the multipart with no product metadata (single tmp- path)', () => {
    let result: UploadedAsset | undefined;

    const formData = new FormData();
    formData.append('file', new Blob(['x'], { type: 'image/webp' }), 'a.webp');

    service.uploadImage(formData).subscribe((asset) => (result = asset));

    const req = http.expectOne('http://localhost:3000/api/v1/uploads/images');
    expect(req.request.body).toBeInstanceOf(FormData);
    expect((req.request.body as FormData).get('productoId')).toBeNull();
    req.flush({ data: { url: 'u', storagePath: 's' }, error: null, meta: null });

    expect(result).toEqual({ url: 'u', storagePath: 's' });
  });

  it('uploadImage rides the standard envelope unwrap', () => {
    let called = false;

    const formData = new FormData();
    formData.append('file', new Blob(['x']), 'a.webp');

    service.uploadImage(formData).subscribe(() => {
      called = true;
    });

    const req = http.expectOne('http://localhost:3000/api/v1/uploads/images');
    expect((req.request.body as FormData).get('productoId')).toBeNull();
    req.flush({ data: { url: 'u', storagePath: 's' }, error: null, meta: null });

    expect(called).toBe(true);
  });

  it('uploadTechSheet POSTs the multipart with no product metadata (single tmp- path)', () => {
    let result: UploadedAsset | undefined;

    const formData = new FormData();
    formData.append('file', new Blob(['%PDF-1.7 body'], { type: 'application/pdf' }), 'f.pdf');

    service.uploadTechSheet(formData).subscribe((asset) => (result = asset));

    const req = http.expectOne('http://localhost:3000/api/v1/uploads/tech-sheet');
    expect(req.request.body).toBeInstanceOf(FormData);
    expect((req.request.body as FormData).get('productoId')).toBeNull();
    req.flush({ data: { url: 'u2', storagePath: 's2' }, error: null, meta: null });

    expect(result).toEqual({ url: 'u2', storagePath: 's2' });
  });
});
