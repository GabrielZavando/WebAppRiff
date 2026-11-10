import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import NotFoundPage from '@/pages/404.astro';

/**
 * Contract of the public 404 page (change `hosting-litespeed-htaccess`).
 *
 * LiteSpeed serves the document declared by `ErrorDocument 404 /404.html`, so
 * Astro must generate a `404.html` at the root of the build output. The page
 * reuses the site layout (header, footer, design tokens) and offers the
 * visitor a way back to the home page.
 */
function webRoot(): string {
  const cwd = process.cwd();
  return existsSync(resolve(cwd, 'apps/web/package.json')) ? resolve(cwd, 'apps/web') : cwd;
}

async function render(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(NotFoundPage, {});
}

describe('public 404 page', () => {
  it('is a page component built with the site layout', () => {
    const source = readFileSync(
      resolve(webRoot(), 'src/pages/404.astro'),
      'utf-8',
    );
    expect(source).toContain("@/layouts/Layout.astro");
  });

  it('renders the 404 message with a link back to the home page', async () => {
    const html = await render();
    expect(html).toContain('404');
    expect(html).toMatch(/href="\/"/);
  });

  it('renders the shared site chrome', async () => {
    const html = await render();
    expect(html).toContain('<footer');
    expect(html).toContain('<header');
  });
});
