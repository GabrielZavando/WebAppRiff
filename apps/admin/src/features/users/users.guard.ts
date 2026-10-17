import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { RoleService } from '../auth/role.service';
import { POST_LOGIN_REDIRECT } from '../../app/app-navigation';

/**
 * Role guard for the users module (task 5.1 / design D6). Applied on top of
 * the shell's `authGuard`: only `admin` and `superadmin` reach `/users*`
 * (hierarchy-aware `hasRole('admin')`); anyone else — an `editor`, or a
 * session whose profile has not loaded — is redirected to the post-login
 * destination instead of rendering a section they must not see.
 */
export const usersGuard: CanActivateFn = () => {
  const roleService = inject(RoleService);
  const router = inject(Router);

  if (roleService.hasRole('admin')) {
    return true;
  }
  return router.createUrlTree([POST_LOGIN_REDIRECT.replace(/^\//, '')]);
};
