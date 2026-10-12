import { describe, expect, it } from 'vitest';

import { POST_LOGIN_REDIRECT, appRoutes } from './app.routes';
import { authGuard } from '../features/auth/auth.guard';

/**
 * Base routing contract (task 4.1 / spec `admin-app-shell`, delta
 * `admin-login`): root redirects to the post-login target, `/login` stays
 * public and lazy outside the shell, protected pages live under an
 * auth-guarded shell with a nested outlet, and the wildcard renders the 404
 * inside the shell. Redirect/guard behavior itself is covered by
 * `auth.guard.test.ts`; this test pins the route table structure.
 */
describe('appRoutes (task 4.1)', () => {
  it('redirects the root to POST_LOGIN_REDIRECT (/profile)', () => {
    const root = appRoutes.find((route) => route.path === '' && route.redirectTo !== undefined);

    expect(root).toBeDefined();
    expect(root?.redirectTo).toBe(POST_LOGIN_REDIRECT);
    expect(POST_LOGIN_REDIRECT).toBe('/profile');
    expect(root?.pathMatch).toBe('full');
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

  it('renders the wildcard inside the shell (404 without leaving the layout)', () => {
    const shell = appRoutes.find((route) => route.canActivate !== undefined);
    const wildcard = (shell?.children ?? []).find((child) => child.path === '**');

    expect(wildcard).toBeDefined();
    expect(wildcard?.loadComponent).toBeDefined();
  });
});
