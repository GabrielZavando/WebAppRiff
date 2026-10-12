/**
 * Panel navigation constants (change `admin-panel-foundation`, design D5).
 *
 * `POST_LOGIN_REDIRECT` is the destination after a successful login and for
 * the root redirect. It is `/profile` while Foundation is the only delivered
 * slice; `admin-panel-content` re-points it to `/dashboard`. Kept in its own
 * module so routes, guards and services can import it without cycles.
 */
export const POST_LOGIN_REDIRECT = '/profile';

export const LOGIN_PATH = '/login';
