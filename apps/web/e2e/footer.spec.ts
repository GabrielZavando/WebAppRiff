import { test, expect } from 'playwright/test';

/**
 * Footer bottom bar — scroll-to-top vs floating CTAs.
 *
 * The scroll-to-top button must sit immediately before the "SANTIAGO, CHILE"
 * location text and stay clear of the fixed WhatsApp (`bottom-6 right-6`) and
 * phone (`bottom-24 right-6`) FABs from `md` upward.
 */

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function intersects(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

test.describe('Footer scroll-to-top button vs floating CTAs', () => {
  for (const viewport of [
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
  ]) {
    test(`does not overlap the FABs at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize(viewport);
      await page.goto('/');

      const scrollTop = page.locator('[data-scroll-top]');
      await scrollTop.scrollIntoViewIfNeeded();
      await expect(scrollTop).toBeVisible();

      const scrollTopBox = await scrollTop.boundingBox();
      const whatsappBox = await page.getByRole('link', { name: 'Contactar por WhatsApp' }).boundingBox();
      const phoneBox = await page.getByRole('link', { name: 'Llamar a Riff' }).boundingBox();

      expect(scrollTopBox).toBeTruthy();
      expect(whatsappBox).toBeTruthy();
      expect(phoneBox).toBeTruthy();
      expect(intersects(scrollTopBox!, whatsappBox!)).toBe(false);
      expect(intersects(scrollTopBox!, phoneBox!)).toBe(false);
    });
  }
});
