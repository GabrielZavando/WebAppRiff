#!/usr/bin/env node
/**
 * Read-only marker check over the admin production bundle.
 *
 * The Angular build does NOT regenerate `src/environments/environment.production.ts`
 * (`apps/admin/package.json` defines `prebuild: sync-favicon.mjs` only), so a
 * bundle can be produced against the committed dev placeholders, against the
 * smoke values left behind by `scripts/check-bundle-env.mjs`, or against an
 * empty environment file. Any of those builds "compiles fine" and fails only
 * at runtime, in the browser.
 *
 * This script is the publication gate: it only READS the build output and
 * verifies that
 *   - no development or smoke marker appears in the bundle, and
 *   - the values injected in this run (API_BASE_URL and FIREBASE_API_KEY) do
 *     appear in it.
 *
 * It never regenerates nor modifies the environment file, so it is safe to run
 * right before an upload.
 *
 * Usage:
 *   npm run check:bundle --workspace=@riff/admin
 *   node apps/admin/scripts/check-bundle-markers.mjs
 *
 * Environment:
 *   API_BASE_URL      Expected base URL of the backend (required).
 *   FIREBASE_API_KEY  Expected Firebase web API key (required).
 *   ADMIN_DIST_DIR    Override of the build output directory (used by tests).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
const distDir = process.env['ADMIN_DIST_DIR']
  ? resolve(process.env['ADMIN_DIST_DIR'])
  : resolve(appRoot, 'dist/admin/browser');

const FORBIDDEN_MARKERS = ['dev-placeholder', 'bundle-smoke'];
const REQUIRED_VALUES = [
  { name: 'API_BASE_URL', value: process.env['API_BASE_URL'] },
  { name: 'FIREBASE_API_KEY', value: process.env['FIREBASE_API_KEY'] },
];

function fail(message) {
  console.error(`[check:bundle] ${message}`);
  process.exit(1);
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

if (!existsSync(distDir)) {
  fail(`Build output not found: ${distDir}. Run the production build first.`);
}

const missingVariables = REQUIRED_VALUES.filter(({ value }) => !value).map(
  ({ name }) => name,
);
if (missingVariables.length > 0) {
  fail(
    `Missing environment variable(s): ${missingVariables.join(', ')}. The checker needs the values injected in this run to verify the bundle.`,
  );
}

const forbiddenFound = [];
const requiredFound = new Set();

for (const filePath of walk(distDir)) {
  const content = readFileSync(filePath, 'utf-8');
  for (const marker of FORBIDDEN_MARKERS) {
    if (content.includes(marker)) {
      forbiddenFound.push(`${marker} (${filePath})`);
    }
  }
  for (const { name, value } of REQUIRED_VALUES) {
    if (content.includes(value)) {
      requiredFound.add(name);
    }
  }
}

if (forbiddenFound.length > 0) {
  fail(
    `the bundle contains environment marker(s): ${[...new Set(forbiddenFound)].join(', ')}. The build ran against a placeholder or smoke environment.`,
  );
}

const missingRequired = REQUIRED_VALUES.filter(
  ({ name }) => !requiredFound.has(name),
).map(({ name }) => name);
if (missingRequired.length > 0) {
  fail(
    `the bundle does not contain the injected value(s): ${missingRequired.join(', ')}. The build did not use the environment generated for this run.`,
  );
}

console.log(
  `[check:bundle] bundle OK: no environment markers, injected values present (${requiredFound.size}/${REQUIRED_VALUES.length})`,
);
