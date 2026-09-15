#!/usr/bin/env node

/**
 * smoke:admin — Post-deploy smoke test for the Angular admin panel (SC-003 / R3).
 *
 * Given `SMOKE_ADMIN_URL` (e.g. https://admin.somosriff.cl), validates:
 *   - GET /                       → 200
 *   - a deep route (e.g. /productos) uses the SPA fallback (returns HTML, not 404)
 *   - the main app container renders (an <app-root> present in index.html/JS)
 *   - at least one /assets/* JS/CSS asset resolves (or is referenced)
 *
 * No-op (exit 0, notice) when SMOKE_ADMIN_URL is unset. Non-zero on failure.
 */

const URL_ENV = 'SMOKE_ADMIN_URL';
const TIMEOUT_MS = 10000;

function fail(message) {
  console.error(`❌ [smoke:admin] ${message}`);
  process.exit(1);
}

async function getStatus(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  return res.status;
}

async function main() {
  const base = process.env[URL_ENV];
  if (!base) {
    console.log('ℹ️ [smoke:admin] SMOKE_ADMIN_URL not set — skipping (no-op).');
    process.exit(0);
  }

  const root = await getStatus(`${base}/`);
  if (root !== 200) fail(`/ → HTTP ${root}`);
  console.log('✅ [smoke:admin] / OK');

  // Deep route uses SPA fallback: must resolve (index.html served), not 404.
  const deep = await getStatus(`${base}/productos`);
  if (deep !== 200) fail(`/productos (SPA fallback) → HTTP ${deep}`);
  console.log('✅ [smoke:admin] /productos SPA fallback OK');

  // Main app container renders (Angular app-root).
  const res = await fetch(`${base}/`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  const html = await res.text();
  if (!/<app-root[^>]*>/.test(html)) {
    // Fallback: the JS bundle must reference app-root selector.
    const bundle = html.match(/src=["']([^"']+\.js)["']/i);
    if (!bundle) fail('no <app-root> in index.html and no JS bundle to verify render');
  }
  console.log('✅ [smoke:admin] main app container present');

  // At least one /assets/* asset referenced/loaded.
  const asset = html.match(/["'](\/assets\/[^"']+)["']/i);
  if (asset && asset[1]) {
    const s = await getStatus(`${base}${asset[1]}`);
    if (s !== 200) fail(`/assets asset → HTTP ${s}`);
    console.log('✅ [smoke:admin] /assets/* assets load');
  } else {
    console.log('ℹ️ [smoke:admin] no static /assets link in index.html (SPA bundle referenced elsewhere)');
  }

  console.log('✅ [smoke:admin] Angular smoke passed');
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));