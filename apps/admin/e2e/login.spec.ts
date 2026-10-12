import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * Smoke E2E for the admin login panel (change `admin-login-panel`,
 * ticket LOGIN-1). Covers SC-001 (render), SC-006 (root redirect) and
 * SC-009 (responsive without horizontal overflow at 375px and 1440px),
 * plus the dev-bundle Firebase key check (manual-verification bug 1).
 */
test.describe('Admin login panel — /login', () => {
  test('[SC-001] renders the login card with logo, title, fields, button and recovery link', async ({
    page,
  }) => {
    await page.goto('/login');

    const card = page.locator('[data-login-card]');
    await expect(card).toBeVisible();

    await expect(page.locator('h1', { hasText: 'Iniciar sesión' })).toBeVisible();
    await expect(page.locator('img[alt="Riff"]')).toBeVisible();
    await expect(page.locator('input[autocomplete="email"]')).toBeVisible();
    await expect(
      page.locator('input[autocomplete="current-password"]'),
    ).toBeVisible();
    await expect(
      page.locator('button[type="submit"]', { hasText: 'INICIAR SESIÓN' }),
    ).toBeVisible();
    await expect(
      page.locator('a', { hasText: '¿Olvidaste tu contraseña?' }),
    ).toBeVisible();
  });

  test('[SC-006] root path redirects to the login via the protected profile route', async ({
    page,
  }) => {
    // Change `admin-panel-foundation`: the root redirects to `/profile`
    // (post-login target) and the AuthGuard forwards unauthenticated visitors
    // to `/login`, preserving the destination as `returnUrl`.
    await page.goto('/');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fprofile$/);
    await expect(page.locator('[data-login-card]')).toBeVisible();
  });

  test('[SC-009] no horizontal overflow at mobile (375px) and desktop (1440px)', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 375, height: 812 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/login');
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(
        hasHorizontalOverflow,
        `horizontal overflow at ${viewport.width}px`,
      ).toBe(false);
      await expect(page.locator('[data-login-card]')).toBeVisible();
    }
  });

  test('[bug-1] the dev bundle signs in with the API key declared in the env file', async ({
    page,
  }) => {
    // Regression coverage (manual-verification bug 1): Angular ignores chained
    // fileReplacements, which left the dev bundle on the placeholder key while
    // `environment.development.local.ts` held the dev's real credentials. Unit
    // tests mock Firebase, so this asserts the REAL bundle: the `key=` query
    // param of the identitytoolkit sign-in request must equal the apiKey
    // declared in the generated env file (whatever its value is — placeholder
    // in CI, real credentials locally).
    const envPath = resolve(process.cwd(), 'src/environments/environment.development.local.ts');
    let source: string;
    try {
      source = readFileSync(envPath, 'utf-8');
    } catch {
      throw new Error(
        'environment.development.local.ts not found — run `npm run env:write:dev --workspace=apps/admin`.',
      );
    }
    const apiKey = source.match(/apiKey: '([^']*)'/)?.[1];
    expect(apiKey, 'generated dev env must declare an apiKey').toBeTruthy();

    let authRequestUrl: string | null = null;
    await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
      authRequestUrl = route.request().url();
      // Fulfill locally: no real Firebase call leaves the test.
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'INVALID_LOGIN_CREDENTIALS' } }),
      });
    });

    await page.goto('/login');
    await page.fill('input[autocomplete="email"]', 'e2e@riff.cl');
    await page.fill('input[autocomplete="current-password"]', 'wrong-password-1');
    await page.click('button[type="submit"]');

    await expect.poll(() => authRequestUrl, { timeout: 10_000 }).not.toBeNull();
    await expect(page.locator('[data-login-error]')).toBeVisible();

    const key = new URL(authRequestUrl as string).searchParams.get('key');
    expect(key, 'bundle apiKey must match environment.development.local.ts').toBe(apiKey);
    expect(key).not.toBe('');
  });

  test('[session-restore] after a page reload the user stays authenticated on /profile', async ({
    page,
  }) => {
    // Regression coverage (manual-verification bug: F5 after login kicked the
    // user back to /login). The Firebase SDK restores the session
    // asynchronously from indexedDB; the guard must wait for that
    // initialization before deciding.
    //
    // No real Firebase credentials are available in smoke: the sign-in POST is
    // fulfilled with a well-formed (unsigned) idToken response, which the SDK
    // accepts and PERSISTS in indexedDB — exercising the real
    // persist → reload → restore path end to end.
    const idToken = fakeIdToken();
    const firebaseUser = {
      localId: 'uid-e2e',
      email: 'e2e@riff.cl',
      displayName: 'Ada E2E',
      emailVerified: true,
    };
    // The SDK issues TWO requests per sign-in: the password sign-in and an
    // accounts:lookup to enrich the user; both must be answered in shape.
    await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
      const url = route.request().url();
      if (url.includes('accounts:lookup')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            kind: 'identitytoolkit#GetAccountInfoResponse',
            users: [firebaseUser],
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kind: 'identitytoolkit#VerifyPasswordResponse',
          localId: 'uid-e2e',
          email: 'e2e@riff.cl',
          displayName: 'Ada E2E',
          idToken,
          registered: true,
          refreshToken: 'refresh-token-e2e',
          expiresIn: '3600',
        }),
      });
    });
    // Safety net: if the SDK refreshes the stored token, keep it valid.
    await page.route('**/securetoken.googleapis.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: fakeIdToken(),
          id_token: fakeIdToken(),
          expires_in: '3600',
          token_type: 'Bearer',
          refresh_token: 'refresh-token-e2e',
        }),
      });
    });
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'uid-e2e',
            nombre: 'Ada E2E',
            email: 'e2e@riff.cl',
            rol: 'admin',
            activo: true,
          },
          error: null,
          meta: null,
        }),
      });
    });

    await page.goto('/login');
    await page.fill('input[autocomplete="email"]', 'e2e@riff.cl');
    await page.fill('input[autocomplete="current-password"]', 'whatever-1');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.locator('app-header')).toContainText('Ada E2E');

    // THE BUG: reload while authenticated.
    await page.reload();
    await expect(page, 'session must survive a page reload').toHaveURL(/\/profile$/, {
      timeout: 10_000,
    });
    await expect(page.locator('app-header')).toContainText('Ada E2E');
  });
});

/**
 * Builds an unsigned JWT the Firebase JS SDK accepts as an idToken for auth
 * state purposes (it decodes claims client-side; no signature verification
 * happens in the browser SDK).
 */
function fakeIdToken(): string {
  const encode = (value: object): string =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'RS256', typ: 'JWT' });
  const payload = encode({
    iss: 'https://securetoken.google.com/dev-placeholder',
    aud: 'dev-placeholder',
    sub: 'uid-e2e',
    user_id: 'uid-e2e',
    email: 'e2e@riff.cl',
    iat: now,
    exp: now + 3600,
    firebase: { sign_in_provider: 'password', identities: {} },
  });
  return `${header}.${payload}.fake-signature`;
}