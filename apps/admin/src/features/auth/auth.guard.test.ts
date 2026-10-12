import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

/**
 * Contract (task 2.2 / spec `admin-auth`): the functional guard allows
 * authenticated users and, without a session, redirects to /login preserving
 * the target URL as `returnUrl`.
 *
 * Reload-restoration contract (session-restoration bug fix): on a page reload
 * the Firebase SDK restores the session ASYNCHRONOUSLY (indexedDB read), so
 * the guard MUST wait for `AuthService.ready` before deciding — deciding with
 * the pre-restore state kicks a signed-in user back to /login.
 */
describe('authGuard (task 2.2 + session-restoration fix)', () => {
  function runGuard(url: string): Promise<boolean | UrlTree> {
    const route = {} as ActivatedRouteSnapshot;
    const state = { url } as RouterStateSnapshot;
    return Promise.resolve(
      TestBed.runInInjectionContext(() => authGuard(route, state)) as
        | boolean
        | UrlTree
        | Promise<boolean | UrlTree>,
    );
  }

  function setup(mock: {
    isAuthenticated: () => boolean;
    ready: Promise<void>;
  }): void {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: mock }],
    });
  }

  it('redirects to /login with returnUrl when initialization resolved without a session', async () => {
    setup({ isAuthenticated: () => false, ready: Promise.resolve() });

    const result = await runGuard('/profile');

    expect(result).toBeInstanceOf(UrlTree);
    const tree = result as UrlTree;
    expect(tree.toString()).toBe('/login?returnUrl=%2Fprofile');
  });

  it('allows activation when authenticated', async () => {
    setup({ isAuthenticated: () => true, ready: Promise.resolve() });

    expect(await runGuard('/profile')).toBe(true);
  });

  it('waits for the SDK initialization before deciding (reload race)', async () => {
    let resolveReady: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });
    let authenticated = false;
    setup({ isAuthenticated: () => authenticated, ready });

    const resultPromise = runGuard('/profile');

    // While the SDK has not fired its first event, the guard stays pending.
    const pending = await Promise.race([
      resultPromise.then(() => 'resolved'),
      new Promise((resolve) => setTimeout(() => resolve('pending'), 50)),
    ]);
    expect(pending, 'guard must not decide before AuthService.ready').toBe('pending');

    // The SDK restores the session → the guard then allows the route.
    authenticated = true;
    resolveReady();

    expect(await resultPromise).toBe(true);
  });

  it('redirects only after initialization resolves without a session', async () => {
    let resolveReady: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });
    setup({ isAuthenticated: () => false, ready });

    const resultPromise = runGuard('/profile');
    resolveReady();

    expect(await resultPromise).toBeInstanceOf(UrlTree);
  });
});
