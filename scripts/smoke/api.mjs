#!/usr/bin/env node

/**
 * smoke:api — Post-deploy API smoke test (SC-001 / R1).
 *
 * Given `SMOKE_API_URL` (e.g. https://<run>.run.app), validates:
 *   - GET /health            → 200, `status` healthy, `firebase` == "up"
 *   - GET /api/v1/products   → 200 with a `data` array
 *   - GET /api/v1/categories → 200 with a `data` array
 *   - GET /api/v1/subcategories → 200 with a `data` array
 *
 * No-op (exit 0, notice) when SMOKE_API_URL is unset. Non-zero on any check
 * failure so the deploy pipeline stays red. No secrets — only the base URL.
 */

const URL_ENV = 'SMOKE_API_URL';
const TIMEOUT_MS = 10000;

function fail(message) {
  console.error(`❌ [smoke:api] ${message}`);
  process.exit(1);
}

async function getJson(base, path) {
  const res = await fetch(`${base}${path}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { accept: 'application/json' },
  });
  if (!res.ok) {
    fail(`${path} → HTTP ${res.status}`);
  }
  const json = await res.json().catch(() => {
    fail(`${path} → invalid JSON body`);
  });
  return json;
}

async function main() {
  const base = process.env[URL_ENV];
  if (!base) {
    console.log('ℹ️ [smoke:api] SMOKE_API_URL not set — skipping (no-op).');
    process.exit(0);
  }

  const health = await getJson(base, '/health');
  if (health.status !== 'ok' && health.status !== 'healthy') {
    fail(`/health → status is not healthy (got ${JSON.stringify(health.status)})`);
  }
  if (health.firebase !== 'up') {
    fail(`/health → firebase is not "up" (got ${JSON.stringify(health.firebase)})`);
  }
  console.log('✅ [smoke:api] /health OK (status healthy, firebase up)');

  for (const path of ['/api/v1/products', '/api/v1/categories', '/api/v1/subcategories']) {
    const json = await getJson(base, path);
    if (!Array.isArray(json.data)) {
      fail(`${path} → missing "data" array`);
    }
    console.log(`✅ [smoke:api] ${path} OK (${json.data.length} items)`);
  }

  console.log('✅ [smoke:api] API smoke passed');
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));