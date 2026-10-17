import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { usersGuard } from './users.guard';
import { RoleService } from '../auth/role.service';
import { POST_LOGIN_REDIRECT } from '../../app/app-navigation';

/**
 * Route guard contract (task 5.1 / design D6, spec `Visibilidad por rol en el
 * dominio users`): `admin` and `superadmin` pass (hierarchy-aware hasRole);
 * `editor` — or a profile that has not loaded — is redirected to the
 * post-login destination (hide, never just disable).
 */
describe('usersGuard (task 5.1)', () => {
  const setup = (hasRole: boolean) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: RoleService, useValue: { hasRole: vi.fn(() => hasRole) } },
      ],
    });
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() =>
      usersGuard({} as never, {} as never),
    );
    return { router, result };
  };

  it('allows admin and superadmin through', () => {
    const { result } = setup(true);

    expect(result).toBe(true);
  });

  it('redirects an editor to the post-login destination', () => {
    const { result } = setup(false);

    expect((result as ReturnType<Router['createUrlTree']>).toString()).toBe(
      POST_LOGIN_REDIRECT,
    );
  });
});
