import type { Routes } from '@angular/router';
import { authGuard } from '../features/auth/auth.guard';

/**
 * Admin panel routes (change `admin-panel-foundation`, tasks 4.1 + 3.3).
 *
 * - The root redirects to the post-login target (`/profile` for Foundation;
 *   `admin-panel-content` re-points it to `/dashboard`).
 * - `/login` stays public, lazy and outside the shell (spec `admin-login`).
 * - Protected pages live under the shell layout (sidebar + header) guarded by
 *   `authGuard`; the wildcard renders the 404 inside the shell.
 * - Future module routes (dashboard, categories, ..., users) extend
 *   `SHELL_CHILDREN` with their own guards.
 */
export const POST_LOGIN_REDIRECT = '/profile';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: POST_LOGIN_REDIRECT },
  {
    path: 'login',
    loadComponent: () =>
      import('../features/auth/login/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../shared/layout/app-layout/app-layout.component').then(
        (m) => m.AppLayoutComponent,
      ),
    children: [
      {
        path: 'profile',
        loadComponent: () =>
          import('../features/profile/pages/profile-page.component').then(
            (m) => m.ProfilePageComponent,
          ),
      },
      {
        path: '**',
        loadComponent: () =>
          import('../features/shell/pages/not-found/not-found.component').then(
            (m) => m.NotFoundPageComponent,
          ),
      },
    ],
  },
];
