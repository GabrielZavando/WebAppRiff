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
    // Official URLs come from the shared config constants (SC-005): Facebook,
    // Instagram and LinkedIn present, X absent.
    await expect(
      socialNav.getByRole('link', { name: 'Facebook' }),
    ).toHaveAttribute('href', 'https://www.facebook.com/somosriff');
    await expect(
      socialNav.getByRole('link', { name: 'Instagram' }),
    ).toHaveAttribute('href', 'https://www.instagram.com/somosriff.cl/');
    await expect(
      socialNav.getByRole('link', { name: 'LinkedIn' }),
    ).toHaveAttribute('href', 'https://www.linkedin.com/company/somosriff/');
    await expect(socialNav.getByRole('link', { name: 'X' })).toHaveCount(0);
  });

  test('is hidden on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const bar = page.getByRole('region', { name: 'Barra de contacto' });
    await expect(bar).toBeHidden();
  });
});
