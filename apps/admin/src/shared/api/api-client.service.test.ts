import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import {
  ApiClientService,
  ApiError,
  ApiEnvelope,
} from './api-client.service';

/**
 * Contract (task 1.4): ApiClientService targets the backend base URL from the
 * environment, unwraps the standard `{ data, error, meta }` envelope and maps
 * backend failures to a typed `ApiError`.
 */
describe('ApiClientService', () => {
  let http: HttpTestingController;
  let client: ApiClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(ApiClientService);
  });

  afterEach(() => {
    http.verify();
  });

  it('requests the backend base URL and unwraps the data field', () => {
    let result: { id: string } | undefined;

    client.get<{ id: string }>('auth/me').subscribe((profile) => {
      result = profile;
    });

    const req = http.expectOne('http://localhost:3000/api/v1/auth/me');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { id: 'u1' }, error: null, meta: null } satisfies ApiEnvelope<{ id: string }>);

    expect(result).toEqual({ id: 'u1' });
  });

  it('sends and unwraps mutation verbs (post/patch/delete)', () => {
    const envelope = { data: { ok: true }, error: null, meta: null };

    let postResult: unknown;
    let patchResult: unknown;
    let deleteResult: unknown;

    client.post('categories', { nombre: 'Nueva' }).subscribe((r) => (postResult = r));
    client.patch('quotes/1', { estado: 'atendida' }).subscribe((r) => (patchResult = r));
    client.delete('categories/1').subscribe((r) => (deleteResult = r));

    const post = http.expectOne('http://localhost:3000/api/v1/categories');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ nombre: 'Nueva' });
    post.flush(envelope);

    const patch = http.expectOne('http://localhost:3000/api/v1/quotes/1');
    expect(patch.request.method).toBe('PATCH');
    patch.flush(envelope);

    const del = http.expectOne('http://localhost:3000/api/v1/categories/1');
    expect(del.request.method).toBe('DELETE');
    del.flush(envelope);

    expect(postResult).toEqual({ ok: true });
    expect(patchResult).toEqual({ ok: true });
    expect(deleteResult).toEqual({ ok: true });
  });

  it('maps a backend error envelope to a typed ApiError', () => {
    let caught: unknown;

    client.get('auth/me').subscribe({
      next: () => fail('should not succeed'),
      error: (error: unknown) => (caught = error),
    });

    const req = http.expectOne('http://localhost:3000/api/v1/auth/me');
    req.flush(
      { data: null, error: { message: 'User not found', code: 'NOT_FOUND' }, meta: null },
      { status: 404, statusText: 'Not Found' },
    );

    expect(caught).toBeInstanceOf(ApiError);
    const apiError = caught as ApiError;
    expect(apiError.message).toBe('User not found');
    expect(apiError.status).toBe(404);
    expect(apiError.code).toBe('NOT_FOUND');
  });

  it('maps non-envelope HTTP failures to ApiError with the status', () => {
    let caught: unknown;

    client.get('auth/me').subscribe({
      next: () => fail('should not succeed'),
      error: (error: unknown) => (caught = error),
    });

    const req = http.expectOne('http://localhost:3000/api/v1/auth/me');
    req.flush('boom', { status: 503, statusText: 'Service Unavailable' });

    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).status).toBe(503);
  });

  describe('getWithMeta (task 1.1 / design D1)', () => {
    it('returns both data and meta from the envelope (unwrap discards meta)', () => {
      let result: { data: unknown; meta: Record<string, unknown> | null } | undefined;

      client
        .getWithMeta<{ items: string[] }>('products?page=1&limit=24')
        .subscribe((value) => (result = value));

      const req = http.expectOne('http://localhost:3000/api/v1/products?page=1&limit=24');
      expect(req.request.method).toBe('GET');
      req.flush({
        data: { items: ['p1'] },
        error: null,
        meta: { page: 1, limit: 24, total: 100 },
      });

      expect(result).toEqual({
        data: { items: ['p1'] },
        meta: { page: 1, limit: 24, total: 100 },
      });
    });

    it('returns a null meta when the envelope carries none', () => {
      let result: { data: unknown; meta: Record<string, unknown> | null } | undefined;

      client.getWithMeta<string>('categories').subscribe((value) => (result = value));

      const req = http.expectOne('http://localhost:3000/api/v1/categories');
      req.flush({ data: ['c1'], error: null, meta: null });

      expect(result).toEqual({ data: ['c1'], meta: null });
    });

    it('maps backend failures to ApiError like the plain get', () => {
      let caught: unknown;

      client.getWithMeta('products').subscribe({
        next: () => fail('should not succeed'),
        error: (error: unknown) => (caught = error),
      });

      const req = http.expectOne('http://localhost:3000/api/v1/products');
      req.flush(
        { data: null, error: { message: 'Invalid page', code: 'BAD_REQUEST' }, meta: null },
        { status: 400, statusText: 'Bad Request' },
      );

      expect(caught).toBeInstanceOf(ApiError);
      expect((caught as ApiError).message).toBe('Invalid page');
      expect((caught as ApiError).status).toBe(400);
    });
  });
});
