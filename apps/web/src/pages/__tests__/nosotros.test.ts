import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import NosotrosPage from '@/pages/nosotros.astro';

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

async function render(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(NosotrosPage, {});
}

describe('Nosotros page composition (SC-108, SC-109)', () => {
  it('renders the shared chrome: exactly one <header> landmark and the site <footer> (SC-108)', async () => {
    const html = await render();
    const clean = stripComments(html);
    const headerCount = (clean.match(/<header/g) ?? []).length;
    expect(headerCount).toBe(1);
    expect(clean).toContain('<footer');
    // Shared chrome is present: the main nav landmark renders inside the Header.
    expect(clean).toContain('Navegación principal');
  });

  it('has no intermediate content: empty main, no hero image and no search form (SC-109)', async () => {
    const html = await render();
    const clean = stripComments(html);
    // No hero shell (Layout hero=false → no full-bleed Picture overlay).
    expect(clean).not.toContain('banner_home');
    // No global search form (showSearch=false).
    expect(clean).not.toContain('role="search"');
    // No content sections in the middle slot.
    expect(clean).not.toContain('<section');
    // The main slot is present and empty.
    const mainMatch = clean.match(/<main[^>]*>([\s\S]*?)<\/main>/);
    if (!mainMatch) throw new Error('<main> not found');
    const mainContent = mainMatch[1] ?? '';
    expect(mainContent.trim()).toBe('');
  });
});