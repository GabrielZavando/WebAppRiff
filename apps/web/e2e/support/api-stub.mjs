/**
 * Minimal stub API server for the web e2e suite (Playwright webServer).
 *
 * Serves the build-time catalog endpoints from `../fixtures/api-data.json`
 * in the same `{ data, error, meta }` envelope as the real NestJS backend,
 * so `astro build` bakes a non-empty catalog without a real Firebase backend.
 *
 * Zero dependencies (Node `http` only). Listens on port 3001 by default.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PORT = Number(process.env.STUB_API_PORT ?? 3001);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'api-data.json');

let data;

async function loadFixture() {
  if (!data) {
    data = JSON.parse(await readFile(FIXTURE_PATH, 'utf8'));
  }
  return data;
}

function envelope(payload, meta = {}) {
  return { data: payload, error: null, meta: { timestamp: new Date().toISOString(), ...meta } };
}

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(json);
}

export function createStubApiServer() {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    const fixture = await loadFixture();

    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, { status: 'ok', firebase: 'up' });
    }

    if (req.method === 'GET' && url.pathname === '/api/v1/products') {
      const page = Number(url.searchParams.get('page') ?? 1);
      const limit = Math.min(Number(url.searchParams.get('limit') ?? 24), 100);
      const start = (page - 1) * limit;
      const all = fixture.products;
      return sendJson(res, 200, envelope(all.slice(start, start + limit)));
    }

    const slugMatch = url.pathname.match(/^\/api\/v1\/products\/slug\/(.+)$/);
    if (req.method === 'GET' && slugMatch) {
      const product = fixture.products.find((p) => p.slug === slugMatch[1]);
      if (product) {
        return sendJson(res, 200, envelope(product));
      }
      return sendJson(res, 404, envelope(null));
    }

    if (req.method === 'GET' && url.pathname === '/api/v1/categories') {
      return sendJson(res, 200, envelope(fixture.categories));
    }

    if (req.method === 'GET' && url.pathname === '/api/v1/subcategories') {
      return sendJson(res, 200, envelope(fixture.subcategories));
    }

    if (req.method === 'POST' && url.pathname === '/api/v1/quotes') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        let parsed = {};
        try {
          parsed = JSON.parse(body || '{}');
        } catch {
          return sendJson(res, 400, { data: null, error: { code: 'BAD_JSON', message: 'Invalid JSON body' }, meta: {} });
        }
        // Mirror the real DTO contract: nombre, email, nombre_empresa, mensaje required.
        const missing = ['nombre', 'email', 'nombre_empresa', 'mensaje'].filter((f) => !parsed[f]);
        if (missing.length > 0) {
          return sendJson(res, 400, {
            data: null,
            error: { code: 'VALIDATION', message: `Missing required fields: ${missing.join(', ')}` },
            meta: {},
          });
        }
        return sendJson(
          res,
          201,
          envelope({
            id: `quote-stub-${Date.now()}`,
            ...parsed,
            estado: 'pendiente',
            creadoEn: new Date().toISOString(),
          }),
        );
      });
      return;
    }

    return sendJson(res, 404, envelope(null, { path: url.pathname }));
  });
}

// Direct execution (Playwright webServer): start listening.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  createStubApiServer().listen(PORT, () => {
    console.log(`[api-stub] listening on http://localhost:${PORT}`);
  });
}
