import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../features/auth/auth.service';
import { environment } from '../../environments/environment';

/**
 * Auth transport layer (task 1.5 / spec `admin-auth`, design D4).
 *
 * - Attaches `Authorization: Bearer <idToken>` to backend requests (URL under
 *   `environment.apiBaseUrl`) when a session exists; passes through otherwise.
 * - Treats a backend `401` as an invalid session: delegates to
 *   `AuthService.logout()` (which clears state and redirects to `/login`)
 *   and rethrows the original error for the caller.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const backendBase = environment.apiBaseUrl.replace(/\/$/, '');
  if (!req.url.startsWith(backendBase)) {
    return next(req);
  }

  const authService = inject(AuthService);

  return from(authService.getIdToken()).pipe(
    switchMap((token) => {
      const authedReq =
        token === null
          ? req
          : req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      return next(authedReq).pipe(
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            return from(
              authService.logout().then(() => {
                throw error;
              }),
            );
          }
          return throwError(() => error);
        }),
      );
    }),
  );
};
