/**
 * Bundle regression smoke (design D6, change deploy-docker-hardening).
 *
 * Detects a regression of the Bug 1 class: a production bundle that was built
 * against the committed dev placeholders of `src/environments/environment.ts`
 * instead of the generated `environment.production.ts` (i.e. the build ran
 * without the env file being generated first).
 *
 * Flow:
 * 1. Force test values into the environment and regenerate the gitignored
 *    `environment.production.ts` via scripts/write-env.mjs --target=prod.
 *    NOTE: this OVERWRITES the generated file with smoke values (it is a
 *    generated, gitignored file — regenerate your real one with
 *    `npm run env:write --workspace=@riff/admin` afterwards if needed).
 * 2. Run the production build (`ng build`, production is this app's default).
 * 3. Scan dist/admin/browser:
 *    - the committed placeholder `dev-placeholder-api-key` must NOT appear;
 *    - the injected smoke values MUST appear (api key + API base URL).
 *
 * Usage: npm run test:build --workspace=@riff/admin
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');

const SMOKE_VALUES = {
  FIREBASE_API_KEY: 'bundle-smoke-api-key',
  FIREBASE_AUTH_DOMAIN: 'bundle-smoke.firebaseapp.com',
  FIREBASE_PROJECT_ID: 'bundle-smoke-project',
  FIREBASE_APP_ID: 'bundle-smoke-app',
  API_BASE_URL: 'https://bundle-smoke.example.com/api/v1',
};

const FORBIDDEN_MARKERS = ['dev-placeholder-api-key'];
const REQUIRED_MARKERS = [
  SMOKE_VALUES.FIREBASE_API_KEY,
  SMOKE_VALUES.API_BASE_URL,
];

function fail(message) {
  console.error(`❌ [test:build] ${message}`);
  process.exit(1);
}

function run(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: appRoot,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    fail(`"${command} ${args.join(' ')}" failed with exit code ${result.status}`);
  }
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}

console.log('[test:build] regenerating environment.production.ts with smoke values...');
run('node', ['scripts/write-env.mjs', '--target=prod'], SMOKE_VALUES);

console.log('[test:build] running production build...');
run('npm', ['run', 'build'], {});

const distDir = resolve(appRoot, 'dist/admin/browser');
const foundForbidden = new Set();
const foundRequired = new Set();

for (const filePath of walk(distDir)) {
  const content = readFileSync(filePath, 'utf-8');
  for (const marker of FORBIDDEN_MARKERS) {
    if (content.includes(marker)) foundForbidden.add(`${marker} (${filePath})`);
  }
  for (const marker of REQUIRED_MARKERS) {
    if (content.includes(marker)) foundRequired.add(marker);
  }
}

if (foundForbidden.size > 0) {
  fail(`bundle uses committed dev placeholders (environment replacement failed?): ${[...foundForbidden].join(', ')}`);
}
const missingRequired = REQUIRED_MARKERS.filter((marker) => !foundRequired.has(marker));
if (missingRequired.length > 0) {
  fail(`bundle does not contain the injected smoke values: ${missingRequired.join(', ')}`);
}

console.log(`✅ [test:build] bundle OK: no dev placeholders, injected values present (${foundRequired.size}/${REQUIRED_MARKERS.length} markers)`);
