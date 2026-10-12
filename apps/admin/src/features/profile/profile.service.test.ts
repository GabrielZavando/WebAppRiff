import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AdminUserProfile } from '../../auth/auth.models';
import { ProfileService } from './profile.service';

const API_BASE = 'http://localhost:3000/api/v1';
const PROFILE: AdminUserProfile = {
  id: 'uid-1',
  nombre: 'Ada Lovelace',
  email: 'ada@riff.cl',
  rol: 'admin',
  activo: true,
};

/**
 * Contract (task 6.1 / spec `admin-profile`): ProfileService fetches the
 * signed-in user's profile from `GET /api/v1/auth/me` and unwraps the
 * standard `{ data, error, meta }` envelope.
 */
describe('ProfileService (task 6.1)', () => {
  let service: ProfileService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProfileService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('fetches /auth/me and unwraps the envelope data', () => {
    let result: AdminUserProfile | undefined;

    service.getProfile().subscribe((profile) => {
      result = profile;
    });

    const req = http.expectOne(`${API_BASE}/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: PROFILE, error: null, meta: null });

    expect(result).toEqual(PROFILE);
  });

  it('propagates backend failures as ApiError', () => {
    let caught: unknown;

    service.getProfile().subscribe({
      next: () => fail('should not succeed'),
      error: (error: unknown) => (caught = error),
    });

    const req = http.expectOne(`${API_BASE}/auth/me`);
    req.flush(
      { data: null, error: { message: 'User not found', code: 'NOT_FOUND' }, meta: null },
      { status: 404, statusText: 'Not Found' },
    );

    expect((caught as { message: string }).message).toBe('User not found');
  });
});
