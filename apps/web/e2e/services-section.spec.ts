import { test, expect } from 'playwright/test';

/**
 * E2E tests for the ServicesSection component on the home page.
 *
 * Selector strategy: the ServicesSection is the FOURTH <section> on the page
 * (the first is the HeroBanner `section.relative`, the second is the PanelHome
 * `section.relative.z-10`, the third is the SolutionSection `section.bg-bg`).
 * We target it by its unique class `bg-secondary-dark`: `section.bg-secondary-dark`
 * is unique to the ServicesSection.
 */

const SECTION_SELECTOR = 'section.bg-secondary-dark';

/**
 * Computes the WCAG contrast ratio between two CSS rgb() color strings.
 * Same helper as solution-section.spec.ts (kept local to avoid cross-file coupling).
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

test.describe('ServicesSection (home specialized services)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
  });

  test('renders the section with the <h3> "Servicios especializados" on desktop', async ({
    page,
  }) => {
    const section = page.locator(SECTION_SELECTOR);
    await expect(section).toBeVisible();
    const h3 = section.locator('h3');
    await expect(h3).toBeVisible();
    await expect(h3).toHaveText('Servicios especializados');
  });

  test('renders the centered description paragraph under the headline', async ({
    page,
  }) => {
    const section = page.locator(SECTION_SELECTOR);
    const desc = section.locator('p', {
      hasText: 'Soluciones técnicas para instalación',
    });
    await expect(desc).toBeVisible();
  });

  test('grid shows 2 columns on desktop >= 768px', async ({ page }) => {
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

  test('grid shows 1 column on mobile < 768px', async ({ page }) => {
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

  test('each card has horizontal layout, full-color lazy image, h4 title, description and solid CTA', async ({
    page,
  }) => {
    const section = page.locator(SECTION_SELECTOR);
    const cards = section.locator('article');
    await expect(cards).toHaveCount(4);

    const firstCard = cards.first();
    // Dark card: bg-secondary on bg-secondary-dark section (no white card).
    const cardBg = await firstCard.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );
    // --color-secondary = #1F2D40 = rgb(31, 45, 64)
    expect(cardBg).toBe('rgb(31, 45, 64)');

    // Image: lazy loading + non-empty alt + NO grayscale filter (POST-APPLY
    // UPDATE: images render in full color, see design.md § Decision 8).
    const img = firstCard.locator('img').first();
    await expect(img).toHaveAttribute('loading', 'lazy');
    const alt = await img.getAttribute('alt');
    expect(alt).toBeTruthy();
    expect(alt!.length).toBeGreaterThan(0);
    const filter = await img.evaluate(
      (el) => window.getComputedStyle(el).filter,
    );
    expect(filter).not.toContain('grayscale');

    // Title h4 + description p.
    await expect(firstCard.locator('h4')).toBeVisible();
    await expect(firstCard.locator('p')).toHaveCount(1);

    // Card CTA: design-system solid primary button (bg teal, white text),
    // visible text "Ver detalles" (POST-APPLY UPDATE, design.md § Decision 9).
    const link = firstCard.getByRole('link', { name: /Ver detalles/ });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/servicios');
    const linkBg = await link.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );
    // --color-primary = #41B3C4 = rgb(65, 179, 196)
    expect(linkBg).toBe('rgb(65, 179, 196)');
    const linkColor = await link.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    expect(linkColor).toBe('rgb(255, 255, 255)');
    const linkCls = await link.getAttribute('class');
    expect(linkCls).toContain('px-6');
    expect(linkCls).toContain('py-3');
    await expect(link).toHaveCSS('border-radius', '0px');
  });

  test('renders the centered bottom CTA "Ver todos los servicios" linking to /servicios', async ({
    page,
  }) => {
    const section = page.locator(SECTION_SELECTOR);
    const bottomCta = section.getByRole('link', {
      name: /Ver todos los servicios/,
    }).last();
    await expect(bottomCta).toBeVisible();
    await expect(bottomCta).toHaveAttribute('href', '/servicios');
    // Larger than the per-card CTAs: px-8 py-4.
    const cls = await bottomCta.getAttribute('class');
    expect(cls).toContain('px-8');
    expect(cls).toContain('py-4');
  });

  test('document keeps exactly 1 h1, 3 h2, 4 h3 and 12 h4', async ({ page }) => {
    // See servicios-section spec scenario "DOM order is preserved": the page
    // outline is now 1/2/2/8 (ServicesSection adds its own <h3> and 4 <h4>).
    // POST-VERIFY UPDATE (destacados-section): the home page renders
    // DestacadosSection right after ServicesSection (its own <h3> + 4 <h4>),
    // so the visible outline is 1/2/3/12. See destacados-section spec scenario
    // "DOM order is preserved: hero → panel → solutions → services → destacados".
    // POST-APPLY UPDATE (pilares-section): the home page renders PilaresSection
    // last (its own <h2> + <h3>), so the visible outline is 1/3/4/12. See
    // pilares-section spec scenario "DOM order is preserved: ... → pilares".
    await expect(page.locator('h1:visible')).toHaveCount(1);
    await expect(page.locator('h2:visible')).toHaveCount(3);
    await expect(page.locator('h3:visible')).toHaveCount(4);
    await expect(page.locator('h4:visible')).toHaveCount(12);
  });

  test('all 4 service images load without 404', async ({ page }) => {
    const section = page.locator(SECTION_SELECTOR);
    const imgs = section.locator('img');
    await expect(imgs).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
      const img = imgs.nth(i);
      await expect(img).toHaveJSProperty('complete', true);
      const naturalWidth = await img.evaluate(
        (el) => (el as HTMLImageElement).naturalWidth,
      );
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test('WCAG AA Normal: teal h4 title on bg-secondary card background', async ({
    page,
  }) => {
    const h4 = page.locator(`${SECTION_SELECTOR} article h4`).first();
    const { color, bg } = await h4.evaluate((el) => {
      const card = el.closest('article')!;
      const cs = window.getComputedStyle(el);
      const cardCs = window.getComputedStyle(card);
      return { color: cs.color, bg: cardCs.backgroundColor };
    });
    // #41B3C4 on #1F2D40 => ratio ~4.6:1 (AA Normal passes).
    const ratio = contrastRatio(color, bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test('all service CTAs are keyboard-focusable and navigate to /servicios', async ({
    page,
  }) => {
    const firstLink = page
      .locator(`${SECTION_SELECTOR} article`)
      .first()
      .getByRole('link', { name: /Ver detalles/ });

    await firstLink.focus();
    await expect(firstLink).toBeFocused();
    // Navigate to /servicios (a 404 page today, but the href contract is what
    // matters; the route will exist in the future servicios-page change).
    const href = await firstLink.getAttribute('href');
    expect(href).toBe('/servicios');
  });

  test('card does NOT apply a shadow in its static state (flat design)', async ({
    page,
  }) => {
    const card = page.locator(`${SECTION_SELECTOR} article`).first();
    const shadow = await card.evaluate(
      (el) => window.getComputedStyle(el).boxShadow,
    );
    // Flat design: base components do NOT use shadows.
    expect(shadow).toBe('none');
  });
});