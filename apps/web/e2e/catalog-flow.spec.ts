import { test, expect } from 'playwright/test';

// Known fixture product (apps/web/e2e/fixtures/api-data.json). The pages are SSG:
// this slug gets baked at build time from the stub API, so the e2e asserts the
// real navigation chain catalog → detail → quote CTA against a deterministic
// product.
const FIXTURE_SLUG = 'mwn-medidor-industrial-agua-fria';
const FIXTURE_TITLE = 'MWN - Medidor Industrial para Agua Fría';

test.describe('Catalog critical flow (listado → ficha → cotización)', () => {
  test('catalog page renders product cards from the API with links to detail', async ({
    page,
  }) => {
    await page.goto('/productos');

    const cards = page.locator('.catalog-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // The known fixture product is present and links to its detail page.
    const card = page.locator(`article[data-product-id="${FIXTURE_SLUG}"]`);
    await expect(card).toBeVisible();

    const detailHref = card.locator(`a[href="/productos/${FIXTURE_SLUG}"]`);
    await expect(detailHref.first()).toBeVisible();
  });

  test('clicking a product card reaches the detail page with the product title', async ({
    page,
  }) => {
    await page.goto('/productos');

    const card = page.locator(`article[data-product-id="${FIXTURE_SLUG}"]`);
    await card.locator(`a[href="/productos/${FIXTURE_SLUG}"]`).first().click();

    await expect(page).toHaveURL(new RegExp(`/productos/${FIXTURE_SLUG}$`));

    // Detail page renders the product title as the page h1.
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(FIXTURE_TITLE);
  });

  test('detail page renders the SOLICITAR COTIZACIÓN CTA pointing to the quote form', async ({
    page,
  }) => {
    await page.goto(`/productos/${FIXTURE_SLUG}`);

    // The site header also renders a "SOLICITAR COTIZACIÓN" nav CTA — scope to <main>.
    const cta = page
      .getByRole('main')
      .getByRole('link', { name: /SOLICITAR COTIZACIÓN/ });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute(
      'href',
      `/cotizacion?producto=${FIXTURE_SLUG}`,
    );
  });

  test('the detail page title stays inside the viewport on narrow viewports (responsive-web-design-fixes)', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(`/productos/${FIXTURE_SLUG}`);

      const h1 = page.locator('main h1');
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(FIXTURE_TITLE);

      // The title text never overflows its own box.
      const sizes = await h1.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));
      expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);

      // The title box stays inside the viewport.
      const box = await h1.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.x).toBeGreaterThanOrEqual(-1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    }
  });

  test('clicking the CTA lands on the cotización page with the form', async ({
    page,
  }) => {
    await page.goto(`/productos/${FIXTURE_SLUG}`);

    await page
      .getByRole('main')
      .getByRole('link', { name: /SOLICITAR COTIZACIÓN/ })
      .click();

    // The click dispatches the navigation asynchronously; wait for it to
    // commit before reading the URL (a plain page.url() read races).
    await page.waitForURL('**/cotizacion**');

    const url = new URL(page.url());
    expect(url.pathname).toBe('/cotizacion');
    expect(url.searchParams.get('producto')).toBe(FIXTURE_SLUG);
    // The quote form is rendered (SC cotizacion fields present). The hardened
    // form resolves its action into an absolute API URL, so identify it by id.
    await expect(page.locator('#cotizacion-form')).toBeVisible();
    await expect(page.locator('#cotizacion-nombre')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'ENVIAR SOLICITUD' }),
    ).toBeVisible();
  });
});
