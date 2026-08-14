import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import SiteCredits from '@/components/SiteCredits.astro';
import type { SiteCreditsProps } from '@/lib/types/site-credits';
import { SITE_CREDITS_CONTENT } from '@/lib/config/site-credits';

async function getSource(): Promise<string> {
  const m = await import('@/components/SiteCredits.astro?raw');
  return m.default as string;
}

/** Renders the component; defaults to the production content config. */
async function renderCredits(
  props: SiteCreditsProps = SITE_CREDITS_CONTENT,
): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(SiteCredits, {
    props: { ...props },
  });
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

/** Extracts the `<a ...>...</a>` anchor with its full tag for inspection. */
function getAnchor(html: string): { tag: string; text: string } | null {
  const match = html.match(/<a\s[^>]*>[\s\S]*?<\/a>/);
  if (!match) return null;
  const tag = match[0].match(/<a\s[^>]*>/)?.[0] ?? '';
  const text = match[0].replace(/<a\s[^>]*>/, '').replace(/<\/a>/, '').trim();
  return { tag, text };
}

describe('SiteCredits — strip structure', () => {
  it('renders the attribution label text', async () => {
    const html = await renderCredits();
    expect(html).toContain('Diseñado y desarrollado por:');
  });

  it('renders the developer name as a link', async () => {
    const html = await renderCredits();
    const anchor = getAnchor(html);
    if (!anchor) throw new Error('developer anchor not found');
    expect(anchor.text).toBe('Gabriel Zavando');
    expect(anchor.tag).toContain('href="https://gabrielzavando.cl"');
    expect(anchor.tag).toContain('target="_blank"');
    expect(anchor.tag).toContain('rel="noopener noreferrer"');
  });

  it('outermost element spans full width (no container/max-w on outermost)', async () => {
    const html = (await renderCredits()).trim();
    expect(html.startsWith('<div')).toBe(true);
    const outerDiv = html.match(/<div[^>]*>/)?.[0] ?? '';
    expect(outerDiv).not.toContain('container');
    expect(outerDiv).not.toMatch(/max-w-/);
  });

  it('uses bg-secondary for visual separation from the footer', async () => {
    const html = await renderCredits();
    const outerDiv = html.match(/<div[^>]*>/)?.[0] ?? '';
    expect(outerDiv).toContain('bg-secondary');
  });
});

describe('SiteCredits — link styling (never underlined, animated on hover)', () => {
  it('link is never underlined', async () => {
    const source = await getSource();
    const anchorMatch = source.match(/<a[\s\S]*?<\/a>/);
    if (!anchorMatch) throw new Error('anchor not found in source');
    const anchorClass = anchorMatch[0].match(/class="([^"]*)"/)?.[1] ?? '';
    expect(anchorClass).toContain('no-underline');
    // `underline` must only appear as part of `no-underline` — not as the
    // standalone `underline` utility or `hover:underline` variant.
    const underlineOccurrences = anchorClass
      .split(/\s+/)
      .filter((cls) => cls === 'underline' || cls === 'hover:underline');
    expect(underlineOccurrences).toHaveLength(0);
  });

  it('link uses text-primary with hover:text-primary-light and transition', async () => {
    const source = await getSource();
    const anchorMatch = source.match(/<a[\s\S]*?<\/a>/);
    if (!anchorMatch) throw new Error('anchor not found in source');
    const anchorClass = anchorMatch[0].match(/class="([^"]*)"/)?.[1] ?? '';
    expect(anchorClass).toContain('text-primary');
    expect(anchorClass).toContain('hover:text-primary-light');
    expect(anchorClass).toContain('transition-colors');
    expect(anchorClass).toMatch(/duration-200/);
  });

  it('component source has no raw hex literal', async () => {
    const source = await getSource();
    expect(source).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });

  it('no rounded* or shadow* classes in the rendered markup', async () => {
    const html = await renderCredits();
    expect(html).not.toMatch(/\brounded[a-z-]*\b/);
    expect(html).not.toMatch(/\bshadow-[a-z0-9]+\b/);
  });

  it('no brand-* classes referenced in the component source', async () => {
    const source = await getSource();
    expect(source).not.toMatch(/\b(bg|text|border)-brand-/);
  });
});

describe('SiteCredits — dumb component source', () => {
  it('only destructures Astro.props without network/service imports', async () => {
    const source = await getSource();
    expect(source).not.toMatch(/fetch\(/);
    expect(source).not.toMatch(/import\s*.*from\s*['"]@\/lib\/services/);
    expect(source).toMatch(/Astro\.props/);
  });

  it('has no hardcoded visible copy — every string sourced from props', async () => {
    const source = await getSource();
    // The component must NOT contain the literal copy; it must use the prop
    // variables instead.
    expect(source).not.toMatch(/>[^<]*Diseñado y desarrollado por[^<]*</);
    expect(source).not.toMatch(/>[^<]*Gabriel Zavando[^<]*</);
    // But it must reference the prop variables.
    expect(source).toContain('developerLabel');
    expect(source).toContain('developerName');
    expect(source).toContain('developerUrl');
  });
});
