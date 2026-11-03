import { test, expect } from 'playwright/test';

const CATEGORIES = [
  'Todas las categorías',
  'Medición de Fluidos',
  'Tratamiento de Agua',
  'Control y Automatización',
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

  test('keeps the select on its own row and input + button together on mobile (< 640px)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    const formWidth = (await search.locator('form').boundingBox())!.width;

    const selectBox = await search.getByRole('combobox').boundingBox();
    const inputBox = await search.getByRole('searchbox').boundingBox();
    const button = search.getByRole('button', { name: 'BUSCAR' });
    const buttonBox = await button.boundingBox();

    // The select spans the full form width on its own first row.
    expect(selectBox).toBeTruthy();
    expect(inputBox).toBeTruthy();
    expect(buttonBox).toBeTruthy();
    expect(Math.abs(selectBox!.width - formWidth)).toBeLessThanOrEqual(8);
    expect(selectBox!.y).toBeLessThan(inputBox!.y);

    // Input and button share the second row, attached with no horizontal gap.
    expect(Math.abs(inputBox!.y - buttonBox!.y)).toBeLessThanOrEqual(4);
    const inputRight = inputBox!.x + inputBox!.width;
    expect(Math.abs(inputRight - buttonBox!.x)).toBeLessThanOrEqual(2);

    // The icon-only button keeps its name and does not stretch to full width.
    expect(buttonBox!.width).toBeLessThan(formWidth / 2);
    await expect(button).toHaveAccessibleName('BUSCAR');
    await expect(button.locator('span')).toBeHidden();
  });

  test('keeps an even select/input split and a 60px icon-only button on the 640x800 tablet viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 800 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    const select = search.getByRole('combobox');
    const selectBox = await select.boundingBox();
    const inputBox = await search.getByRole('searchbox').boundingBox();
    const button = search.getByRole('button', { name: 'BUSCAR' });
    const buttonBox = await button.boundingBox();
    expect(selectBox).toBeTruthy();
    expect(inputBox).toBeTruthy();
    expect(buttonBox).toBeTruthy();

    // The icon-only button is capped at 60px (max-w-[60px]).
    expect(buttonBox!.width).toBeLessThanOrEqual(61);
    // The select and the input split the remaining width evenly.
    expect(Math.abs(selectBox!.width - inputBox!.width)).toBeLessThanOrEqual(2);
    // "Todas las categorías" must not be truncated inside the select.
    expect(selectBox!.width).toBeGreaterThanOrEqual(255);
    const selectOverflow = await select.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(selectOverflow).toBeLessThanOrEqual(1);
    // The input takes the remaining space between the select and the button.
    expect(inputBox!.width).toBeGreaterThan(0);
    const inputRight = inputBox!.x + inputBox!.width;
    expect(Math.abs(inputRight - buttonBox!.x)).toBeLessThanOrEqual(2);
    // All three controls stay on the same row without horizontal scroll.
    const tops = [selectBox!.y, inputBox!.y, buttonBox!.y].map((y) => Math.round(y));
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(4);
  });

  test('keeps the full select label on a large phone in landscape (640x375)', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 375 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    const select = search.getByRole('combobox');
    const selectBox = await select.boundingBox();
    const inputBox = await search.getByRole('searchbox').boundingBox();
    const buttonBox = await search.getByRole('button', { name: 'BUSCAR' }).boundingBox();
    expect(selectBox).toBeTruthy();
    expect(inputBox).toBeTruthy();
    expect(buttonBox).toBeTruthy();

    // The 176px compact width only applies below sm: at 640px the select
    // shares the row with the input, so "Todas las categorías" is never
    // truncated.
    expect(selectBox!.width).toBeGreaterThanOrEqual(255);
    const selectOverflow = await select.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(selectOverflow).toBeLessThanOrEqual(1);

    // The compact height keeps the three controls on a single row.
    const tops = [selectBox!.y, inputBox!.y, buttonBox!.y].map((y) => Math.round(y));
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(4);
    const searchBox = await search.boundingBox();
    expect(searchBox!.height).toBeLessThanOrEqual(375 * 0.25);
  });

  test('compacts into a single row on short viewports (height <= 400px) (responsive-web-design-fixes)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 568, height: 320 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    const selectBox = await search.getByRole('combobox').boundingBox();
    const inputBox = await search.getByRole('searchbox').boundingBox();
    const buttonBox = await search.getByRole('button', { name: 'BUSCAR' }).boundingBox();
    expect(selectBox).toBeTruthy();
    expect(inputBox).toBeTruthy();
    expect(buttonBox).toBeTruthy();

    // The three controls share the same row (top within +/- 4px tolerance).
    const tops = [selectBox!.y, inputBox!.y, buttonBox!.y].map((y) => Math.round(y));
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(4);

    // The search bar occupies at most a quarter of the viewport height.
    const searchBox = await search.boundingBox();
    expect(searchBox).toBeTruthy();
    expect(searchBox!.height).toBeLessThanOrEqual(320 * 0.25);

    // The compact select keeps its 176px width: the flexible input must not
    // squeeze it below the width that fits "Todas las categorías".
    expect(selectBox!.width).toBeGreaterThanOrEqual(170);

    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(568);
  });

  test('keeps the approved composition on landscape desktop viewports (responsive-web-design-fixes)', async ({
    page,
  }) => {
    // 1440x900 is landscape but not short: the compaction must NOT apply.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    const searchBox = await search.boundingBox();
    expect(searchBox).toBeTruthy();
    // py-4 (32px) + a 44px control row.
    expect(searchBox!.height).toBeGreaterThan(70);
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
    await expect(input).toHaveAttribute('placeholder', '¿Qué estás buscando?');
  });

  test('uses the primary background (#41B3C4) on the BUSCAR button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const button = page.getByRole('search', { name: 'Buscar productos' }).getByRole('button', {
      name: 'BUSCAR',
    });
    // Token is #41B3C4 (--color-primary) in globals.css. We accept either RGB format.
    const bg = await button.evaluate((el) => getComputedStyle(el).backgroundColor);
    // rgb(65, 179, 196) == #41B3C4.
    expect(['rgb(65, 179, 196)', 'rgb(65,179,196)']).toContain(bg);
  });

  test('renders a search icon inside the BUSCAR button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const button = page.getByRole('search', { name: 'Buscar productos' }).getByRole('button', {
      name: 'BUSCAR',
    });
    // The search icon (lucide:search) renders as an inline <svg> inside the button.
    const svgCount = await button.locator('svg').count();
    expect(svgCount).toBeGreaterThanOrEqual(1);
    // The button's accessible name must remain "BUSCAR" (icon is aria-hidden).
    await expect(button).toHaveAccessibleName('BUSCAR');
  });

  test('constrains the form container to max-width 760px and centers it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    const form = search.locator('form');
    // The inner container (direct parent of <form>) must carry max-w-[760px].
    const container = form.locator('xpath=..');
    const containerClass = await container.getAttribute('class') ?? '';
    expect(containerClass).toContain('max-w-[760px]');
    expect(containerClass).toContain('mx-auto');
    expect(containerClass).not.toContain('container');
  });

  test('separates desktop controls by 1px (gap-px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    const form = search.locator('form');
    const formClass = await form.getAttribute('class') ?? '';
    expect(formClass).toContain('gap-y-3');
    expect(formClass).toContain('sm:gap-px');
    expect(formClass).not.toContain('sm:gap-3');

    // Visual assertion: on desktop, the 1px gap means the right edge of the
    // select and the left edge of the input differ by ≤ 2px (1px gap + 1px
    // border tolerance). Similarly for input→button.
    const selectBox = await search.getByRole('combobox').boundingBox();
    const inputBox = await search.getByRole('searchbox').boundingBox();
    const buttonBox = await search.getByRole('button', { name: 'BUSCAR' }).boundingBox();
    expect(selectBox).toBeTruthy();
    expect(inputBox).toBeTruthy();
    expect(buttonBox).toBeTruthy();
    const selectRight = selectBox!.x + selectBox!.width;
    expect(Math.abs(selectRight - inputBox!.x)).toBeLessThanOrEqual(2);
    const inputRight = inputBox!.x + inputBox!.width;
    expect(Math.abs(inputRight - buttonBox!.x)).toBeLessThanOrEqual(2);
  });

  test('uses flex layout with a compact icon-only button on the BUSCAR button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const button = page.getByRole('search', { name: 'Buscar productos' }).getByRole('button', {
      name: 'BUSCAR',
    });
    const buttonClass = await button.getAttribute('class') ?? '';
    expect(buttonClass).toContain('flex');
    expect(buttonClass).toContain('items-center');
    expect(buttonClass).toContain('justify-center');
    expect(buttonClass).toContain('gap-2');
    expect(buttonClass).toContain('px-4');
    expect(buttonClass).toContain('sm:max-w-[60px]');
    expect(buttonClass).not.toContain('sm:px-8');
    expect(buttonClass).not.toContain('px-6');

    // The "BUSCAR" text stays in the DOM but is hidden at every breakpoint.
    await expect(button.locator('span')).toBeHidden();
    await expect(button).toHaveAccessibleName('BUSCAR');

    // The icon-only button never exceeds 60px wide.
    const buttonBox = await button.boundingBox();
    expect(buttonBox!.width).toBeLessThanOrEqual(61);
  });

  test('uses the updated placeholder in the search input', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const input = page.getByRole('search', { name: 'Buscar productos' }).getByRole('searchbox');
    await expect(input).toHaveAttribute('placeholder', '¿Qué estás buscando?');
  });

  test('navigates to /productos?q=...&categoriaId=... when both fields are filled', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    await search.getByRole('searchbox').fill('taladro');
    await search.getByRole('combobox').selectOption('cat-fluidos');
    await search.getByRole('button', { name: 'BUSCAR' }).click();

    await page.waitForURL('**/productos?q=taladro&categoriaId=cat-fluidos');
    expect(page.url()).toContain('/productos?q=taladro&categoriaId=cat-fluidos');
  });

  test('omits empty q when only categoriaId is filled', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    // Leave input empty
    await search.getByRole('combobox').selectOption('cat-fluidos');
    await search.getByRole('button', { name: 'BUSCAR' }).click();

    await page.waitForURL('**/productos?categoriaId=cat-fluidos');
    expect(page.url()).toContain('categoriaId=cat-fluidos');
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
    await expect(page.getByRole('heading', { name: 'Catálogo de Productos' })).toBeVisible();
  });

  test('preserves a single <header> landmark alongside the search landmark', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // The site <header> carries role=banner. The Astro 7 Dev Toolbar injects
    // additional plain <header> elements into the `astro preview` page, so we
    // assert against the banner role to stay robust (toolbar headers have no
    // banner role).
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('search')).toHaveCount(1);
  });

  test('renders header → div[role=search] → page content in DOM order', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Use the banner role instead of `locator('header')` (strict mode): the
    // Astro Dev Toolbar injects extra <header> elements in `astro preview`.
    const header = page.getByRole('banner');
    const search = page.getByRole('search', { name: 'Buscar productos' });
    // The Layout <slot /> historically rendered a <main> placeholder from
    // index.astro. After the change `banner-home`, the slot renders a hero
    // <section> instead. We assert the order against the next visible
    // landmark in the page after the search form, regardless of its tag,
    // to keep the spec assertion stable across page-template changes.
    const heroSection = page.locator('section').first();

    const headerY = (await header.boundingBox())!.y;
    const searchY = (await search.boundingBox())!.y;
    const slotY = (await heroSection.boundingBox())!.y;

    await expect(page.getByRole('region', { name: 'Barra de contacto' })).toHaveCount(0);
    expect(headerY).toBeLessThan(searchY);
    expect(searchY).toBeLessThan(slotY);
  });
});

