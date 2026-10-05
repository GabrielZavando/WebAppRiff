import { expect, test } from '@playwright/test';

/**
 * Smoke E2E for the admin login panel (change `admin-login-panel`,
 * ticket LOGIN-1). Covers SC-001 (render), SC-006 (root redirect) and
 * SC-009 (responsive without horizontal overflow at 375px and 1440px).
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

  test('[SC-006] root path redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
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
});