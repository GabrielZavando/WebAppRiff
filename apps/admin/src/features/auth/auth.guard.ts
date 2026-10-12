import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LOGIN_PATH } from '../../app/app-navigation';

/**
 * Functional auth guard (task 2.2 / spec `admin-auth`, design D5).
 *
 * Protects panel routes. It awaits `AuthService.ready` first: on a page
 * reload the Firebase SDK restores the persisted session asynchronously
 * (indexedDB) while the initial Angular navigation runs synchronously —
 * deciding with the pre-restore state kicked signed-in users back to
 * `/login` (session-restoration bug). Once initialization resolved: without
 * a session it redirects to `/login`, preserving the requested URL in the
 * `returnUrl` query param so the login can bring the user back after
 * authenticating.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.ready.then(() => {
    if (authService.isAuthenticated()) {
      return true;
    }
    return router.createUrlTree([LOGIN_PATH.replace(/^\//, '')], {
      queryParams: { returnUrl: state.url },
    });
  });
};
