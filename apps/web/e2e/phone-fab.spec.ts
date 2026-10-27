import { test, expect } from 'playwright/test';

/**
 * Global floating phone FAB (`phone-fab` spec).
 *
 * The link is rendered once by `Layout.astro` on every page, stacked 16px above
 * the existing WhatsApp FAB. Motion is reduced for these assertions so the
 * pulsing scale transform cannot skew the measured/bounding boxes.
 */

const PHONE_HREF = 'tel:+56229079067';

function getPhoneFab(page: import('playwright/test').Page) {
  return page.getByRole('link', { name: 'Llamar a Riff' });
}

function getWhatsAppFab(page: import('playwright/test').Page) {
  return page.getByRole('link', { name: 'Contactar por WhatsApp' });
}

test.describe('Phone FAB (global floating call action)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('renders an accessible tel: link on the home page', async ({ page }) => {
    await page.goto('/');

    const fab = getPhoneFab(page);
    await expect(fab).toBeVisible();
    await expect(fab).toHaveAttribute('href', PHONE_HREF);
    await expect(fab).toHaveAccessibleName('Llamar a Riff');
  });

  test('renders the phone FAB on /representaciones too', async ({ page }) => {
    await page.goto('/representaciones');

    const fab = getPhoneFab(page);
    await expect(fab).toBeVisible();
    await expect(fab).toHaveAttribute('href', PHONE_HREF);
  });

  test('is a fixed 56px accent FAB above page content and below the header stack', async ({
    page,
  }) => {
    await page.goto('/');

    const fab = getPhoneFab(page);
    const styles = await fab.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        position: cs.position,
        bottom: cs.bottom,
        right: cs.right,
        zIndex: cs.zIndex,
        width: cs.width,
        height: cs.height,
        backgroundColor: cs.backgroundColor,
      };
    });

    expect(styles.position).toBe('fixed');
    expect(styles.bottom).toBe('96px');
    expect(styles.right).toBe('24px');
    expect(styles.zIndex).toBe('20');
    expect(styles.width).toBe('56px');
    expect(styles.height).toBe('56px');
    // --color-accent = #F26A21.
    expect(styles.backgroundColor).toBe('rgb(242, 106, 33)');
  });

  test('sits exactly 16px above the WhatsApp FAB', async ({ page }) => {
    await page.goto('/');

    const phoneBox = await getPhoneFab(page).boundingBox();
    const whatsappBox = await getWhatsAppFab(page).boundingBox();
    expect(phoneBox).toBeTruthy();
    expect(whatsappBox).toBeTruthy();

    // Same right edge and width (aligned column).
    expect(Math.abs(phoneBox!.x - whatsappBox!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(phoneBox!.width - whatsappBox!.width)).toBeLessThanOrEqual(1);

    // bottom-24 (96px) vs bottom-6 (24px), both 56px tall → 16px gap.
    const gap = whatsappBox!.y - (phoneBox!.y + phoneBox!.height);
    expect(gap).toBeGreaterThanOrEqual(15);
    expect(gap).toBeLessThanOrEqual(17);
  });
});
