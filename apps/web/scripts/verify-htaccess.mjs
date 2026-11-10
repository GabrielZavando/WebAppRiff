#!/usr/bin/env node
/**
 * Verifies the LiteSpeed contract of the public site against the build output.
 *
 * The `.htaccess` files travel to the shared hosting inside `dist/`, so this
 * script asserts that the build output really carries them and that their
 * content matches the contract: security headers, base CSP, cache policy and
 * the 404 error document.
 *
 * Run with: npm run verify:htaccess --workspace=@riff/web
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = resolve(appRoot, 'dist');

const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';
const NO_CACHE = 'no-cache';

const failures = [];

function check(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function readIfExists(path) {
  if (!existsSync(path)) {
    return null;
  }
  return readFileSync(path, 'utf-8');
}

/** Directive lines only: comments may mention the forbidden directives. */
function stripComments(content) {
  return content
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n');
}

const rootPath = resolve(distRoot, '.htaccess');
const astroPath = resolve(distRoot, '_astro/.htaccess');

if (!existsSync(distRoot)) {
  console.error(`Build output not found: ${distRoot}`);
  console.error('Run `npm run build --workspace=@riff/web` before verifying.');
  process.exit(1);
}

const rootHtaccess = readIfExists(rootPath);
const astroHtaccess = readIfExists(astroPath);

check(rootHtaccess !== null, `missing ${rootPath}`);
check(astroHtaccess !== null, `missing ${astroPath}`);

if (rootHtaccess !== null) {
  check(
    rootHtaccess.includes('X-Content-Type-Options') && rootHtaccess.includes('nosniff'),
    'root .htaccess must set X-Content-Type-Options: nosniff',
  );
  check(
    rootHtaccess.includes('X-Frame-Options') && rootHtaccess.includes('DENY'),
    'root .htaccess must set X-Frame-Options: DENY',
  );
  check(
    rootHtaccess.includes('Referrer-Policy') &&
      rootHtaccess.includes('strict-origin-when-cross-origin'),
    'root .htaccess must set Referrer-Policy: strict-origin-when-cross-origin',
  );
  check(
    rootHtaccess.includes('Content-Security-Policy'),
    'root .htaccess must set Content-Security-Policy',
  );
  check(
    rootHtaccess.includes("font-src 'self' https: data:"),
    "root .htaccess CSP must declare font-src 'self' https: data:",
  );
  check(rootHtaccess.includes(NO_CACHE), `root .htaccess must set Cache-Control: ${NO_CACHE}`);
  check(
    rootHtaccess.includes('ErrorDocument 404 /404.html'),
    'root .htaccess must map the 404 error to /404.html',
  );
  const rootDirectives = stripComments(rootHtaccess);
  check(!/env=/.test(rootDirectives), 'root .htaccess must not use env-scoped headers');
  check(!/SetEnvIf/i.test(rootDirectives), 'root .htaccess must not use SetEnvIf');
  check(!/^\s*Options\b/im.test(rootDirectives), 'root .htaccess must not use the Options directive');
  check(
    !/RewriteRule[^\n]*index\.html/i.test(rootDirectives),
    'root .htaccess must not implement an SPA fallback',
  );
  check(
    /RewriteCond\s+%\{HTTPS\}\s+!=on/.test(rootDirectives),
    'root .htaccess must redirect only the requests served over HTTP',
  );
  check(
    /RewriteRule\s+\^\s+https:\/\/%\{HTTP_HOST\}%\{REQUEST_URI\}\s+\[R=301,L\]/.test(rootDirectives),
    'root .htaccess must redirect HTTP to HTTPS with a 301',
  );
  check(
    /RewriteCond[^\n]*acme-challenge/i.test(rootDirectives),
    'root .htaccess must not redirect the ACME challenge path',
  );

  const source = readIfExists(resolve(appRoot, 'public/.htaccess'));
  check(
    source !== null && source === rootHtaccess,
    'dist/.htaccess differs from public/.htaccess',
  );
}

if (astroHtaccess !== null) {
  check(
    astroHtaccess.includes(IMMUTABLE_CACHE),
    `_astro/.htaccess must set Cache-Control: ${IMMUTABLE_CACHE}`,
  );
  check(
    /FilesMatch/.test(astroHtaccess),
    '_astro/.htaccess must scope the cache rule with FilesMatch',
  );
  const astroDirectives = stripComments(astroHtaccess);
  check(!/env=/.test(astroDirectives), '_astro/.htaccess must not use env-scoped headers');
  check(!/SetEnvIf/i.test(astroDirectives), '_astro/.htaccess must not use SetEnvIf');
  check(
    !/^\s*Options\b/im.test(astroDirectives),
    '_astro/.htaccess must not use the Options directive',
  );

  const source = readIfExists(resolve(appRoot, 'public/_astro/.htaccess'));
  check(
    source !== null && source === astroHtaccess,
    'dist/_astro/.htaccess differs from public/_astro/.htaccess',
  );
}

if (failures.length > 0) {
  console.error('LiteSpeed .htaccess verification failed:');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log('LiteSpeed .htaccess verification passed (dist/.htaccess, dist/_astro/.htaccess)');
