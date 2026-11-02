import { test, expect, type Locator, type Page } from 'playwright/test';

/**
 * Responsive layout contract (capability `responsive-layout`).
 *
 * Single source of truth for the "no horizontal overflow" invariant and the
 * viewport-height budget of the sticky shell. Every view-dependent component
 * (header, search bar, hero headlines, panel stats, product detail title and
 * the catalog list view) is asserted here against the same viewport matrix, so
 * a regression in one component cannot hide behind another spec's assertions.
 */

/** Sub-pixel rounding tolerance (1px) shared by every containment assertion. */
const OVERFLOW_TOLERANCE = 1;

/** Known fixture product (apps/web/e2e/fixtures/api-data.json). */
const FIXTURE_SLUG = 'mwn-medidor-industrial-agua-fria';

/**
 * The supported viewport matrix. `568×320` is the landscape phone case that
 * used to make the sticky group occupy ~96% of the screen height.
 */
const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 568, height: 320 },
  { width: 640, height: 360 },
  { width: 640, height: 800 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1204, height: 800 },
  { width: 1280, height: 800 },
] as const;

/** Representative pages covering every component touched by the change. */
const PAGES = [
  '/',
  '/productos',
  '/productos?view=list',
  `/productos/${FIXTURE_SLUG}`,
  '/representaciones',
] as const;

/**
 * Asserts that the document does not overflow horizontally.
 *
 * Both `documentElement.scrollWidth` and `body.scrollWidth` are inspected and
 * the larger one is used: the home page applies `overflow-x: clip` on the
 * document (hero shell), which clips the visual overflow but keeps reporting
 * the overflowing content width on `body.scrollWidth`.
 */
async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  const scrollWidth = Math.max(metrics.documentScrollWidth, metrics.bodyScrollWidth);
  expect(
    scrollWidth,
    `horizontal overflow detected at ${page.url()}: scrollWidth=${scrollWidth} clientWidth=${metrics.clientWidth}`,
  ).toBeLessThanOrEqual(metrics.clientWidth + OVERFLOW_TOLERANCE);
}

/** Asserts that the first element matching `selector` fits inside the viewport width. */
async function expectWithinViewport(page: Page, selector: string | Locator): Promise<void> {
  const locator = typeof selector === 'string' ? page.locator(selector).first() : selector;
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  expect(box, `no bounding box for ${selector}`).not.toBeNull();
  expect(viewport, 'no viewport size').not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(-OVERFLOW_TOLERANCE);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + OVERFLOW_TOLERANCE);
}

/**
 * Asserts that the text rendered inside `selector` does not overflow its own
 * content box (a block element whose text is wider than the box reports a
 * `scrollWidth` greater than its `clientWidth`).
 */
async function expectNoTextOverflow(page: Page, selector: string | Locator): Promise<void> {
  const locator = typeof selector === 'string' ? page.locator(selector).first() : selector;
  await expect(locator).toBeVisible();
  const sizes = await locator.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  expect(
    sizes.scrollWidth,
    `text overflow detected in ${selector}: scrollWidth=${sizes.scrollWidth} clientWidth=${sizes.clientWidth}`,
  ).toBeLessThanOrEqual(sizes.clientWidth + OVERFLOW_TOLERANCE);
}

