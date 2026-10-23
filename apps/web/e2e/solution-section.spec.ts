import { test, expect } from 'playwright/test';

/**
 * E2E tests for the SolutionSection component on the home page.
 *
 * Selector strategy: the SolutionSection is the THIRD <section> on the page
 * (the first is the HeroBanner `section.relative`, the second is the PanelHome
 * `section.relative.z-10`). We target it by its unique class `bg-surface-muted`
 * combined with the h3 heading: POST-APPLY UPDATE (commit 4e6ecd5, global
 * background swap) the section background token changed from `bg-bg` to
 * `bg-surface-muted`; a second section on the page shares the token, so
 * `:has(h3)` keeps the selector unique.
 */

const SECTION_SELECTOR = 'section.bg-surface-muted:has(h3)';

/**
 * Number of featured cards the home renders in DestacadosSection: the
 * backend destacados (panel `destacado` flag) capped at 8. Computed from
 * the e2e stub API so the outline assertion stays correct as the fixture
 * changes (change `home-featured-products-grid`).
 */
const STUB_FEATURED_URL =
  'http://localhost:3001/api/v1/products?destacado=true&page=1&limit=100';
/**
 * Raw backend destacados count (before the 8-card slice) — used to prove the
 * `slice(0, 8)` contract: the fixture serves 9 destacados, the page renders 8.
 */
let FEATURED_BACKEND_COUNT = 0;
let FEATURED_COUNT = 0;
test.beforeAll(async () => {
  const res = await fetch(STUB_FEATURED_URL);
  const body = (await res.json()) as { data: Array<{ destacado?: boolean }> };
  FEATURED_BACKEND_COUNT = body.data.length;
  FEATURED_COUNT = Math.min(body.data.length, 8);
});

/**
 * Computes the WCAG contrast ratio between two CSS rgb() color strings.
 * Same helper as panel-home.spec.ts (kept local to avoid cross-file coupling).
 */
