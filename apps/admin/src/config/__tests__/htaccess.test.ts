import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Contract of the LiteSpeed/cPanel `.htaccess` file of the admin panel
 * (change `hosting-litespeed-htaccess`).
 *
 * The shared hosting does not run nginx, so `apps/admin/src/.htaccess` is the
 * equivalent of `apps/admin/nginx.conf` and is published at the root of the
 * build through the `assets` configuration of `angular.json`. The tests pin the
 * security headers, the base CSP, the cache policy over the real build layout
 * (bundles in the root, fonts under `media/`), the SPA fallback and the parity
 * with the nginx contract.
 */
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';
const NO_CACHE = 'no-cache';

type AngularJson = {
  projects?: Record<
    string,
    {
      architect?: {
        build?: {
          options?: {
            assets?: Array<string | { glob?: string; input?: string; output?: string }>;
          };
        };
      };
    }
  >;
};

function adminRoot(): string {
  const cwd = process.cwd();
  return existsSync(resolve(cwd, 'apps/admin/package.json')) ? resolve(cwd, 'apps/admin') : cwd;
}

function readAdminFile(relativePath: string): string {
  const path = resolve(adminRoot(), relativePath);
  if (!existsSync(path)) {
    throw new Error(`${relativePath} not found at ${path}`);
  }
  return readFileSync(path, 'utf-8');
}

function htaccess(): string {
  return readAdminFile('src/.htaccess');
}

function nginxConf(): string {
  return readAdminFile('nginx.conf');
}

function angularJson(): AngularJson {
  return JSON.parse(readAdminFile('angular.json')) as AngularJson;
}

function buildAssets(): Array<string | { glob?: string; input?: string; output?: string }> {
  const cfg = angularJson();
  const projectName = Object.keys(cfg.projects ?? {})[0]!;
  return cfg.projects![projectName]!.architect!.build!.options!.assets ?? [];
}

function extractCsp(content: string): string | undefined {
  return content.match(/Content-Security-Policy\s+"([^"]+)"/)?.[1];
}

/** Directive lines only: comments may mention the forbidden directives. */
function stripComments(content: string): string {
  return content
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n');
}

describe('apps/admin — LiteSpeed .htaccess contract', () => {
  it('publishes a .htaccess with the security headers and the base CSP', () => {
    const content = htaccess();
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

  it('caches the hashed bundles and fonts immutably and the HTML without cache', () => {
    const content = htaccess();
    expect(content).toContain(IMMUTABLE_CACHE);
    expect(content).toContain(NO_CACHE);
    const filesMatch = content.match(/FilesMatch\s+"([^"]+)"/g) ?? [];
    expect(filesMatch.length).toBeGreaterThanOrEqual(2);
    expect(filesMatch.join(' ')).toMatch(/js/);
    expect(filesMatch.join(' ')).toMatch(/css/);
    expect(filesMatch.join(' ')).toMatch(/woff2/);
    expect(filesMatch.join(' ')).toMatch(/html/);
  });

  it('implements the SPA fallback to index.html', () => {
    const content = stripComments(htaccess());
    expect(content).toMatch(/RewriteEngine\s+On/);
    expect(content).toMatch(/RewriteCond\s+%\{REQUEST_FILENAME\}\s+!-f/);
    expect(content).toMatch(/RewriteCond\s+%\{REQUEST_FILENAME\}\s+!-d/);
    expect(content).toMatch(/RewriteRule\s+\.\s+\/index\.html/);
  });

  it('redirects HTTP traffic to HTTPS with a 301 before the SPA fallback', () => {
    const content = stripComments(htaccess());
    expect(content).toMatch(/RewriteEngine\s+On/);
    expect(content).toMatch(/RewriteCond\s+%\{HTTPS\}\s+!=on/);
    const redirect = content.match(
      /RewriteRule\s+\^\s+https:\/\/%\{HTTP_HOST\}%\{REQUEST_URI\}\s+\[R=301,L\]/,
    );
    expect(redirect, 'expected a 301 redirect to https').not.toBeNull();
    const fallback = content.match(/RewriteRule\s+\.\s+\/index\.html/);
    expect(fallback, 'expected the SPA fallback rule').not.toBeNull();
    expect(
      content.indexOf(redirect![0]),
      'the HTTPS redirect must be evaluated before the SPA fallback',
    ).toBeLessThan(content.indexOf(fallback![0]));
  });

  it('does not redirect the ACME challenge path', () => {
    const content = stripComments(htaccess());
    expect(content).toMatch(/RewriteCond[^\n]*acme-challenge/i);
  });

  it('avoids env-scoped headers, SetEnvIf and the Options directive', () => {
    const directives = stripComments(htaccess());
    expect(directives).not.toMatch(/env=/);
    expect(directives).not.toMatch(/SetEnvIf/i);
    expect(directives).not.toMatch(/^\s*Options\b/im);
  });

  it('keeps the CSP and the cache values in parity with nginx.conf', () => {
    expect(extractCsp(htaccess())).toBe(extractCsp(nginxConf()));
    expect(nginxConf()).toContain(IMMUTABLE_CACHE);
    expect(nginxConf()).toContain(NO_CACHE);
    expect(htaccess()).toContain(IMMUTABLE_CACHE);
    expect(htaccess()).toContain(NO_CACHE);
  });

  it('publishes the .htaccess at the root of the build through the angular assets', () => {
    const entry = buildAssets().find(
      (asset) =>
        typeof asset !== 'string' && asset.glob === '.htaccess' && asset.output === '/',
    );
    expect(entry, 'expected an assets entry with glob ".htaccess" and output "/"').toBeDefined();
  });

  it.skipIf(!existsSync(resolve(adminRoot(), 'dist/admin/browser')))(
    'ships the .htaccess in the build output (skipped without a build: the real dist verification runs with `npm run verify:htaccess`)',
    () => {
      const distRoot = resolve(adminRoot(), 'dist/admin/browser');
      const copiedPath = resolve(distRoot, '.htaccess');
      expect(existsSync(copiedPath)).toBe(true);
      expect(readFileSync(copiedPath, 'utf-8')).toBe(htaccess());
    },
  );
});
