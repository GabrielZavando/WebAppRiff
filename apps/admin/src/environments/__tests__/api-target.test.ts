import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Port coherence between the admin panel and the backend (fix: backend runs
 * on :3000 — `apps/backend/src/config/port.ts` `resolvePort` default and
 * `PORT=3000` in `apps/backend/.env`, which is gitignored).
 *
 * The expected port is resolved the same way the backend does it: read
 * `PORT` from the backend `.env` when the file exists locally, otherwise
 * fall back to the documented default (3000).
 */
function backendPort(): number {
  const envPath = resolve(__dirname, '../../../../backend/.env');
  if (!existsSync(envPath)) {
    return 3000;
  }
  const match = readFileSync(envPath, 'utf-8').match(/^PORT=(\d+)\s*$/m);
  return match === null ? 3000 : Number(match[1]);
}

describe('API base URL coherence with the backend port', () => {
  const expected = `http://localhost:${backendPort()}/api/v1`;

  it.each([
    ['environment.ts placeholder', '../environment.ts'],
    ['environment.development.example.ts committed defaults', '../environment.development.example.ts'],
  ])('%s uses the backend port', (_name, file) => {
    const source = readFileSync(resolve(__dirname, file), 'utf-8');
    expect(source).toContain(`apiBaseUrl: '${expected}'`);
  });

  it('the write-env fallback uses the backend port', () => {
    const script = readFileSync(resolve(__dirname, '../../../scripts/write-env.mjs'), 'utf-8');
    expect(script).toContain(`API_BASE_URL: '${expected}'`);
    expect(script).not.toContain('8080');
  });
});