function contrastRatio(fg: string, bg: string): number {
  const parse = (s: string): [number, number, number] => {
    let m = s.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
    if (m) {
      return [Number(m[1]!) / 255, Number(m[2]!) / 255, Number(m[3]!) / 255];
    }
    m = s.match(/oklab\(([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*(?:\/\s*([-\d.]+))?/);
    if (m) {
      const L = Number(m[1]!);
      const val = Math.max(0, Math.min(1, L));
      return [val, val, val];
    }
    throw new Error(`unparseable colour: ${s}`);
  };
  const [r1, g1, b1] = parse(fg);
  const [r2, g2, b2] = parse(bg);
  const lum = (r: number, g: number, b: number): number => {
    const f = (c: number): number =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const l1 = lum(r1, g1, b1);
  const l2 = lum(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe('SolutionSection (home portfolio grid)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
  });

  test('renders the section with the <h3> "Nuestras Soluciones" on desktop (5.1)', async ({
    page,
  }) => {
    const section = page.locator(SECTION_SELECTOR);
    await expect(section).toBeVisible();
    const h3 = section.locator('h3');
    await expect(h3).toBeVisible();
    await expect(h3).toHaveText('Nuestras Soluciones');
  });

  test('grid shows 4 cards side-by-side in one row on desktop >= 1024px (5.2)', async ({
    page,
  }) => {
    const section = page.locator(SECTION_SELECTOR);
    const cards = section.locator('article');
    await expect(cards).toHaveCount(4);

    const boxes = await cards.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
    // All 4 in the same row (same y) with no vertical stacking.
    const firstY = boxes[0]!.y;
    for (const box of boxes) {
      expect(Math.abs(box.y - firstY)).toBeLessThan(2);
    }
    // And they sit side by side: each subsequent card starts after the previous.
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i]!.x).toBeGreaterThan(boxes[i - 1]!.x);
    }
  });

  test('grid shows 2 columns on tablet 640-1023px (5.3)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();

    const cards = page.locator(`${SECTION_SELECTOR} article`);
    await expect(cards).toHaveCount(4);
    const boxes = await cards.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y };
      }),
    );
    // Card 0 and card 2 are on different rows (y increases), card 0 and card 1
    // are on the same row: 2 columns × 2 rows.
    expect(boxes[0]!.y).toBeLessThan(boxes[2]!.y);
    expect(Math.abs(boxes[0]!.y - boxes[1]!.y)).toBeLessThan(2);
    expect(Math.abs(boxes[2]!.y - boxes[3]!.y)).toBeLessThan(2);
  });

  test('grid shows 1 column on mobile < 640px (5.4)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    const cards = page.locator(`${SECTION_SELECTOR} article`);
    await expect(cards).toHaveCount(4);
    const boxes = await cards.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y };
      }),
    );
    // All stacked vertically: y increases for each subsequent card.
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i]!.y).toBeGreaterThan(boxes[i - 1]!.y);
    }
  });

  test('each card has teal badge + svg icon, lazy image with alt, h4 title, description and SABER MÁS link (5.5)', async ({
    page,
  }) => {
    const section = page.locator(SECTION_SELECTOR);
    const cards = section.locator('article');
    await expect(cards).toHaveCount(4);

    const firstCard = cards.first();
    // Badge: teal square with an SVG icon.
    const badge = firstCard.locator('div.bg-primary');
    await expect(badge).toBeVisible();
    const badgeBg = await badge.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );
    // --color-primary = #41B3C4 = rgb(65, 179, 196)
    expect(badgeBg).toBe('rgb(65, 179, 196)');
    await expect(badge.locator('svg')).toBeVisible();

    // Image: lazy loading + non-empty alt.
    const img = firstCard.locator('img').first();
    await expect(img).toHaveAttribute('loading', 'lazy');
    const alt = await img.getAttribute('alt');
    expect(alt).toBeTruthy();
    expect(alt!.length).toBeGreaterThan(0);

    // Title h4 + description p.
    await expect(firstCard.locator('h4')).toBeVisible();
    await expect(firstCard.locator('p')).toHaveCount(1);

    // SABER MÁS CTA: design-system solid primary button (bg teal, white text).
    const link = firstCard.getByRole('link', { name: /SABER MÁS/ });
    await expect(link).toBeVisible();
    // POST-APPLY UPDATE (card deep-links): the card CTA links to the matching
    // row of the servicios page (/servicios#<solution-slug>) instead of the
    // bare /soluciones route, so the anchor contract matches the config.
    await expect(link).toHaveAttribute('href', /^\/servicios#/);
    const linkBg = await link.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );
    // --color-primary = #41B3C4 = rgb(65, 179, 196)
    expect(linkBg).toBe('rgb(65, 179, 196)');
    const linkColor = await link.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(linkColor).toBe('rgb(255, 255, 255)');
    // Flat design: a solid button carries block padding, not a bare text link.
    const linkCls = await link.getAttribute('class');
    expect(linkCls).toContain('px-6');
    expect(linkCls).toContain('py-3');
    await expect(link).toHaveCSS('border-radius', '0px');
  });

  test('document keeps exactly 1 h1 and a dynamic h4 outline (8 + N featured) (5.6)', async ({ page }) => {
    // NOTE: the Astro Dev Toolbar (injected into `astro preview`) appends its
    // own hidden <h1> elements to the DOM. Filter with :visible so we assert
    // on the page's actual visible content hierarchy only.
    // POST-APPLY UPDATE: the home page renders ServicesSection next to
    // SolutionSection (sibling section, same <h3> depth), so the visible
    // outline is 1/2/2/8. See services-section spec scenario "DOM order is
    // preserved: hero → panel → solutions → services".
    // POST-VERIFY UPDATE (destacados-section): the home page now renders
    // DestacadosSection right after ServicesSection (its own <h3> + 4 <h4>),
    // so the visible outline is 1/2/3/12. See destacados-section spec scenario
    // "DOM order is preserved: hero → panel → solutions → services → destacados".
    // POST-APPLY UPDATE (pilares-section): the home page renders PilaresSection
    // last (its own <h2> + <h3>), so the visible outline is 1/3/4/12. See
    // pilares-section spec scenario "DOM order is preserved: ... → pilares".
    // POST-APPLY UPDATE (home-featured-products-grid): the featured cards are
    // now panel-driven (backend `destacado` flag, capped at 8), so the h4
    // outline is 8 + N_featured (N_featured = min(8, backend destacados);
    // fixable base of 8 h4 comes from HeroBanner/PanelHome/SolutionSection/
    // ServicesSection/PilaresSection/NosotrosTeamSection).
    await expect(page.locator('h1:visible')).toHaveCount(1);
    await expect(page.locator('h2:visible')).toHaveCount(4);
    await expect(page.locator('h3:visible')).toHaveCount(4);
    await expect(page.locator('h4:visible')).toHaveCount(8 + FEATURED_COUNT);
  });

  test('all 4 solution images load without 404 (5.7)', async ({ page }) => {
    const section = page.locator(SECTION_SELECTOR);
    const imgs = section.locator('img');
    await expect(imgs).toHaveCount(4);

    // Wait for network idle-ish: scroll each image into view (lazy-loading)
    // and assert it actually loaded.
    for (let i = 0; i < 4; i++) {
      const img = imgs.nth(i);
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(async () => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
      await expect(img).toHaveJSProperty('complete', true);
    }
  });

  test('preserves DOM order TopHeader -> header -> search -> hero -> panel -> solutions -> services (5.8)', async ({
    page,
  }) => {
    const phone = page.locator('a[href^="tel:"]').first();
    const header = page.locator('header').first();
    const search = page.getByRole('search', { name: 'Buscar productos' });
    const hero = page.locator('section.relative:not(.z-10)').first();
    const panel = page.locator('section.relative.z-10').first();
    const solutions = page.locator(SECTION_SELECTOR).first();
    const services = page.locator('section.bg-secondary-dark').first();

    const phoneBox = await phone.boundingBox();
    const headerBox = await header.boundingBox();
    const searchBox = await search.boundingBox();
    const heroBox = await hero.boundingBox();
    const panelBox = await panel.boundingBox();
    const solutionsBox = await solutions.boundingBox();
    const servicesBox = await services.boundingBox();

    expect(phoneBox).toBeTruthy();
    expect(headerBox).toBeTruthy();
    expect(searchBox).toBeTruthy();
    expect(heroBox).toBeTruthy();
    expect(panelBox).toBeTruthy();
    expect(solutionsBox).toBeTruthy();
    expect(servicesBox).toBeTruthy();

    expect(phoneBox!.y).toBeLessThan(headerBox!.y);
    expect(headerBox!.y).toBeLessThan(searchBox!.y);
    expect(searchBox!.y).toBeLessThan(heroBox!.y);
    expect(heroBox!.y).toBeLessThan(panelBox!.y);
    expect(panelBox!.y).toBeLessThan(solutionsBox!.y);
    expect(solutionsBox!.y).toBeLessThan(servicesBox!.y);
  });

  test('WCAG AA Normal: h4 navy text on white card background (5.9)', async ({
    page,
  }) => {
    const h4 = page.locator(`${SECTION_SELECTOR} article h4`).first();
    const { color, bg } = await h4.evaluate((el) => {
      const card = el.closest('article')!;
      const cs = window.getComputedStyle(el);
      const cardCs = window.getComputedStyle(card);
      // The h4 itself is transparent; the white background lives on the card.
      return { color: cs.color, bg: cardCs.backgroundColor };
    });
    // Card bg is white rgb(255,255,255); navy text #1F2D40 => ratio ~12.3:1.
    const ratio = contrastRatio(color, bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test('WCAG AA Normal: eyebrow accent-dark orange on white passes (5.10)', async ({
    page,
  }) => {
    const eyebrow = page
      .locator(`${SECTION_SELECTOR} span.uppercase`)
      .first();
    const { color, bg } = await eyebrow.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { color: cs.color, bg: cs.backgroundColor };
    });
    // POST-APPLY UPDATE (design.md § Decision 8): the shipped default is
    // text-accent-dark (#D14E12) instead of text-accent (#F26A21) so the
    // eyebrow meets WCAG AA Normal (>= 4.5:1) on the white section background:
    // #D14E12 on #FFFFFF yields ~4.6:1; #F26A21 yields only ~3.34:1 (fails).
    const ratio = contrastRatio(color, bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    console.log(`eyebrow contrast ratio: ${ratio.toFixed(2)}:1`);
  });

  test('SABER MÁS links are keyboard-focusable and navigate to the servicios anchor (5.11)', async ({
    page,
  }) => {
    const firstLink = page
      .locator(`${SECTION_SELECTOR} article`)
      .first()
      .getByRole('link', { name: /SABER MÁS/ });

    await firstLink.focus();
    await expect(firstLink).toBeFocused();

    // Navigate to /servicios#<solution-slug> (card deep-link contract,
    // see config `solution-section.ts` — the matching row of the servicios
    // page is the actual destination).
    const href = await firstLink.getAttribute('href');
    expect(href).toMatch(/^\/servicios#/);
  });

  test('card shadow changes from shadow-1 to shadow-3 on hover (5.12)', async ({
    page,
  }) => {
    const card = page.locator(`${SECTION_SELECTOR} article`).first();

    const shadowBefore = await card.evaluate(
      (el) => window.getComputedStyle(el).boxShadow,
    );
    await card.hover();
    await page.waitForTimeout(400); // allow transition-shadow to settle
    const shadowAfter = await card.evaluate(
      (el) => window.getComputedStyle(el).boxShadow,
    );

    // Both shadows are non-none and they differ (shadow-1 -> shadow-3).
    expect(shadowBefore).not.toBe('none');
    expect(shadowAfter).not.toBe('none');
    expect(shadowBefore).not.toBe(shadowAfter);
  });
});

test.describe('DestacadosSection (home featured products grid)', () => {
  const FEATURED_SELECTOR = 'section.bg-secondary-dark';

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
  });

  test('renders the 8-card cap: 9 stub destacados -> 8 cards on a 4x2 grid (6.1)', async ({
    page,
  }) => {
    // Guard: the stub must serve MORE destacados than the cap, otherwise the
    // rendered count would not prove the `slice(0, 8)` contract.
    expect(FEATURED_BACKEND_COUNT).toBeGreaterThan(8);

    const section = page.locator(FEATURED_SELECTOR);
    await expect(section).toBeVisible();

    // Cap: exactly 8 cards rendered despite 9 panel destacados.
    const cards = section.locator('article');
    await expect(cards).toHaveCount(8);

    // Grid wrapper keeps the responsive pattern (1 / 2 / 4 columns).
    const grid = cards.first().locator('xpath=..');
    const gridClass = await grid.getAttribute('class');
    expect(gridClass).toContain('grid-cols-1');
    expect(gridClass).toContain('sm:grid-cols-2');
    expect(gridClass).toContain('lg:grid-cols-4');
    expect(gridClass).toContain('gap-6');
  });

  test('desktop grid does not break: 4 columns x 2 rows aligned (6.1)', async ({
    page,
  }) => {
    const cards = page.locator(`${FEATURED_SELECTOR} article`);
    await expect(cards).toHaveCount(8);

    const boxes = await cards.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y };
      }),
    );
    // Row 1: cards 0-3 aligned on the same baseline Y.
    for (let i = 1; i <= 3; i++) {
      expect(Math.abs(boxes[i]!.y - boxes[0]!.y)).toBeLessThan(2);
      expect(boxes[i]!.x).toBeGreaterThan(boxes[i - 1]!.x);
    }
    // Row 2 exists below row 1: cards 4-7 aligned, strictly lower than row 1.
    for (let i = 5; i <= 7; i++) {
      expect(Math.abs(boxes[i]!.y - boxes[4]!.y)).toBeLessThan(2);
      expect(boxes[i]!.x).toBeGreaterThan(boxes[i - 1]!.x);
    }
    expect(boxes[4]!.y).toBeGreaterThan(boxes[0]!.y);
  });

  test('first card renders the lazy remote galeria image (6.1)', async ({
    page,
  }) => {
    const img = page
      .locator(`${FEATURED_SELECTOR} article`)
      .first()
      .locator('img');
    await expect(img).toHaveAttribute('loading', 'lazy');
    await expect(img).toHaveAttribute('decoding', 'async');
    await expect(img).toHaveAttribute('src', /firebasestorage/);
    const alt = await img.getAttribute('alt');
    expect(alt).toBeTruthy();
    expect(alt!.length).toBeGreaterThan(0);
  });
});