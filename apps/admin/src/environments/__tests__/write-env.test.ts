import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = resolve(__dirname, '../../../scripts/write-env.mjs');

/** Runs the generator against an isolated app root (WRITE_ENV_ROOT hook). */
function runScript(args: string[], envVars: Record<string, string> = {}): {
  root: string;
  status: number;
} {
  const root = mkdtempSync(resolve(tmpdir(), 'write-env-'));
  mkdirSync(resolve(root, 'src/environments'), { recursive: true });

  // Strip any FIREBASE_*/API_BASE_URL inherited from the outer environment so
  // each case controls its own inputs.
  const env: Record<string, string> = { ...process.env, WRITE_ENV_ROOT: root };
  for (const key of Object.keys(env)) {
    if (/^(FIREBASE_|API_BASE_URL)/.test(key)) {
      delete env[key];
    }
  }
  Object.assign(env, envVars);

  let status = 0;
  try {
    execFileSync('node', [SCRIPT, ...args], { env, stdio: 'pipe' });
  } catch (error) {
    status = (error as { status?: number }).status ?? 1;
  }
  return { root, status };
}

const localPath = (root: string): string =>
  resolve(root, 'src/environments/environment.development.local.ts');
const prodPath = (root: string): string =>
  resolve(root, 'src/environments/environment.production.ts');

afterEach(() => {
  // Temp roots live under /tmp; no repo files are touched by these tests.
});

describe('write-env.mjs — dev credentials flow (fix 2)', () => {
  it('default target generates environment.production.ts with fallbacks + warnings', () => {
    const { root } = runScript([]);
    const content = readFileSync(prodPath(root), 'utf-8');

    expect(content).toContain("apiKey: ''");
    expect(content).toContain("apiBaseUrl: 'http://localhost:3000/api/v1'");
    expect(existsSync(localPath(root))).toBe(false);
  });

  it('--target=dev --if-missing bootstraps with the safe dev placeholders', () => {
    const { root } = runScript(['--target=dev', '--if-missing']);
    const content = readFileSync(localPath(root), 'utf-8');

    // An empty apiKey would crash `getAuth()` at bootstrap (auth/invalid-api-key),
    // so the automatic bootstrap uses the committed dev placeholder values.
    expect(content).toContain("apiKey: 'dev-placeholder-api-key'");
    expect(content).toContain("apiBaseUrl: 'http://localhost:3000/api/v1'");
  });

  it('--if-missing never overwrites an existing dev local file', () => {
    const { root } = runScript(['--target=dev', '--if-missing']);
    const sentinel = readFileSync(localPath(root), 'utf-8').replace(
      'dev-placeholder-api-key',
      'my-real-dev-key',
    );
    writeFileSync(localPath(root), sentinel, 'utf-8');

    runScript(['--target=dev', '--if-missing'], { FIREBASE_API_KEY: 'should-not-appear' });

    expect(readFileSync(localPath(root), 'utf-8')).toContain('my-real-dev-key');
    expect(readFileSync(localPath(root), 'utf-8')).not.toContain('should-not-appear');
  });

  it('--target=dev (manual) writes real values when the vars are present', () => {
    const { root } = runScript(['--target=dev'], {
      FIREBASE_API_KEY: 'AIza-real-dev-key',
      FIREBASE_AUTH_DOMAIN: 'dev.example.com',
      FIREBASE_PROJECT_ID: 'dev-project',
      FIREBASE_APP_ID: '1:1:web:abc',
      API_BASE_URL: 'http://localhost:3000/api/v1',
    });

    const content = readFileSync(localPath(root), 'utf-8');
    expect(content).toContain("apiKey: 'AIza-real-dev-key'");
    expect(content).toContain("authDomain: 'dev.example.com'");
  });

  it('--target=dev (manual) with missing vars writes empty values + warnings', () => {
    const { root } = runScript(['--target=dev']);
    const content = readFileSync(localPath(root), 'utf-8');

    expect(content).toContain("apiKey: ''");
  });

  it('rejects an unknown --target value', () => {
    const { status } = runScript(['--target=staging']);
    expect(status).not.toBe(0);
  });
});
