import { test, expect } from 'playwright/test';

/**
 * Compact scroll state for the Header + SearchForm group.
 * Covers: sticky grouping, logo shrink, navy (#1F2D40) background and a
 * drop-shadow on scroll, and full revert at the top. Runs against the production build
 * (`astro preview`) via the Playwright webServer config.
 */

const SECONDARY_RGB = 'rgb(31, 45, 64)';

function getLogo(page: import('playwright/test').Page) {
  return page.getByRole('banner').getByRole('link', { name: 'Ir al inicio' }).locator('img');
}

function getSearchWrapper(page: import('playwright/test').Page) {
  return page.getByRole('search');
}

function getStickyShell(page: import('playwright/test').Page) {
  return page.locator('div.header-scroll-shell');
}

/** Reads a CSS property of a pseudo-element (e.g. `::after`) via getComputedStyle. */
async function getPseudoStyle(
  page: import('playwright/test').Page,
  selector: string,
  property: string,
  pseudo = '::after',
): Promise<string | null> {
  return page.evaluate(
    ({ sel, pseudo: p, property: prop }) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return null;
      return getComputedStyle(el, p).getPropertyValue(prop).trim();
    },
    { sel: selector, pseudo, property },
  );
}

async function scrollTo(page: import('playwright/test').Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' as ScrollBehavior }), y);
  // Allow the rAF state toggle + 300ms CSS transition to settle.
  await page.waitForTimeout(400);
}

test.describe('Site header compact scroll state', () => {
  test('at the top: logo is full size and no compact state is active (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const logo = getLogo(page);
    await expect(logo).toHaveCSS('max-width', '300px');
    await expect(page.locator('body')).not.toHaveAttribute('data-scrolled', 'true');
  });

  test('on scroll: sticky shell, logo shrinks to 200px and background becomes navy', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    await scrollTo(page, 400);

    // Compact state flag
    await expect(page.locator('body')).toHaveAttribute('data-scrolled', 'true');

    // Sticky shell stays pinned to the top of the viewport
    const shell = getStickyShell(page);
    await expect(shell).toHaveCSS('position', 'sticky');
    const box = await shell.boundingBox();
    expect(box?.y).toBeLessThan(2);

    // Logo shrinks from 300px to 200px on desktop
    await expect(getLogo(page)).toHaveCSS('max-width', '200px');

    // Search wrapper background transitions to solid secondary (#1F2D40)
    await expect(getSearchWrapper(page)).toHaveCSS('background-color', SECONDARY_RGB);

    // Sticky shell gains a drop-shadow for elevation when scrolled
    await expect(shell).not.toHaveCSS('box-shadow', 'none');

    // Header reaches solid navy via its opaque overlay (::after)
    await expect(await getPseudoStyle(page, 'header.site-header', 'opacity')).toBe('1');

    // Smooth 300ms transitions on the animated properties
    await expect(await getPseudoStyle(page, 'header.site-header', 'transition-duration')).toBe('0.3s');
    await expect(getSearchWrapper(page)).toHaveCSS('transition-duration', '0.3s');
    await expect(getLogo(page)).toHaveCSS('transition-duration', '0.3s');

    // TopHeader is outside the sticky shell and scrolls out of view
    const topHeader = page.getByRole('region', { name: 'Barra de contacto' });
    const thBox = await topHeader.boundingBox();
    expect(thBox?.y ?? 0).toBeLessThan(0);
  });

  test('back at the top: everything reverts to the original state', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await scrollTo(page, 400);
    await expect(page.locator('body')).toHaveAttribute('data-scrolled', 'true');

    await scrollTo(page, 0);

    const shell = getStickyShell(page);
    await expect(page.locator('body')).toHaveAttribute('data-scrolled', 'false');
    await expect(getLogo(page)).toHaveCSS('max-width', '300px');
    // On the hero, the search wrapper reverts to transparent (not navy).
    await expect(getSearchWrapper(page)).not.toHaveCSS('background-color', SECONDARY_RGB);
    // Drop-shadow removed at the top
    await expect(shell).toHaveCSS('box-shadow', 'none');
    // Header overlay returns to transparent at the top
    await expect(await getPseudoStyle(page, 'header.site-header', 'opacity')).toBe('0');
  });

  test('on mobile: logo shrinks to 150px and the mobile menu opens above the compact header', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await scrollTo(page, 400);

    // Logo shrinks from 200px to 150px on mobile
    await expect(getLogo(page)).toHaveCSS('max-width', '150px');

    // Mobile menu still functional and above the compact header
    const toggle = page.getByRole('banner').getByRole('button', { name: 'Abrir menú' });
    await expect(toggle).toBeVisible();
    // Toggle stays above the overlay (z-50) before opening the menu.
    await expect(toggle).toHaveCSS('z-index', '50');
    await toggle.click();

    const mobileNav = page.locator('#mobile-nav');
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav).toHaveCSS('position', 'fixed');
    await expect(mobileNav).toHaveCSS('z-index', '40');
  });

  test('respects reduced motion: transitions are disabled', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await scrollTo(page, 400);

    // The compact state still applies, but without any transition animation.
    await expect(page.locator('body')).toHaveAttribute('data-scrolled', 'true');
    await expect(await getPseudoStyle(page, 'header.site-header', 'transition-duration')).toBe('0s');
    await expect(getSearchWrapper(page)).toHaveCSS('transition-duration', '0s');
    await expect(getLogo(page)).toHaveCSS('transition-duration', '0s');
    await expect(page.locator('div.header-scroll-shell')).toHaveCSS('transition-duration', '0s');
  });
});
