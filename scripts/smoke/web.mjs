#!/usr/bin/env node

/**
 * smoke:web — Post-deploy smoke test for the Astro public site (SC-002 / R2).
 *
 * Given `SMOKE_WEB_URL` (e.g. https://staging.somosriff.cl), validates:
 *   - GET /                      → 200
 *   - GET /productos             → 200
 *   - at least one published product (a valid /productos/{slug} → 200)
 *   - at least one /_astro/* asset resolves
 *
 * No-op (exit 0, notice) when SMOKE_WEB_URL is unset. Non-zero on any failure.
 */

const URL_ENV = 'SMOKE_WEB_URL';
const TIMEOUT_MS = 10000;

function fail(message) {
  console.error(`❌ [smoke:web] ${message}`);
  process.exit(1);
}

async function getStatus(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  return res.status;
}

async function main() {
  const base = process.env[URL_ENV];
  if (!base) {
    console.log('ℹ️ [smoke:web] SMOKE_WEB_URL not set — skipping (no-op).');
    process.exit(0);
  }

  // Home
  const home = await getStatus(`${base}/`);
  if (home !== 200) fail(`/ → HTTP ${home}`);
  console.log('✅ [smoke:web] / OK');

  // Products listing
  const list = await getStatus(`${base}/productos`);
  if (list !== 200) fail(`/productos → HTTP ${list}`);
  console.log('✅ [smoke:web] /productos OK');

  // Discover a published product detail from the listing HTML (first slug-like href).
  const res = await fetch(`${base}/productos`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  const html = await res.text();
  const match = html.match(
    /href=["']?\/productos\/([a-z0-9-]+)["']/i,
  );
  if (!match || !match[1]) {
    fail('no published product slug found in /productos (catalog may be empty)');
  }
  const slug = match[1];
  const detail = await getStatus(`${base}/productos/${slug}`);
  if (detail !== 200) fail(`/productos/${slug} → HTTP ${detail}`);
  console.log(`✅ [smoke:web] /productos/${slug} OK`);

  // At least one /_astro/ asset resolves.
  const assetMatch = html.match(/src=["'](\/_astro\/[^"']+)["']/i);
  if (!assetMatch || !assetMatch[1]) {
    // Asset URLs can be relative; try a pattern without leading slash base.
    const alt = html.match(/["'](\/_astro\/[^"']+)["']/i);
    if (!alt || !alt[1]) {
      fail('no /_astro/* asset found in HTML');
    }
  }
  const assetPath = assetMatch?.[1] ?? html.match(/["'](\/_astro\/[^"']+)["']/i)?.[1];
  const assetStatus = await getStatus(`${base}${assetPath}`);
  if (assetStatus !== 200) fail(`/_astro asset → HTTP ${assetStatus}`);
  console.log('✅ [smoke:web] /_astro/* assets load');

  console.log('✅ [smoke:web] Astro smoke passed');
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));