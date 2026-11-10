#!/usr/bin/env node
/**
 * Verifies the LiteSpeed contract of the admin panel against the build output.
 *
 * The `.htaccess` travels to the shared hosting inside the build output, so
 * this script asserts that the build output really carries it at the document
 * root and that its content matches the contract: security headers, base CSP,
 * cache policy and the SPA fallback.
 *
 * Run with: npm run verify:htaccess --workspace=@riff/admin
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = resolve(appRoot, 'dist/admin/browser');

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

if (!existsSync(distRoot)) {
  console.error(`Build output not found: ${distRoot}`);
  console.error('Run `npm run build --workspace=@riff/admin` before verifying.');
  process.exit(1);
}

const target = resolve(distRoot, '.htaccess');
const content = readIfExists(target);

check(content !== null, `missing ${target}`);

if (content !== null) {
  const directives = stripComments(content);
  check(
    content.includes('X-Content-Type-Options') && content.includes('nosniff'),
    '.htaccess must set X-Content-Type-Options: nosniff',
  );
  check(
    content.includes('X-Frame-Options') && content.includes('DENY'),
    '.htaccess must set X-Frame-Options: DENY',
  );
  check(
    content.includes('Referrer-Policy') && content.includes('strict-origin-when-cross-origin'),
    '.htaccess must set Referrer-Policy: strict-origin-when-cross-origin',
  );
  check(content.includes('Content-Security-Policy'), '.htaccess must set Content-Security-Policy');
  check(
    content.includes("font-src 'self' https: data:"),
    ".htaccess CSP must declare font-src 'self' https: data:",
  );
  check(content.includes(IMMUTABLE_CACHE), `.htaccess must set Cache-Control: ${IMMUTABLE_CACHE}`);
  check(content.includes(NO_CACHE), `.htaccess must set Cache-Control: ${NO_CACHE}`);
  check(/FilesMatch/.test(content), '.htaccess must scope the cache policy with FilesMatch');
  check(/RewriteEngine\s+On/.test(directives), '.htaccess must enable the rewrite engine');
  check(
    /RewriteCond\s+%\{HTTPS\}\s+!=on/.test(directives),
    '.htaccess must redirect only the requests served over HTTP',
  );
  const redirectRule = directives.match(
    /RewriteRule\s+\^\s+https:\/\/%\{HTTP_HOST\}%\{REQUEST_URI\}\s+\[R=301,L\]/,
  );
  check(redirectRule !== null, '.htaccess must redirect HTTP to HTTPS with a 301');
  check(
    /RewriteCond[^\n]*acme-challenge/i.test(directives),
    '.htaccess must not redirect the ACME challenge path',
  );
  check(
    /RewriteCond\s+%\{REQUEST_FILENAME\}\s+!-f/.test(directives),
    '.htaccess must skip the SPA fallback for existing files',
  );
  check(
    /RewriteCond\s+%\{REQUEST_FILENAME\}\s+!-d/.test(directives),
    '.htaccess must skip the SPA fallback for existing directories',
  );
  const fallbackRule = directives.match(/RewriteRule\s+\.\s+\/index\.html/);
  check(fallbackRule !== null, '.htaccess must rewrite unknown routes to /index.html');
  if (redirectRule !== null && fallbackRule !== null) {
    check(
      directives.indexOf(redirectRule[0]) < directives.indexOf(fallbackRule[0]),
      'the HTTPS redirect must be evaluated before the SPA fallback',
    );
  }
  check(!/env=/.test(directives), '.htaccess must not use env-scoped headers');
  check(!/SetEnvIf/i.test(directives), '.htaccess must not use SetEnvIf');
  check(!/^\s*Options\b/im.test(directives), '.htaccess must not use the Options directive');

  const source = readIfExists(resolve(appRoot, 'src/.htaccess'));
  check(source !== null && source === content, 'dist/.htaccess differs from src/.htaccess');
}

if (failures.length > 0) {
  console.error('LiteSpeed .htaccess verification failed:');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exit(1);
}

console.log('LiteSpeed .htaccess verification passed (dist/admin/browser/.htaccess)');