test.describe('Responsive layout (viewport matrix)', () => {
  test('no representative page produces horizontal overflow across the viewport matrix', async ({
    page,
  }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      for (const path of PAGES) {
        await page.goto(path);
        await expectNoHorizontalOverflow(page);
      }
    }
  });

  test('the header fits the viewport below 1280px and the desktop nav appears from 1280px', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 1024, height: 768 },
      { width: 1204, height: 800 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');

      const banner = page.getByRole('banner');
      // Below xl the desktop navigation is collapsed into the mobile overlay.
      await expect(
        banner.getByRole('navigation', { name: 'Navegación principal' }),
      ).toBeHidden();
      await expect(banner.getByRole('button', { name: 'Abrir menú' })).toBeVisible();
      await expectWithinViewport(page, 'header.site-header');
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await expect(nav).toBeVisible();
    await expect(
      nav.getByRole('link', { name: 'SOLICITAR COTIZACIÓN', exact: true }),
    ).toBeVisible();
    await expectWithinViewport(page, 'nav[aria-label="Navegación principal"]');
  });

  test('the mobile header and search adopt the distributed-padding two-row layout', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const banner = page.getByRole('banner');
    await expect(banner).toHaveCSS('padding-top', '8px');
    await expect(banner).toHaveCSS('padding-bottom', '8px');
    const bannerBox = await banner.boundingBox();
    expect(bannerBox).not.toBeNull();
    expect(bannerBox!.height).toBeLessThanOrEqual(80 + OVERFLOW_TOLERANCE);

    const search = page.getByRole('search', { name: 'Buscar productos' });
    const selectBox = await search.getByRole('combobox').boundingBox();
    const inputBox = await search.getByRole('searchbox').boundingBox();
    const buttonBox = await search.getByRole('button', { name: 'BUSCAR' }).boundingBox();
    expect(selectBox).not.toBeNull();
    expect(inputBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();

    // Select on its own row; input + button together with no horizontal gap.
    expect(selectBox!.y).toBeLessThan(inputBox!.y);
    expect(Math.abs(inputBox!.y - buttonBox!.y)).toBeLessThanOrEqual(4);
    expect(Math.abs(inputBox!.x + inputBox!.width - buttonBox!.x)).toBeLessThanOrEqual(2);
  });

  test('the sticky group respects the viewport-height budget on short viewports', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 568, height: 320 });
    await page.goto('/');

    const shell = page.locator('.header-scroll-shell');
    const shellBox = await shell.boundingBox();
    expect(shellBox).not.toBeNull();
    // The sticky group may occupy at most half of the viewport height.
    expect(shellBox!.height).toBeLessThanOrEqual(320 * 0.5);

    const searchBox = await page
      .getByRole('search', { name: 'Buscar productos' })
      .boundingBox();
    expect(searchBox).not.toBeNull();
    // The search bar may occupy at most a quarter of the viewport height.
    expect(searchBox!.height).toBeLessThanOrEqual(320 * 0.25);
  });

  test('the large phone landscape keeps the tablet header inside the sticky budget', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 375 });
    await page.goto('/');

    // Below sm the compact h-12 header applies; at 640px the tablet header
    // (112px) must survive and still leave the sticky group under 50%.
    const banner = page.getByRole('banner');
    const headerBox = await banner.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(headerBox!.height).toBeGreaterThanOrEqual(110);

    const shell = page.locator('.header-scroll-shell');
    const shellBox = await shell.boundingBox();
    expect(shellBox).not.toBeNull();
    expect(shellBox!.height).toBeLessThanOrEqual(375 * 0.5);

    await expectNoHorizontalOverflow(page);
  });

  test('the home hero headline and the panel stat cells stay inside the viewport', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');

      await expectWithinViewport(page, 'section.relative:not(.z-10) h1');
      await expectNoTextOverflow(page, 'section.relative:not(.z-10) h1');

      // The four stat cells and their values stay inside the panel. The second
      // stat carries the longest value ("30.000+"), so it is the worst case.
      const statValue = page.locator('[data-stat-value]').nth(1);
      await expect(statValue).toBeVisible();
      await expectNoTextOverflow(page, statValue);
      await expectWithinViewport(page, statValue);
    }
  });

  test('the team grid shows 3 columns at 640x800 without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 800 });
    await page.goto('/');

    const grid = page
      .locator('section:has-text("Liderazgo & Experiencia") div[class*="sm:grid-cols-3"]')
      .first();
    await expect(grid).toBeVisible();

    const cards = grid.locator('article');
    await expect(cards).toHaveCount(3);
    const boxes = await cards.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width };
      }),
    );
    // 3 columns in a single row at the sm breakpoint.
    for (let i = 1; i < boxes.length; i++) {
      expect(Math.abs(boxes[i]!.y - boxes[0]!.y)).toBeLessThan(2);
      expect(boxes[i]!.x).toBeGreaterThan(boxes[i - 1]!.x);
    }
    for (const box of boxes) {
      expect(box.x).toBeGreaterThanOrEqual(-OVERFLOW_TOLERANCE);
      expect(box.x + box.width).toBeLessThanOrEqual(640 + OVERFLOW_TOLERANCE);
    }
    await expectNoHorizontalOverflow(page);
  });

  test('the Representations headlines stay inside the viewport', async ({ page }) => {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/representaciones');

      await expectWithinViewport(page, 'section.bg-secondary h1');
      await expectNoTextOverflow(page, 'section.bg-secondary h1');
      await expectWithinViewport(
        page,
        'h2:has-text("Marcas de Representación Exclusiva")',
      );
    }
  });

  test('the product detail title stays inside its column on narrow viewports', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(`/productos/${FIXTURE_SLUG}`);

      await expectWithinViewport(page, 'main h1');
      await expectNoTextOverflow(page, 'main h1');
    }
  });

  test('the catalog list view keeps the card and its CTAs inside the results container', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/productos?view=list');

      const grid = page.locator('#catalog-grid');
      await expect(grid).toBeVisible();
      const gridBox = await grid.boundingBox();
      expect(gridBox).not.toBeNull();

      const card = page.locator('.catalog-card').first();
      await expect(card).toBeVisible();
      const cardBox = await card.boundingBox();
      expect(cardBox).not.toBeNull();
      expect(cardBox!.width).toBeLessThanOrEqual(gridBox!.width + OVERFLOW_TOLERANCE);

      const ctas = card.locator('a:has-text("Cotizar"), a:has-text("Ver detalles")');
      const ctaCount = await ctas.count();
      expect(ctaCount).toBeGreaterThan(0);
      for (let index = 0; index < ctaCount; index++) {
        const ctaBox = await ctas.nth(index).boundingBox();
        expect(ctaBox).not.toBeNull();
        expect(ctaBox!.width).toBeLessThanOrEqual(cardBox!.width + OVERFLOW_TOLERANCE);
        expect(ctaBox!.x + ctaBox!.width).toBeLessThanOrEqual(
          gridBox!.x + gridBox!.width + OVERFLOW_TOLERANCE,
        );
      }
    }
  });

  test('the list view CTAs keep a bounded width on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/productos?view=list');

    const card = page.locator('.catalog-card').first();
    await expect(card).toBeVisible();
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();

    const ctas = card.locator('a:has-text("Cotizar"), a:has-text("Ver detalles")');
    const ctaCount = await ctas.count();
    expect(ctaCount).toBeGreaterThan(0);
    for (let index = 0; index < ctaCount; index++) {
      const ctaBox = await ctas.nth(index).boundingBox();
      expect(ctaBox).not.toBeNull();
      // At most half of the card width and never wider than a sane maximum.
      expect(ctaBox!.width).toBeLessThanOrEqual(cardBox!.width / 2 + OVERFLOW_TOLERANCE);
      expect(ctaBox!.width).toBeLessThanOrEqual(200 + OVERFLOW_TOLERANCE);
    }
  });
});
