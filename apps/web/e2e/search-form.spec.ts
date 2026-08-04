import { test, expect } from 'playwright/test';

const CATEGORIES = [
  'Todas las categorías',
  'Herramientas',
  'Seguridad',
  'Electricidad',
] as const;

test.describe('SearchForm (global search bar)', () => {
  test('renders the search landmark with select, input and button inline on desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    await expect(search).toBeVisible();

    // All three controls live inside the search landmark and are visible.
    await expect(search.getByRole('combobox')).toBeVisible();
    await expect(search.getByRole('searchbox')).toBeVisible();
    await expect(search.getByRole('button', { name: 'BUSCAR' })).toBeVisible();

    // The form is laid out horizontally on desktop: the three siblings share
    // the same row. We assert the bounding boxes are vertically aligned.
    const formBox = await search.locator('form').boundingBox();
    const selectBox = await search.getByRole('combobox').boundingBox();
    const inputBox = await search.getByRole('searchbox').boundingBox();
    const buttonBox = await search.getByRole('button', { name: 'BUSCAR' }).boundingBox();
    expect(formBox).toBeTruthy();
    expect(selectBox).toBeTruthy();
    expect(inputBox).toBeTruthy();
    expect(buttonBox).toBeTruthy();
    // All three are on the same row (top within +/- 4px tolerance for rounding).
    const tops = [
      selectBox!.y,
      inputBox!.y,
      buttonBox!.y,
    ].map((y) => Math.round(y));
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(4);
  });

  test('stacks the three controls full-width on mobile (< 768px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    const formWidth = (await search.locator('form').boundingBox())!.width;

    const selectBox = await search.getByRole('combobox').boundingBox();
    const inputBox = await search.getByRole('searchbox').boundingBox();
    const buttonBox = await search.getByRole('button', { name: 'BUSCAR' }).boundingBox();

    // Each control fills the form width (within 8px tolerance for padding).
    expect(Math.abs(selectBox!.width - formWidth)).toBeLessThanOrEqual(8);
    expect(Math.abs(inputBox!.width - formWidth)).toBeLessThanOrEqual(8);
    expect(Math.abs(buttonBox!.width - formWidth)).toBeLessThanOrEqual(8);

    // The three sit on different rows: each starts strictly below the previous.
    expect(selectBox!.y).toBeLessThan(inputBox!.y);
    expect(inputBox!.y).toBeLessThan(buttonBox!.y);
  });

  test('exposes "Todas las categorías" as the first selectable category option', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const select = page.getByRole('search', { name: 'Buscar productos' }).getByRole('combobox');
    // Astro renders JSX with surrounding whitespace in the option text nodes;
    // trim each value before comparing so the assertion is text-stable.
    const options = (await select.locator('option').allTextContents()).map((s) => s.trim());
    expect(options[0]).toBe('Todas las categorías');
    expect(options).toEqual([...CATEGORIES]);
  });

  test('uses the documented placeholder in the search input', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const input = page.getByRole('search', { name: 'Buscar productos' }).getByRole('searchbox');
    await expect(input).toHaveAttribute('placeholder', '¿Qué solución está buscando?');
  });

  test('uses the brand-orange background on the BUSCAR button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const button = page.getByRole('search', { name: 'Buscar productos' }).getByRole('button', {
      name: 'BUSCAR',
    });
    // Token is #F97316 in globals.css. We accept an exact match (Tailwind v4
    // resolves the bg-brand-orange utility to the CSS variable literal).
    const bg = await button.evaluate((el) => getComputedStyle(el).backgroundColor);
    // rgb(249, 115, 22) == #F97316. We accept either format.
    expect(['rgb(249, 115, 22)', 'rgb(249,115,22)']).toContain(bg);
  });

  test('navigates to /productos?q=...&categoriaId=... when both fields are filled', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    await search.getByRole('searchbox').fill('taladro');
    await search.getByRole('combobox').selectOption('herramientas');
    await search.getByRole('button', { name: 'BUSCAR' }).click();

    await page.waitForURL('**/productos?q=taladro&categoriaId=herramientas');
    expect(page.url()).toContain('/productos?q=taladro&categoriaId=herramientas');
  });

  test('omits empty q when only categoriaId is filled', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    // Leave input empty
    await search.getByRole('combobox').selectOption('herramientas');
    await search.getByRole('button', { name: 'BUSCAR' }).click();

    await page.waitForURL('**/productos?categoriaId=herramientas');
    expect(page.url()).toContain('categoriaId=herramientas');
    expect(page.url()).not.toContain('q=');
  });

  test('omits empty categoriaId when only q is filled', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    await search.getByRole('searchbox').fill('taladro');
    // Keep "Todas las categorías" selected (default empty value)
    await search.getByRole('combobox').selectOption('');
    await search.getByRole('button', { name: 'BUSCAR' }).click();

    await page.waitForURL('**/productos?q=taladro');
    expect(page.url()).toContain('/productos?q=taladro');
    expect(page.url()).not.toContain('categoriaId=');
  });

  test('navigates to /productos (no query string) when both fields are empty', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    await search.getByRole('button', { name: 'BUSCAR' }).click();

    // The sanitisation script replaces any `?` runs with the bare action path.
    await page.waitForURL(/\/productos\/?(?:[?#].*)?$/);
    // URL must NOT contain `q=` or `categoriaId=` (sanitisation removed them).
    expect(page.url()).not.toContain('q=');
    expect(page.url()).not.toContain('categoriaId=');
  });

  test('trims leading and trailing whitespace from the query on submit', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    // Type the value with surrounding whitespace; the sanitisation script
    // (mirroring buildSearchHref) trims it before building the URL.
    await search.getByRole('searchbox').fill('   taladro   ');
    // Keep "Todas las categorías" selected (default empty value).
    await search.getByRole('combobox').selectOption('');
    await search.getByRole('button', { name: 'BUSCAR' }).click();

    await page.waitForURL('**/productos?q=taladro');
    // No `+`-runs at the start or end of the `q` value; only the trimmed text.
    expect(page.url()).toContain('/productos?q=taladro');
    // Hard check: URL must not contain `q=+taladro` / `q=taladro+` / `q=%20`
    expect(page.url()).not.toContain('q=+');
    expect(page.url()).not.toContain('q=taladro+');
    expect(page.url()).not.toContain('%20');
  });

  test('supports Tab navigation through the three controls in order', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    const select = search.getByRole('combobox');
    const input = search.getByRole('searchbox');
    const button = search.getByRole('button', { name: 'BUSCAR' });

    // Move focus into the form by clicking the select first (or via Tab from
    // the last focusable of the header). We focus the select explicitly and
    // then Tab to confirm the order select → input → button.
    await select.focus();
    await expect(select).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(input).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
  });

  test('submits via Enter while the input is focused', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    await search.getByRole('searchbox').fill('taladro');
    await search.getByRole('searchbox').press('Enter');

    await page.waitForURL('**/productos?q=taladro');
    expect(page.url()).toContain('/productos?q=taladro');
  });

  test('renders the /productos placeholder page without 404', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const response = await page.goto('/productos');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Resultados de búsqueda' })).toBeVisible();
  });

  test('preserves a single <header> landmark alongside the search landmark', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.getByRole('search')).toHaveCount(1);
  });

  test('renders TopHeader → header → div[role=search] → page content in DOM order', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const topHeader = page.getByRole('region', { name: 'Barra de contacto' });
    const header = page.locator('header');
    const search = page.getByRole('search', { name: 'Buscar productos' });
    // The Layout <slot /> historically rendered a <main> placeholder from
    // index.astro. After the change `banner-home`, the slot renders a hero
    // <section> instead. We assert the order against the next visible
    // landmark in the page after the search form, regardless of its tag,
    // to keep the spec assertion stable across page-template changes.
    const heroSection = page.locator('section').first();

    const topY = (await topHeader.boundingBox())!.y;
    const headerY = (await header.boundingBox())!.y;
    const searchY = (await search.boundingBox())!.y;
    const slotY = (await heroSection.boundingBox())!.y;

    expect(topY).toBeLessThan(headerY);
    expect(headerY).toBeLessThan(searchY);
    expect(searchY).toBeLessThan(slotY);
  });
});
