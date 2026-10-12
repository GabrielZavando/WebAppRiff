import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from '../../features/auth/auth.service';
import { authInterceptor } from './auth.interceptor';

/**
 * Contract (task 1.5 / spec `admin-auth`): the interceptor attaches
 * `Authorization: Bearer <idToken>` to backend requests when a session exists,
 * leaves requests untouched without one, and treats a backend 401 as an
 * invalid session (logout + redirect to /login).
 *
 * The interceptor resolves the token asynchronously, so tests flush a
 * macrotask before matching the pending request in the testing backend.
 */
describe('authInterceptor', () => {
  let http: HttpTestingController;
  let httpClient: HttpClient;
  let authServiceMock: { getIdToken: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };
  let router: Router;

  function setup(getIdTokenResult: string | null): void {
    authServiceMock = {
      getIdToken: vi.fn().mockResolvedValue(getIdTokenResult),
      logout: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        provideRouter([]),
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  }

  /** Lets pending microtasks/macrotasks (token resolution) settle. */
  async function flushAsync(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('adds the Bearer header to backend requests with a session', async () => {
    setup('valid-token');

    const done = vi.fn();
    httpClient.get('http://localhost:3000/api/v1/auth/me').subscribe(done);
    await flushAsync();

    const req = http.expectOne('http://localhost:3000/api/v1/auth/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
    req.flush({ data: { ok: true }, error: null, meta: null });
    await flushAsync();
    expect(done).toHaveBeenCalledWith({ data: { ok: true }, error: null, meta: null });
  });

  it('continues without the header when there is no session', async () => {
    setup(null);

    const done = vi.fn();
    httpClient.get('http://localhost:3000/api/v1/categories').subscribe(done);
    await flushAsync();

    const req = http.expectOne('http://localhost:3000/api/v1/categories');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ data: [], error: null, meta: null });
    await flushAsync();
    expect(done).toHaveBeenCalledWith({ data: [], error: null, meta: null });
  });

  it('logs out and redirects to /login when the backend answers 401', async () => {
    setup('expired-token');
    // Real `AuthService.logout()` clears state and navigates to /login; the
    // mock mirrors that so the interceptor's delegation is what gets asserted.
    authServiceMock.logout.mockImplementation(async () => {
      await router.navigate(['/login']);
    });

    const errors: unknown[] = [];
    httpClient.get('http://localhost:3000/api/v1/auth/me').subscribe({
      error: (error: unknown) => errors.push(error),
    });
    await flushAsync();

    const req = http.expectOne('http://localhost:3000/api/v1/auth/me');
    req.flush(
      { data: null, error: { message: 'Unauthorized' }, meta: null },
      { status: 401, statusText: 'Unauthorized' },
    );
    await flushAsync();

    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(errors).toHaveLength(1);
  });
});
