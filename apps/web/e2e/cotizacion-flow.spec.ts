import { test, expect } from 'playwright/test';

/**
 * Critical flow: catalog → detail → quote form submission.
 *
 * The cotización form posts natively (HTML form, no JS) to the same-origin
 * API path `/api/v1/quotes`. In `astro preview` that route does not exist
 * (the site is static), so the e2e intercepts the POST with `page.route` and
 * asserts the exact payload shape the real backend expects (SC-107/SC-108).
 */
test.describe('Cotizacion flow (form submission)', () => {
  test('form renders all fields with submit button', async ({ page }) => {
    await page.goto('/cotizacion');
    await expect(page.locator('#cotizacion-nombre')).toBeVisible();
    await expect(page.locator('#cotizacion-email')).toBeVisible();
    await expect(page.locator('#cotizacion-telefono')).toBeVisible();
    await expect(page.locator('#cotizacion-empresa')).toBeVisible();
    await expect(page.locator('#cotizacion-rut')).toBeVisible();
    await expect(page.locator('#cotizacion-mensaje')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'ENVIAR SOLICITUD' }),
    ).toBeVisible();
  });

  test('submitting the form posts the expected payload to the API', async ({
    page,
  }) => {
    // Intercept the native form POST (the astro preview server cannot serve
    // POST to the API path).
    await page.route('**/api/v1/quotes', (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { id: 'quote-stub', estado: 'pendiente' },
          error: null,
          meta: {},
        }),
      });
    });

    await page.goto('/cotizacion');
    await page.fill('#cotizacion-nombre', 'Playwright Test');
    await page.fill('#cotizacion-email', 'playwright@example.com');
    await page.fill('#cotizacion-telefono', '+56912345678');
    await page.fill('#cotizacion-empresa', 'Playwright Corp');
    await page.fill('#cotizacion-rut', '11.111.111-1');
    await page.fill('#cotizacion-mensaje', 'Solicitud E2E de cotización');

    // Submit and wait for the intercepted request to inspect its payload.
    const [request] = await Promise.all([
      page.waitForRequest('**/api/v1/quotes'),
      page.getByRole('button', { name: 'ENVIAR SOLICITUD' }).click(),
    ]);

    // Native form POST was replaced by fetch (POST-APPLY form hardening,
    // commit ab1c030): the payload is sent as application/json to the
    // absolutely-resolved API action.
    const postData = request.postData() ?? '';
    const payload = JSON.parse(postData) as Record<string, string>;
    expect(payload['nombre']).toBe('Playwright Test');
    expect(payload['email']).toBe('playwright@example.com');
    expect(payload['telefono']).toBe('+56912345678');
    expect(payload['nombre_empresa']).toBe('Playwright Corp');
    expect(payload['rut']).toBe('11.111.111-1');
    expect(payload['mensaje']).toBe('Solicitud E2E de cotización');
  });

  test('HTML5 validation blocks submission when required fields are empty', async ({
    page,
  }) => {
    await page.goto('/cotizacion');

    // Click submit without filling anything; the browser should stay on the
    // page because `mensaje` / `nombre_empresa` etc. are required.
    await page.getByRole('button', { name: 'ENVIAR SOLICITUD' }).click();

    await expect(page).toHaveURL(/\/cotizacion/);
    // Form stays visible (no navigation occurred). The form is identified by
    // its stable id (`#cotizacion-form`) — the hardened form resolves its
    // action into an absolute API URL (not the raw `/api/v1/quotes` path).
    await expect(page.locator('#cotizacion-form')).toBeVisible();
  });
});
