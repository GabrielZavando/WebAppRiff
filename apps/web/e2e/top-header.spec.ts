import { test, expect } from 'playwright/test';

test.describe('TopHeader (utility bar)', () => {
  test('is visible on desktop with phone and social links', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const bar = page.getByRole('region', { name: 'Barra de contacto' });
    await expect(bar).toBeVisible();
    await expect(bar.getByText('+56 2 29079067')).toBeVisible();

    const socialNav = bar.getByRole('navigation', { name: 'Redes sociales' });
    await expect(socialNav).toBeVisible();
    await expect(socialNav.getByRole('link', { name: 'Facebook' })).toBeVisible();
    await expect(socialNav.getByRole('link', { name: 'X' })).toBeVisible();
  });

  test('is hidden on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const bar = page.getByRole('region', { name: 'Barra de contacto' });
    await expect(bar).toBeHidden();
  });
});
