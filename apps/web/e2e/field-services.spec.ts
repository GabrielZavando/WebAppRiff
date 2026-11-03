import { test, expect } from 'playwright/test';

/**
 * Field service cards on `/servicios` — `md+` vertical layout.
 *
 * The cards used to render a 12-column row (image left, text right) from `md`.
 * The contract now is a single column with the strict order: index/sector,
 * title, full-width 16:9 image, description, body variant and CTA. The CTA must
 * stay clear of the fixed WhatsApp/Phone FABs.
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

const VIEWPORTS = [
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
] as const;

test.describe('Field service cards — md+ vertical layout', () => {
  for (const viewport of VIEWPORTS) {
    test(`orders header, image, description, features and CTA at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize(viewport);
      await page.goto('/servicios');

      const card = page.locator('[data-service-card]').first();
      await card.scrollIntoViewIfNeeded();

      const index = card.locator('[data-service-index]');
      const title = card.locator('h3');
      const image = card.locator('[data-service-image]');
      const description = card.locator('[data-service-description]');
      const feature = card.locator('[data-feature]').first();
      const cta = card.locator('[data-service-cta] a');

      const [indexBox, titleBox, imageBox, descriptionBox, featureBox, ctaBox, cardBox] =
        await Promise.all([
          index.boundingBox(),
          title.boundingBox(),
          image.boundingBox(),
          description.boundingBox(),
          feature.boundingBox(),
          cta.boundingBox(),
          card.boundingBox(),
        ]);

      expect(indexBox).toBeTruthy();
      expect(titleBox).toBeTruthy();
      expect(imageBox).toBeTruthy();
      expect(descriptionBox).toBeTruthy();
      expect(featureBox).toBeTruthy();
      expect(ctaBox).toBeTruthy();
      expect(cardBox).toBeTruthy();

      expect(indexBox!.y).toBeLessThan(titleBox!.y);
      expect(titleBox!.y).toBeLessThan(imageBox!.y);
      expect(imageBox!.y).toBeLessThan(descriptionBox!.y);
      expect(descriptionBox!.y).toBeLessThan(featureBox!.y);
      expect(featureBox!.y).toBeLessThan(ctaBox!.y);

      expect(Math.abs(imageBox!.width - cardBox!.width)).toBeLessThanOrEqual(3);
      expect(imageBox!.width / imageBox!.height).toBeGreaterThan(1.7);
      expect(imageBox!.width / imageBox!.height).toBeLessThan(1.85);

      await cta.scrollIntoViewIfNeeded();
      const visibleCtaBox = await cta.boundingBox();
      const whatsappBox = await page
        .getByRole('link', { name: 'Contactar por WhatsApp' })
        .boundingBox();
      const phoneBox = await page.getByRole('link', { name: 'Llamar a Riff' }).boundingBox();

      expect(visibleCtaBox).toBeTruthy();
      expect(whatsappBox).toBeTruthy();
      expect(phoneBox).toBeTruthy();
      expect(intersects(visibleCtaBox!, whatsappBox!)).toBe(false);
      expect(intersects(visibleCtaBox!, phoneBox!)).toBe(false);
    });
  }

  test('keeps the image first on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/servicios');

    const card = page.locator('[data-service-card]').first();
    await card.scrollIntoViewIfNeeded();

    const image = card.locator('[data-service-image]');
    const header = card.locator('[data-service-header]');
    const description = card.locator('[data-service-description]');

    const imageBox = await image.boundingBox();
    const headerBox = await header.boundingBox();
    const descriptionBox = await description.boundingBox();

    expect(imageBox).toBeTruthy();
    expect(headerBox).toBeTruthy();
    expect(descriptionBox).toBeTruthy();
    expect(imageBox!.y).toBeLessThan(headerBox!.y);
    expect(headerBox!.y).toBeLessThan(descriptionBox!.y);
  });
});
