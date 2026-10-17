import type { Routes } from '@angular/router';
import { authGuard } from '../features/auth/auth.guard';
import { usersGuard } from '../features/users/users.guard';
import { POST_LOGIN_REDIRECT } from './app-navigation';

/**
 * Admin panel routes (change `admin-panel-foundation`, tasks 4.1 + 3.3;
 * catalog routes added by `admin-panel-content`, design D8; users routes by
 * `admin-panel-operations`, design D6).
 *
 * - The root redirects to the post-login target (`/products` since
 *   `admin-panel-content`; single source in `app-navigation.ts`).
 * - `/login` stays public, lazy and outside the shell (spec `admin-login`).
 * - Protected pages live under the shell layout (sidebar + header) guarded by
 *   `authGuard`; the wildcard renders the 404 inside the shell. Catalog child
 *   routes are ordered literals-before-params so the router never shadows
 *   `/products/new` or `/categories/:id/subcategories/new`.
 * - The users module adds its `usersGuard` (admin and above) to its three
 *   lazy children — an editor is redirected away from the section entirely.
 */
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
        path: 'products',
        loadComponent: () =>
          import('../features/catalog/pages/products-page.component').then(
            (m) => m.ProductsPageComponent,
          ),
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('../features/catalog/pages/producto-form-page.component').then(
            (m) => m.ProductoFormPageComponent,
          ),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('../features/catalog/pages/producto-form-page.component').then(
            (m) => m.ProductoFormPageComponent,
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('../features/catalog/pages/categories-page.component').then(
            (m) => m.CategoriesPageComponent,
          ),
      },
      {
        path: 'categories/new',
        loadComponent: () =>
          import('../features/catalog/pages/categoria-form-page.component').then(
            (m) => m.CategoriaFormPageComponent,
          ),
      },
      {
        path: 'categories/:id',
        loadComponent: () =>
          import('../features/catalog/pages/categoria-form-page.component').then(
            (m) => m.CategoriaFormPageComponent,
          ),
      },
      {
        path: 'categories/:id/subcategories/new',
        loadComponent: () =>
          import('../features/catalog/pages/subcategoria-form-page.component').then(
            (m) => m.SubcategoriaFormPageComponent,
          ),
      },
      {
        path: 'categories/:id/subcategories/:subId',
        loadComponent: () =>
          import('../features/catalog/pages/subcategoria-form-page.component').then(
            (m) => m.SubcategoriaFormPageComponent,
          ),
      },
      {
        path: 'users',
        canActivate: [usersGuard],
        loadComponent: () =>
          import('../features/users/pages/users-page.component').then(
            (m) => m.UsersPageComponent,
          ),
      },
      {
        path: 'users/new',
        canActivate: [usersGuard],
        loadComponent: () =>
          import('../features/users/pages/user-form-page.component').then(
            (m) => m.UserFormPageComponent,
          ),
      },
      {
        path: 'users/:id',
        canActivate: [usersGuard],
        loadComponent: () =>
          import('../features/users/pages/user-form-page.component').then(
            (m) => m.UserFormPageComponent,
          ),
      },
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
