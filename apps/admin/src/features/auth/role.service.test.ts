import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { AuthService } from './auth.service';
import { RoleService } from './role.service';
import { AdminUserProfile } from './auth.models';

/**
 * Contract (task 2.3 / spec `admin-role-access`): `hasRole` implements the
 * editor < admin < superadmin hierarchy — a user satisfies a set of roles
 * when their rank reaches the lowest rank in the set — and always returns
 * false while no profile is loaded.
 */
describe('RoleService (task 2.3)', () => {
  let profileSignal: ReturnType<typeof signal<AdminUserProfile | null>>;

  function setup(profile: AdminUserProfile | null): void {
    // Production `AuthService.currentUser` is a signal; the mock mirrors that
    // so the computed `role` reacts to profile updates like in the real app.
    profileSignal = signal<AdminUserProfile | null>(profile);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { currentUser: profileSignal.asReadonly() } }],
    });
  }

  it('editor: hasRole(editor) is true; hasRole(admin, superadmin) is false', () => {
    setup(profile('editor'));
    const service = TestBed.inject(RoleService);

    expect(service.hasRole('editor')).toBe(true);
    expect(service.hasRole('admin', 'superadmin')).toBe(false);
  });

  it('admin: hasRole(admin, superadmin) is true', () => {
    setup(profile('admin'));
    const service = TestBed.inject(RoleService);

    expect(service.hasRole('admin', 'superadmin')).toBe(true);
    expect(service.hasRole('editor')).toBe(true);
  });

  it('superadmin: hasRole(admin, superadmin) is true', () => {
    setup(profile('superadmin'));
    const service = TestBed.inject(RoleService);

    expect(service.hasRole('admin', 'superadmin')).toBe(true);
    expect(service.hasRole('superadmin')).toBe(true);
  });

  it('returns false while no profile is loaded', () => {
    setup(null);
    const service = TestBed.inject(RoleService);

    expect(service.role()).toBeNull();
    expect(service.hasRole('editor')).toBe(false);
    expect(service.hasRole('admin', 'superadmin')).toBe(false);
  });

  it('reacts to profile changes (signal source)', () => {
    setup(null);
    const service = TestBed.inject(RoleService);
    expect(service.hasRole('admin', 'superadmin')).toBe(false);

    profileSignal.set(profile('admin'));
    expect(service.hasRole('admin', 'superadmin')).toBe(true);
  });
});

function profile(rol: AdminUserProfile['rol']): AdminUserProfile {
  return { id: 'uid-1', nombre: 'Ada', email: 'ada@riff.cl', rol, activo: true };
}
