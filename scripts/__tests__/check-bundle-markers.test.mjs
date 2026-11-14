import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const checkerPath = resolve(repoRoot, 'apps/admin/scripts/check-bundle-markers.mjs');

const API_BASE_URL = 'https://riff-api-staging.example.run.app/api/v1';
const FIREBASE_API_KEY = 'AIza-test-key';

const runChecker = (distDir, env = {}) => {
  try {
    const stdout = execFileSync('node', [checkerPath], {
      env: {
        ...process.env,
        ADMIN_DIST_DIR: distDir,
        API_BASE_URL,
        FIREBASE_API_KEY,
        ...env,
      },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    return {
      status: error.status ?? 1,
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
    };
  }
};

const createDist = (files) => {
  const dist = mkdtempSync(join(tmpdir(), 'admin-bundle-'));
  mkdirSync(join(dist, 'media'), { recursive: true });
  for (const [relativePath, content] of Object.entries(files)) {
    writeFileSync(join(dist, relativePath), content);
  }
  return dist;
};

describe('check-bundle-markers script', () => {
  it('declares the script', () => {
    expect(() => execFileSync('node', [checkerPath, '--help'])).toThrow();
  });

  it('fails when the bundle contains a development placeholder', () => {
    const dist = createDist({
      'main-ABC.js': `const key = 'dev-placeholder-api-key'; const url = '${API_BASE_URL}';`,
    });
    const result = runChecker(dist);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('dev-placeholder');
    expect(result.stderr).toContain('main-ABC.js');
  });

  it('fails when the bundle contains smoke values', () => {
    const dist = createDist({
      'main-ABC.js': `const key = '${FIREBASE_API_KEY}'; const url = 'https://bundle-smoke.example.com/api/v1';`,
    });
    const result = runChecker(dist);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('bundle-smoke');
  });

  it('fails when the injected values are absent from the bundle', () => {
    const dist = createDist({ 'main-ABC.js': 'console.log("nothing injected");' });
    const result = runChecker(dist);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('API_BASE_URL');
  });

  it('fails when the build output does not exist', () => {
    const result = runChecker(join(tmpdir(), 'admin-bundle-missing-'));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/not found|Build output/i);
  });

  it('passes with a coherent bundle', () => {
    const dist = createDist({
      'main-ABC.js': `const key = '${FIREBASE_API_KEY}'; const url = '${API_BASE_URL}';`,
      'index.html': '<app-root></app-root>',
    });
    const result = runChecker(dist);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('bundle');
  });
});
