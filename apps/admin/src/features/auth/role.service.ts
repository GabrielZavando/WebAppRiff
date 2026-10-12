import { computed, inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { UsuarioRol } from './auth.models';

const ROLE_RANK: Record<UsuarioRol, number> = {
  editor: 1,
  admin: 2,
  superadmin: 3,
};

/**
 * Role access service (task 2.3 / spec `admin-role-access`, design D6).
 *
 * Single UI source of truth for the signed-in user's role (profile loaded by
 * `AuthService` from `GET /api/v1/auth/me`). `hasRole(...)` applies the
 * `editor < admin < superadmin` hierarchy: the caller satisfies the check
 * when their role's rank reaches the lowest rank among the required roles.
 * Without a loaded profile every check is false (no default permission).
 *
 * Consumption (hiding disallowed actions, role route guards) is specified by
 * the later `admin-panel-content` / `admin-panel-operations` changes, which
 * must hide — not merely disable — forbidden actions.
 */
@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly authService = inject(AuthService);

  /** Current role signal (null while the profile is not loaded). */
  readonly role = computed<UsuarioRol | null>(() => this.authService.currentUser()?.rol ?? null);

  /**
   * True when the signed-in user's role satisfies the requirement set
   * (hierarchy-aware). Always false without a loaded profile.
   */
  hasRole(...roles: UsuarioRol[]): boolean {
    const current = this.role();
    if (current === null || roles.length === 0) {
      return false;
    }
    const requiredRank = Math.min(...roles.map((role) => ROLE_RANK[role]));
    return ROLE_RANK[current] >= requiredRank;
  }
}
