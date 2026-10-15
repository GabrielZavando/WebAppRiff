/**
 * Panel navigation constants (change `admin-panel-foundation`, design D5;
 * re-pointed by `admin-panel-content`).
 *
 * `POST_LOGIN_REDIRECT` is the destination after a successful login and for
 * the root redirect. It is `/products` since `admin-panel-content`: the
 * dashboard promised during Foundation is deferred. This module is the SINGLE
 * source — `app.routes.ts` and `AuthService` import it from here (no local
 * copies). Kept in its own module so routes, guards and services can import
 * it without cycles.
 */
export const POST_LOGIN_REDIRECT = '/products';

export const LOGIN_PATH = '/login';
