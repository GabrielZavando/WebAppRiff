import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { POST_LOGIN_REDIRECT } from './app-navigation';
import { appRoutes } from './app.routes';
import { authGuard } from '../features/auth/auth.guard';
import { usersGuard } from '../features/users/users.guard';

/**
 * Base routing contract (task 4.1 / spec `admin-app-shell`, delta
 * `admin-panel-content`): root redirects to `/products` from a single source,
 * `/login` stays public and lazy outside the shell, protected pages live under
 * an auth-guarded shell with a nested outlet, and the wildcard renders the 404
 * inside the shell. Redirect/guard behavior itself is covered by
 * `auth.guard.test.ts`; this test pins the route table structure.
 */
describe('appRoutes (spec delta admin-app-shell / admin-panel-content)', () => {
  it('redirects the root to POST_LOGIN_REDIRECT (/products) from a single source', () => {
    const root = appRoutes.find((route) => route.path === '' && route.redirectTo !== undefined);

    expect(root).toBeDefined();
    expect(root?.redirectTo).toBe(POST_LOGIN_REDIRECT);
    expect(POST_LOGIN_REDIRECT).toBe('/products');
    expect(root?.pathMatch).toBe('full');

    // Single source (task 2.1): app.routes.ts imports the constant from
    // app-navigation.ts and must not re-declare it.
    const routesSource = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), 'app.routes.ts'),
      'utf-8',
    );
    expect(routesSource).not.toMatch(/POST_LOGIN_REDIRECT\s*=\s*['"]/);
    expect(routesSource).toContain("from './app-navigation'");
  });

  it('keeps /login public and lazy outside the shell', () => {
    const login = appRoutes.find((route) => route.path === 'login');

    expect(login).toBeDefined();
    expect(login?.canActivate).toBeUndefined();
    expect(login?.loadComponent).toBeDefined();
  });

  it('hosts protected pages under an auth-guarded shell', () => {
    const shell = appRoutes.find((route) => route.canActivate !== undefined);

    expect(shell?.canActivate).toContain(authGuard);
    expect(shell?.loadComponent).toBeDefined();

    const childPaths = (shell?.children ?? []).map((child) => child.path);
    expect(childPaths).toContain('profile');
  });

  it('registers the catalog routes as lazy shell children, literals before params', () => {
    const shell = appRoutes.find((route) => route.canActivate !== undefined);
    const childPaths = (shell?.children ?? []).map((child) => child.path);

    const expected = [
      'products',
      'products/new',
      'products/:id',
      'categories',
      'categories/new',
      'categories/:id',
      'categories/:id/subcategories/new',
      'categories/:id/subcategories/:subId',
    ];
    for (const path of expected) {
      expect(childPaths, `missing child route ${path}`).toContain(path);
    }

    // Literal segments must precede their parameterized counterparts so the
    // router never shadows them (design D8).
    const indexOf = (path: string): number => childPaths.indexOf(path);
    expect(indexOf('products/new')).toBeLessThan(indexOf('products/:id'));
    expect(indexOf('categories/new')).toBeLessThan(indexOf('categories/:id'));
    expect(indexOf('categories/:id')).toBeLessThan(indexOf('categories/:id/subcategories/new'));
    expect(indexOf('categories/:id/subcategories/new')).toBeLessThan(
      indexOf('categories/:id/subcategories/:subId'),
    );
  });

  it('registers the users routes as lazy shell children with the role guard', () => {
    const shell = appRoutes.find((route) => route.canActivate !== undefined);
    const children = shell?.children ?? [];
    const childPaths = children.map((child) => child.path);

    for (const path of ['users', 'users/new', 'users/:id']) {
      expect(childPaths, `missing child route ${path}`).toContain(path);
    }

    // Literal before parameter (design D8 pattern).
    const indexOf = (path: string): number => childPaths.indexOf(path);
    expect(indexOf('users/new')).toBeLessThan(indexOf('users/:id'));

    // All three carry the module role guard on top of the inherited authGuard.
    for (const route of children.filter((child) => child.path?.startsWith('users'))) {
      expect(route.canActivate, `usersGuard on /${route.path}`).toContain(usersGuard);
      expect(route.canActivateChild ?? route.canActivate).toBeDefined();
    }
  });

  it('renders the wildcard inside the shell (404 without leaving the layout)', () => {
    const shell = appRoutes.find((route) => route.canActivate !== undefined);
    const wildcard = (shell?.children ?? []).find((child) => child.path === '**');

    expect(wildcard).toBeDefined();
    expect(wildcard?.loadComponent).toBeDefined();
  });
});