test.describe('Search visibility & variant per page (search-bar-pages-scope)', () => {
  test('/productos shows a navy search bar WITHOUT the category select', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const response = await page.goto('/productos');
    expect(response?.status()).toBe(200);

    const search = page.getByRole('search', { name: 'Buscar productos' });
    await expect(search).toBeVisible();

    // Solid secondary wrapper, never the white wrapper or the old gradient.
    const wrapperClass = (await search.getAttribute('class')) ?? '';
    expect(wrapperClass).toContain('bg-secondary');
    expect(wrapperClass).not.toContain('bg-linear-to-r');
    expect(wrapperClass).not.toContain('from-secondary');
    expect(wrapperClass).not.toContain('bg-white');

    // The category <select> is hidden on /productos (own sidebar filter);
    // the input and BUSCAR button remain.
    await expect(search.getByRole('combobox')).toHaveCount(0);
    await expect(search.getByRole('searchbox')).toBeVisible();
    await expect(search.getByRole('button', { name: 'BUSCAR' })).toBeVisible();
  });

  test('/servicios renders the services page with the search bar (select visible)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const response = await page.goto('/servicios');
    expect(response?.status()).toBe(200);

    const search = page.getByRole('search', { name: 'Buscar productos' });
    await expect(search).toBeVisible();

    // The category <select> IS visible on /servicios (Layout defaults).
    await expect(search.getByRole('combobox')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Servicios especializados' }).first(),
    ).toBeVisible();
  });

  test('/representaciones renders WITHOUT a search bar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const response = await page.goto('/representaciones');
    expect(response?.status()).toBe(200);
    // representaciones.astro sets showSearch={false}: the search landmark is omitted.
    await expect(page.getByRole('search')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });

  test('/cotizacion renders WITHOUT a search bar (focused form page)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const response = await page.goto('/cotizacion');
    expect(response?.status()).toBe(200);

    // cotizacion.astro sets showSearch={false}: the search landmark is omitted.
    await expect(page.getByRole('search')).toHaveCount(0);
    // The form heading anchors the page.
    await expect(
      page.getByRole('heading', { name: 'Datos del Requerimiento' }),
    ).toBeVisible();
  });

  test('/productos/{slug} shows a navy search bar WITH the category select', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const response = await page.goto('/productos/mwn-medidor-industrial-agua-fria');
    expect(response?.status()).toBe(200);

    const search = page.getByRole('search', { name: 'Buscar productos' });
    await expect(search).toBeVisible();
    const wrapperClass = (await search.getAttribute('class')) ?? '';
    expect(wrapperClass).toContain('bg-secondary');
    expect(wrapperClass).not.toContain('bg-linear-to-r');
    expect(wrapperClass).not.toContain('from-secondary');

    // The category <select> IS visible on the product-detail page.
    await expect(search.getByRole('combobox')).toBeVisible();
  });
});

test.describe('SearchForm — md breakpoint width', () => {
  for (const viewport of [
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1204, height: 800 },
  ]) {
    test(`uses 90% of the viewport width and stays centered at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');

      const search = page.getByRole('search', { name: 'Buscar productos' });
      const container = search.locator('form').locator('xpath=..');
      const containerBox = await container.boundingBox();
      expect(containerBox).toBeTruthy();

      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const expectedWidth = clientWidth * 0.9;
      expect(Math.abs(containerBox!.width - expectedWidth)).toBeLessThanOrEqual(1);

      const leftGap = containerBox!.x;
      const rightGap = clientWidth - (containerBox!.x + containerBox!.width);
      expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(1);

      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(documentWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  }

  test('restores the 760px cap from xl (1280x800)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const search = page.getByRole('search', { name: 'Buscar productos' });
    const container = search.locator('form').locator('xpath=..');
    const containerBox = await container.boundingBox();
    expect(containerBox).toBeTruthy();
    expect(containerBox!.width).toBeLessThanOrEqual(761);
    expect(containerBox!.width).toBeGreaterThanOrEqual(759);

    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const leftGap = containerBox!.x;
    const rightGap = clientWidth - (containerBox!.x + containerBox!.width);
    expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(1);
  });
});
