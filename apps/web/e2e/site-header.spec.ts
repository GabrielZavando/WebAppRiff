import { test, expect } from 'playwright/test';

const NAV_ITEMS = ['Inicio', 'Productos', 'Servicios', 'Marcas', 'Contacto'];

test.describe('Site header (main navigation)', () => {
  test('renders logo, the five nav items and the CTA inside the nav on desktop', async ({ page }) => {
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

    // CTA is now the last item INSIDE the nav (not a standalone element outside)
    await expect(desktopNav.getByRole('link', { name: 'SOLICITAR COTIZACIÓN', exact: true })).toBeVisible();
  });

  test('renders the real logo image at 2x size (330x134) with accessible alt and overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const banner = page.getByRole('banner');
    // Scope to banner to avoid matching the Footer's logo link
    const logoLink = banner.getByRole('link', { name: 'Ir al inicio' });
    const logo = logoLink.locator('img');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('alt', 'Riff');
    // Logo at 2x size (double of 165x67)
    await expect(logo).toHaveAttribute('width', '330');
    await expect(logo).toHaveAttribute('height', '134');
    // The logo container uses overflow-visible with a constrained height
    // so the 2x logo may visually overflow without growing the header.
    await expect(logoLink).toHaveCSS('overflow', 'visible');
  });

  test('exposes a single header landmark on the page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // The Astro Dev Toolbar (injected into `astro preview`) can append its own
    // <header> elements; count only the page's visible content landmarks.
    await expect(page.locator('header:visible')).toHaveCount(1);
  });

  test('collapses the desktop navigation to a fixed hamburger on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const banner = page.getByRole('banner');
    await expect(banner.getByRole('navigation', { name: 'Navegación principal' })).toBeHidden();
    const toggle = banner.getByRole('button', { name: 'Abrir menú' });
    await expect(toggle).toBeVisible();
    // The toggle is fixed with z-50 so it stays above the fullscreen overlay
    await expect(toggle).toHaveCSS('position', 'fixed');
    await expect(toggle).toHaveCSS('z-index', '50');
    await expect(banner).toHaveAttribute('data-menu-open', 'false');
  });

  test('opens the mobile menu as a fullscreen white overlay with slide animation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const banner = page.getByRole('banner');
    const toggle = banner.getByRole('button', { name: 'Abrir menú' });
    const mobileNav = page.locator('#mobile-nav');

    // Initially closed: data-menu-open="false"
    await expect(banner).toHaveAttribute('data-menu-open', 'false');
    await expect(mobileNav).toHaveCSS('background-color', 'rgb(255, 255, 255)');

    await toggle.click();

    // After click: data-menu-open="true" (overlay slides in from right)
    await expect(banner).toHaveAttribute('data-menu-open', 'true');
    await expect(mobileNav).toBeVisible();

    // The toggle button shows "Cerrar menu" (X icon) and remains visible above overlay
    await expect(banner.getByRole('button', { name: 'Cerrar menú' })).toBeVisible();

    // All nav items + CTA are visible in the overlay
    for (const item of NAV_ITEMS) {
      await expect(mobileNav.getByRole('link', { name: item, exact: true })).toBeVisible();
    }
    await expect(mobileNav.getByRole('link', { name: 'SOLICITAR COTIZACIÓN', exact: true })).toBeVisible();
  });

  test('closes the mobile menu and restores body scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const banner = page.getByRole('banner');
    const toggle = banner.getByRole('button', { name: 'Abrir menú' });

    await toggle.click();
    await expect(banner).toHaveAttribute('data-menu-open', 'true');

    // Body scroll is locked when the fullscreen overlay is open
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('hidden');

    // Close via the X button
    await banner.getByRole('button', { name: 'Cerrar menú' }).click();
    await expect(banner).toHaveAttribute('data-menu-open', 'false');

    // Body scroll is restored when the menu is closed
    const bodyOverflowAfter = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflowAfter).toBe('');
  });

  test('serves the /cotizacion CTA destination page', async ({ page }) => {
    await page.goto('/cotizacion');

    await expect(page).toHaveURL(/\/cotizacion$/);
    await expect(page.getByRole('heading', { name: 'Solicitar cotización' })).toBeVisible();
  });
});
