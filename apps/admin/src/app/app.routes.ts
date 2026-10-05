import type { Routes } from '@angular/router';

/**
 * Admin panel routes (change `admin-login-panel`, ticket LOGIN-1).
 *
 * The root path redirects to `/login` and the login page is lazy-loaded
 * (`loadComponent`) following the project performance standard. Future
 * admin routes (dashboard, users, ...) extend this array.
 */
export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () =>
      import('../features/auth/login/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
  },
];