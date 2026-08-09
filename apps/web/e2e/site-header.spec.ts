import { test, expect } from 'playwright/test';

const NAV_ITEMS = ['Inicio', 'Nosotros', 'Servicios', 'Representaciones', 'Contacto'];

test.describe('Site header (main navigation)', () => {
  test('renders logo, the five nav items and the CTA on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const banner = page.getByRole('banner');
    await expect(banner).toBeVisible();
    await expect(banner.getByRole('link', { name: 'Ir al inicio' })).toBeVisible();

    const desktopNav = banner.getByRole('navigation', { name: 'Navegación principal' });
    await expect(desktopNav).toBeVisible();
    for (const item of NAV_ITEMS) {
      await expect(desktopNav.getByRole('link', { name: item, exact: true })).toBeVisible();
    }

    await expect(banner.getByRole('link', { name: 'SOLICITAR COTIZACIÓN' })).toBeVisible();
  });

  test('renders the real logo image with accessible alt and dimensions (real-site-images)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const logoLink = page.getByRole('link', { name: 'Ir al inicio' });
    const logo = logoLink.locator('img');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('alt', 'Riff');
    await expect(logo).toHaveAttribute('width', '165');
    await expect(logo).toHaveAttribute('height', '67');
  });

  test('exposes a single header landmark on the page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // The Astro Dev Toolbar (injected into `astro preview`) can append its own
    // <header> elements; count only the page's visible content landmarks.
    await expect(page.locator('header:visible')).toHaveCount(1);
  });

  test('collapses the desktop navigation to a hamburger on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const banner = page.getByRole('banner');
    await expect(banner.getByRole('navigation', { name: 'Navegación principal' })).toBeHidden();
    await expect(banner.getByRole('button', { name: 'Abrir menú' })).toBeVisible();
  });

  test('opens and closes the mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const banner = page.getByRole('banner');
    const toggle = banner.getByRole('button', { name: 'Abrir menú' });
    const mobileNav = banner.getByRole('navigation', { name: 'Navegación móvil' });

    await expect(mobileNav).toBeHidden();
    await toggle.click();

    await expect(mobileNav).toBeVisible();
    for (const item of NAV_ITEMS) {
      await expect(mobileNav.getByRole('link', { name: item, exact: true })).toBeVisible();
    }

    await banner.getByRole('button', { name: 'Cerrar menú' }).click();
    await expect(mobileNav).toBeHidden();
  });

  test('serves the /cotizacion CTA destination page', async ({ page }) => {
    await page.goto('/cotizacion');

    await expect(page).toHaveURL(/\/cotizacion$/);
    await expect(page.getByRole('heading', { name: 'Solicitar cotización' })).toBeVisible();
  });
});
