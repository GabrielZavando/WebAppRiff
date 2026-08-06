import { test, expect } from 'playwright/test';

const HERO_SECTION_SELECTOR = 'section.bg-secondary';

test.describe('HeroBanner (home hero section)', () => {
  test.beforeEach(async ({ page }) => {
    // Default to a desktop viewport unless the test overrides it.
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
  });

  test('renders the hero <h1> with "Innovación que" + "Fluye" in teal on desktop (5.1, 5.2)', async ({
    page,
  }) => {
    const hero = page.locator(HERO_SECTION_SELECTOR);
    await expect(hero).toBeVisible();

    const h1 = hero.locator('h1');
    await expect(h1).toBeVisible();
    // The visible text is the headline + highlighted word exactly as configured.
    await expect(h1).toContainText('Innovación que');
    await expect(h1).toContainText('Fluye');

    // The <span class="text-primary"> element carries the highlighted word
    // with the computed primary teal color (#41B3C4 = rgb(65, 179, 196)).
    const tealSpan = h1.locator('span.text-primary');
    await expect(tealSpan).toHaveText('Fluye');
    const color = await tealSpan.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(color).toBe('rgb(65, 179, 196)');
  });

  test('renders the subtitle as a visible <h2> (5.2)', async ({ page }) => {
    const h2 = page.locator(`${HERO_SECTION_SELECTOR} h2`);
    await expect(h2).toBeVisible();
    await expect(h2).toContainText('Experiencia, tecnología y control');
  });

  test('renders the description as a visible <p> (5.3)', async ({ page }) => {
    const p = page.locator(`${HERO_SECTION_SELECTOR} p`).first();
    await expect(p).toBeVisible();
    await expect(p).toContainText('Desarrollamos soluciones');
  });

  test('renders exactly two CTAs labelled VER SERVICIOS and ESCRÍBENOS (5.4)', async ({
    page,
  }) => {
    const hero = page.locator(HERO_SECTION_SELECTOR);
    const ctas = hero.locator('a');
    await expect(ctas).toHaveCount(2);
    await expect(ctas.nth(0)).toHaveText('VER SERVICIOS');
    await expect(ctas.nth(1)).toHaveText('ESCRÍBENOS');
  });

  test('VER SERVICIOS links to /servicios with teal background (5.5)', async ({
    page,
  }) => {
    const cta = page.getByRole('link', { name: 'VER SERVICIOS' });
    await expect(cta).toHaveAttribute('href', '/servicios');
    const bg = await cta.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(65, 179, 196)');
  });

  test('ESCRÍBENOS links to /contacto with white border and no teal bg (5.6)', async ({
    page,
  }) => {
    const cta = page.getByRole('link', { name: 'ESCRÍBENOS' });
    await expect(cta).toHaveAttribute('href', '/contacto');
    const styles = await cta.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        borderColor: cs.borderTopColor,
        borderWidth: cs.borderTopWidth,
      };
    });
    // The `border-2 border-white` produces a 2px white border on all sides.
    expect(styles.borderColor).toBe('rgb(255, 255, 255)');
    expect(parseFloat(styles.borderWidth)).toBeGreaterThanOrEqual(2);
    // No teal fill on the secondary CTA.
    expect(styles.bg).not.toBe('rgb(65, 179, 196)');
  });

  test('stacks CTAs vertically and full-width on mobile (< 768px) (5.7)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const ctaContainer = page.locator(`${HERO_SECTION_SELECTOR} div.flex-col`);
    await expect(ctaContainer).toBeVisible();

    const firstCta = page.getByRole('link', { name: 'VER SERVICIOS' });
    const secondCta = page.getByRole('link', { name: 'ESCRÍBENOS' });
    const firstBox = await firstCta.boundingBox();
    const secondBox = await secondCta.boundingBox();
    expect(firstBox).toBeTruthy();
    expect(secondBox).toBeTruthy();
    // Strictly stacked: first sits above second.
    expect(firstBox!.y).toBeLessThan(secondBox!.y);
    // On mobile both occupy (approximately) the container width: the
    // difference in width is within 8px tolerance.
    expect(Math.abs(firstBox!.width - secondBox!.width)).toBeLessThanOrEqual(8);
  });

  test('lays out CTAs horizontally side-by-side on desktop (>= 768px) (5.8)', async ({
    page,
  }) => {
    const firstCta = page.getByRole('link', { name: 'VER SERVICIOS' });
    const secondCta = page.getByRole('link', { name: 'ESCRÍBENOS' });
    const firstBox = await firstCta.boundingBox();
    const secondBox = await secondCta.boundingBox();
    expect(firstBox).toBeTruthy();
    expect(secondBox).toBeTruthy();
    // `sm:flex-row` puts them on the same row: tops within 4px tolerance.
    expect(Math.abs(firstBox!.y - secondBox!.y)).toBeLessThanOrEqual(4);
    // Primary on the left of secondary.
    expect(firstBox!.x).toBeLessThan(secondBox!.x);
  });

  test('h1 font-size scales responsively between mobile and desktop (5.9)', async ({
    page,
  }) => {
    // Mobile: text-4xl -> ~36px
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const h1 = page.locator(`${HERO_SECTION_SELECTOR} h1`);
    let fontSize = await h1.evaluate((el) => parseFloat(window.getComputedStyle(el).fontSize));
    // Tailwind text-4xl is exactly 2.25rem = 36px (root 16px).
    expect(fontSize).toBeGreaterThanOrEqual(34);
    expect(fontSize).toBeLessThanOrEqual(38);

    // Desktop: md:text-6xl -> ~60px
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload();
    const h1Desktop = page.locator(`${HERO_SECTION_SELECTOR} h1`);
    fontSize = await h1Desktop.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).fontSize),
    );
    // Tailwind text-6xl is exactly 3.75rem = 60px.
    expect(fontSize).toBeGreaterThanOrEqual(58);
    expect(fontSize).toBeLessThanOrEqual(62);
  });

  test('keyboard Tab cycles through CTAs in DOM order (5.10)', async ({ page }) => {
    const firstCta = page.getByRole('link', { name: 'VER SERVICIOS' });
    const secondCta = page.getByRole('link', { name: 'ESCRÍBENOS' });

    // Move keyboard focus to the first CTA by repeated Tab from <body>.
    await page.keyboard.press('Tab'); // focus enters <body> · tabbable 1
    // The first focusable on the home is in the TopHeader / Header / SearchForm,
    // so we Tab until the first CTA is focused.
    for (let i = 0; i < 30 && !(await firstCta.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(firstCta).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(secondCta).toBeFocused();
  });

  test('document contains exactly one <h1> (regression SEO on-page) (5.12)', async ({
    page,
  }) => {
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  test('document contains exactly one <h2> inside the hero (5.13)', async ({ page }) => {
    const h2Count = await page.locator(`${HERO_SECTION_SELECTOR} h2`).count();
    expect(h2Count).toBe(1);
  });

  test('document does NOT contain "Proyecto en desarrollo" (placeholder removed) (5.14)', async ({
    page,
  }) => {
    const body = await page.locator('body').textContent();
    expect(body).not.toContain('Proyecto en desarrollo');
  });

  test('renders the real industrial image as a <picture> with AVIF/WebP sources (real-site-images)', async ({
    page,
  }) => {
    const picture = page.locator(`${HERO_SECTION_SELECTOR} picture`);
    await expect(picture).toBeVisible();

    const sourceTypes = await picture.locator('source').evaluateAll((sources) =>
      sources.map((s) => s.getAttribute('type')).filter(Boolean),
    );
    expect(sourceTypes).toContain('image/avif');
    expect(sourceTypes).toContain('image/webp');

    const img = picture.locator('img');
    await expect(img).toHaveAttribute('loading', 'eager');
    await expect(img).toHaveAttribute('alt', /Instalación industrial Riff/);
  });

  test('preserves the DOM order TopHeader -> header -> SearchForm -> hero section (5.15)', async ({
    page,
  }) => {
    // Reuse the same DOM order assertion strategy as the search-form E2E: read
    // the positions of distinct markers and assert strict ordering.
    const phone = await page.locator('a[href^="tel:"]').first();
    const header = page.locator('header').first();
    const search = page.getByRole('search', { name: 'Buscar productos' });
    const hero = page.locator(HERO_SECTION_SELECTOR).first();

    const phoneBox = await phone.boundingBox();
    const headerBox = await header.boundingBox();
    const searchBox = await search.boundingBox();
    const heroBox = await hero.boundingBox();

    expect(phoneBox).toBeTruthy();
    expect(headerBox).toBeTruthy();
    expect(searchBox).toBeTruthy();
    expect(heroBox).toBeTruthy();

    // Each successive landmark starts strictly below the previous one.
    expect(phoneBox!.y).toBeLessThan(headerBox!.y);
    expect(headerBox!.y).toBeLessThan(searchBox!.y);
    expect(searchBox!.y).toBeLessThan(heroBox!.y);
  });
});
