import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Layout from '@/layouts/Layout.astro';

async function renderHeroLayout(): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Layout, {
    props: {
      title: 'Riff Catálogo Digital',
      hero: true,
    },
  });
  // Strip HTML comments and <style>/<script> blocks so `<header>` text inside
  // component inline comments does not produce false-positive landmark counts.
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '');
}

async function renderDefaultLayout(): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Layout, {
    props: { title: 'Riff Catálogo Digital' },
  });
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '');
}

describe('Layout — hero shell (home full-viewport background)', () => {
  it('in hero mode renders a full-viewport wrapper with horizontal-only clipping', async () => {
    const html = await renderHeroLayout();
    // The hero shell wraps the whole document body; locate the <body class> area.
    expect(html).toContain('min-h-screen');
    // Horizontal clip only: `overflow-x-hidden` keeps the full-bleed picture
    // from creating a horizontal scrollbar without disabling vertical page
    // scrolling. `overflow-hidden` (both axes) would clip the content below
    // the fold (PanelHome) — explicitly forbidden by home-hero-shell spec.
    expect(html).toContain('overflow-x-hidden');
    expect(html).not.toContain('overflow-hidden');
  });

  it('in hero mode renders the banner <picture> with AVIF/WebP source variants', async () => {
    const html = await renderHeroLayout();
    expect(html).toMatch(/<picture[\s\S]*?<\/picture>/);
    const sourceTypes = [...html.matchAll(/<source[^>]*type="([^"]+)"/g)].map((m) => m[1]);
    expect(sourceTypes).toContain('image/avif');
    expect(sourceTypes).toContain('image/webp');
    // The image src must reference the real banner_home asset
    expect(html).toContain('banner_home');
  });

  it('in hero mode renders the decorative overlay with bg-secondary/80 and aria-hidden', async () => {
    const html = await renderHeroLayout();
    expect(html).toMatch(/<div[^>]*class="[^"]*absolute inset-0 bg-secondary\/80[^"]*"[^>]*aria-hidden="true"/);
    expect(html).not.toContain('bg-secondary/60');
    expect(html).not.toMatch(/class="[^"]*\bbg-black\//);
  });

  it('in hero mode wraps the page contents in a relative z-10 layer', async () => {
    const html = await renderHeroLayout();
    expect(html).toMatch(/class="[^"]*relative z-10[^"]*"/);
  });

  it('keeps exactly one <header> landmark in the document (single-header rule)', async () => {
    // Spec: home-hero-shell § "The three header components are inside the
    // z-10 stack" → "exactly one <header> element exists in the document".
    // TopHeader renders a role="region", SearchForm a role="search"; only the
    // site Header may render a <header> element.
    const html = await renderHeroLayout();
    const headerCount = (html.match(/<header[\s>]/g) ?? []).length;
    expect(headerCount).toBe(1);
  });
});

describe('Layout — default mode (no hero shell)', () => {
  it('does NOT render the banner picture or overlay when hero is not set', async () => {
    const html = await renderDefaultLayout();
    expect(html).not.toMatch(/<picture[\s\S]*?<\/picture>/);
    expect(html).not.toContain('bg-secondary/80');
    expect(html).not.toContain('banner_home');
  });
});

type LayoutSearchProps = {
  hero?: boolean;
  showSearch?: boolean;
  searchSecondary?: boolean;
  searchShowCategorySelect?: boolean;
};

async function renderLayout(props: LayoutSearchProps = {}): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Layout, {
    props: { title: 'Riff Catálogo Digital', ...props },
  });
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '');
}

function getSearchWrapperClass(html: string): string {
  const wrapper = html.match(/<div role="search"[^>]*>/)?.[0] ?? '';
  return wrapper.match(/class="([^"]*)"/)?.[1] ?? '';
}

describe('Layout — search visibility & variant (search-bar-pages-scope)', () => {
  it('omits the search landmark when showSearch is false', async () => {
    const html = await renderLayout({ showSearch: false });
    expect(html).not.toContain('role="search"');
  });

  it('renders the navy (header gradient) search wrapper when searchSecondary is true', async () => {
    const html = await renderLayout({ searchSecondary: true });
    const wrapperClass = getSearchWrapperClass(html);
    expect(wrapperClass).toContain('bg-linear-to-r');
    expect(wrapperClass).toContain('from-secondary');
    expect(wrapperClass).toContain('to-secondary-light');
    expect(wrapperClass).not.toContain('bg-secondary');
    expect(wrapperClass).not.toContain('bg-white');
  });

  it('renders the white search wrapper by default (searchSecondary false)', async () => {
    const html = await renderLayout({});
    const wrapperClass = getSearchWrapperClass(html);
    expect(wrapperClass).toContain('bg-white');
    expect(wrapperClass).not.toContain('bg-secondary');
    expect(wrapperClass).not.toContain('bg-linear-to-r');
  });

  it('hides the category select when searchShowCategorySelect is false', async () => {
    const html = await renderLayout({ searchShowCategorySelect: false });
    expect(html).not.toContain('name="categoriaId"');
    expect(html).toContain('name="q"');
  });
});