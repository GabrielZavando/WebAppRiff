import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Contract of the LiteSpeed/cPanel `.htaccess` files of the public site
 * (change `hosting-litespeed-htaccess`).
 *
 * The hosting shared account does not run nginx: the equivalent of
 * `apps/web/nginx.conf` is `apps/web/public/.htaccess` (document root) plus
 * `apps/web/public/_astro/.htaccess` (content-hashed assets). The tests pin
 * the security headers, the base CSP, the cache policy, the 404 error document
 * and the parity with the nginx contract, so the two cannot drift apart.
 */
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';
const NO_CACHE = 'no-cache';

function webRoot(): string {
  const cwd = process.cwd();
  return existsSync(resolve(cwd, 'apps/web/package.json')) ? resolve(cwd, 'apps/web') : cwd;
}

function readWebFile(relativePath: string): string {
  const path = resolve(webRoot(), relativePath);
  if (!existsSync(path)) {
    throw new Error(`${relativePath} not found at ${path}`);
  }
  return readFileSync(path, 'utf-8');
}

function rootHtaccess(): string {
  return readWebFile('public/.htaccess');
}

function astroHtaccess(): string {
  return readWebFile('public/_astro/.htaccess');
}

function nginxConf(): string {
  return readWebFile('nginx.conf');
}

function extractCsp(content: string): string | undefined {
  const match = content.match(
    /Content-Security-Policy\s+"([^"]+)"/,
  );
  return match?.[1];
}

/** Directive lines only: comments may mention the forbidden directives. */
function stripComments(content: string): string {
  return content
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n');
}

describe('apps/web — LiteSpeed .htaccess contract', () => {
  it('publishes a root .htaccess with the security headers and the base CSP', () => {
    const content = rootHtaccess();
    expect(content).toContain('X-Content-Type-Options');
    expect(content).toContain('nosniff');
    expect(content).toContain('X-Frame-Options');
    expect(content).toContain('DENY');
    expect(content).toContain('Referrer-Policy');
    expect(content).toContain('strict-origin-when-cross-origin');
    const csp = extractCsp(content);
    expect(csp, 'expected a Content-Security-Policy directive').toBeDefined();
    expect(csp).toContain("font-src 'self' https: data:");
  });

  it('publishes a nested .htaccess with the immutable cache for hashed assets', () => {
    const content = astroHtaccess();
    expect(content).toContain(IMMUTABLE_CACHE);
    expect(content).toMatch(/FilesMatch/);
  });

  it('serves HTML without cache and points the 404 error to the generated document', () => {
    const content = rootHtaccess();
    expect(content).toContain(NO_CACHE);
    expect(content).toContain('ErrorDocument 404 /404.html');
  });

  it('does not implement an SPA fallback (the public site is an MPA)', () => {
    const content = stripComments(rootHtaccess());
    expect(content).not.toMatch(/RewriteRule[^\n]*index\.html/i);
  });

  it('redirects HTTP traffic to HTTPS with a 301', () => {
    const content = stripComments(rootHtaccess());
    expect(content).toMatch(/RewriteEngine\s+On/);
    expect(content).toMatch(/RewriteCond\s+%\{HTTPS\}\s+!=on/);
    expect(content).toMatch(
      /RewriteRule\s+\^\s+https:\/\/%\{HTTP_HOST\}%\{REQUEST_URI\}\s+\[R=301,L\]/,
    );
  });

  it('does not redirect the ACME challenge path', () => {
    const content = stripComments(rootHtaccess());
    expect(content).toMatch(/RewriteCond[^\n]*acme-challenge/i);
  });

  it('avoids env-scoped headers, SetEnvIf and the Options directive', () => {
    for (const content of [rootHtaccess(), astroHtaccess()]) {
      const directives = stripComments(content);
      expect(directives).not.toMatch(/env=/);
      expect(directives).not.toMatch(/SetEnvIf/i);
      expect(directives).not.toMatch(/^\s*Options\b/im);
    }
  });

  it('keeps the CSP and the cache values in parity with nginx.conf', () => {
    const cspHtaccess = extractCsp(rootHtaccess());
    const cspNginx = extractCsp(nginxConf());
    expect(cspHtaccess).toBeDefined();
    expect(cspHtaccess).toBe(cspNginx);
    const htaccessSet = `${rootHtaccess()}\n${astroHtaccess()}`;
    expect(nginxConf()).toContain(IMMUTABLE_CACHE);
    expect(nginxConf()).toContain(NO_CACHE);
    expect(htaccessSet).toContain(IMMUTABLE_CACHE);
    expect(htaccessSet).toContain(NO_CACHE);
    expect(rootHtaccess()).toContain(NO_CACHE);
    expect(astroHtaccess()).toContain(IMMUTABLE_CACHE);
  });

  it.skipIf(!existsSync(resolve(webRoot(), 'dist')))(
    'ships the .htaccess files in the build output (skipped without a build: the real dist verification runs with `npm run verify:htaccess`)',
    () => {
      const distRoot = resolve(webRoot(), 'dist');
      expect(existsSync(resolve(distRoot, '.htaccess'))).toBe(true);
      expect(existsSync(resolve(distRoot, '_astro/.htaccess'))).toBe(true);
      const copied = readFileSync(resolve(distRoot, '.htaccess'), 'utf-8');
      expect(copied).toBe(rootHtaccess());
    },
  );
});
