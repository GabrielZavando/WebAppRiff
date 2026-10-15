import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';

const { setAuthStateCallback } = vi.hoisted(() => {
  const setAuthStateCallback = (callback: (user: unknown) => void): void => {
    // Keep only the latest callback: every test builds a fresh AuthService,
    // and stale callbacks would fire cross-test HTTP calls.
    (setAuthStateCallback as { current?: (user: unknown) => void }).current = callback;
  };
  return { setAuthStateCallback };
});

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'test' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  onAuthStateChanged: vi.fn((_auth: unknown, callback: (user: unknown) => void) => {
    setAuthStateCallback(callback);
    return () => undefined;
  }),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { AuthService } from './auth.service';

const API_BASE = 'http://localhost:3000/api/v1';
const PROFILE = {
  id: 'uid-1',
  nombre: 'Ada Lovelace',
  email: 'ada@riff.cl',
  rol: 'admin',
  activo: true,
};

function fakeUser(overrides?: { getIdToken?: () => Promise<string> }): {
  uid: string;
  getIdToken: () => Promise<string>;
} {
  return { uid: 'uid-1', getIdToken: overrides?.getIdToken ?? (async () => 'token-123') };
}

function emitAuthState(user: unknown): void {
  const current = (setAuthStateCallback as { current?: (user: unknown) => void }).current;
  current?.(user);
}

/** Lets pending microtasks (signIn promise, auth-state handler) settle. */
async function flushAsync(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('AuthService (task 2.1 / spec admin-auth)', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    vi.mocked(signInWithEmailAndPassword).mockReset();
    vi.mocked(signOut).mockReset();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('starts initializing without a session', () => {
    expect(service.isInitializing()).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('ready stays pending until the first SDK event fires (reload race)', async () => {
    const pending = await Promise.race([
      service.ready.then(() => 'resolved'),
      new Promise((resolve) => setTimeout(() => resolve('pending'), 50)),
    ]);
    expect(pending, 'ready must wait for the first onAuthStateChanged').toBe('pending');
    expect(service.isInitializing()).toBe(true);
  });

  it('ready resolves once the first SDK event restored the session', async () => {
    emitAuthState(fakeUser());
    await flushAsync();
    const req = http.expectOne(`${API_BASE}/auth/me`);
    req.flush({ data: PROFILE, error: null, meta: null });

    await service.ready;

    expect(service.isInitializing()).toBe(false);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('ready resolves once the first SDK event reported no session', async () => {
    emitAuthState(null);
    await flushAsync();

    await service.ready;

    expect(service.isInitializing()).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('login authenticates, loads the profile and redirects to POST_LOGIN_REDIRECT (/products)', async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
      user: fakeUser(),
    } as never);

    const login = service.login('ada@riff.cl', 'secret6');
    await flushAsync();
    const req = http.expectOne(`${API_BASE}/auth/me`);
    req.flush({ data: PROFILE, error: null, meta: null });
    await login;

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'ada@riff.cl',
      'secret6',
    );
    expect(service.currentUser()).toEqual(PROFILE);
    expect(service.isAuthenticated()).toBe(true);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/products');
  });

  it('login redirects to returnUrl when present', async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
      user: fakeUser(),
    } as never);
    Object.defineProperty(router.routerState.snapshot.root, 'queryParamMap', {
      value: new Map([['returnUrl', '/categories']]),
      configurable: true,
    });

    const login = service.login('ada@riff.cl', 'secret6');
    await flushAsync();
    const req = http.expectOne(`${API_BASE}/auth/me`);
    req.flush({ data: PROFILE, error: null, meta: null });
    await login;

    expect(router.navigateByUrl).toHaveBeenCalledWith('/categories');
  });

  it('login failure rejects without navigation or backend call', async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue(
      new Error('auth/invalid-credential'),
    );

    await expect(service.login('ada@riff.cl', 'wrong1')).rejects.toThrow(
      'auth/invalid-credential',
    );

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    http.verify();
  });

  it('logout signs out, clears state and redirects to /login', async () => {
    vi.mocked(signOut).mockResolvedValue(undefined as never);
    emitAuthState(fakeUser());
    await flushAsync();
    const req = http.expectOne(`${API_BASE}/auth/me`);
    req.flush({ data: PROFILE, error: null, meta: null });
    await vi.waitFor(() => expect(service.isAuthenticated()).toBe(true));

    await service.logout();

    expect(signOut).toHaveBeenCalled();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('getIdToken resolves the current user token', async () => {
    emitAuthState(fakeUser());
    await flushAsync();
    const req = http.expectOne(`${API_BASE}/auth/me`);
    req.flush({ data: PROFILE, error: null, meta: null });
    await vi.waitFor(() => expect(service.isInitializing()).toBe(false));

    await expect(service.getIdToken()).resolves.toBe('token-123');
  });

  it('getIdToken resolves null without a session', async () => {
    emitAuthState(null);
    await flushAsync();
    await vi.waitFor(() => expect(service.isInitializing()).toBe(false));

    await expect(service.getIdToken()).resolves.toBeNull();
  });

  it('restores the session after a page reload via onAuthStateChanged', async () => {
    emitAuthState(fakeUser());
    await flushAsync();
    const req = http.expectOne(`${API_BASE}/auth/me`);
    req.flush({ data: PROFILE, error: null, meta: null });

    await vi.waitFor(() => {
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()).toEqual(PROFILE);
      expect(service.isInitializing()).toBe(false);
    });
  });

  it('keeps the session but a null profile when /auth/me fails (e.g. 404)', async () => {
    emitAuthState(fakeUser());
    await flushAsync();
    const req = http.expectOne(`${API_BASE}/auth/me`);
    req.flush({ data: null, error: { message: 'User not found' }, meta: null }, {
      status: 404,
      statusText: 'Not Found',
    });

    await vi.waitFor(() => {
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()).toBeNull();
      expect(service.isInitializing()).toBe(false);
    });
  });
});
