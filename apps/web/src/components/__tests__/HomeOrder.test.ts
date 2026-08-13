import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import HeroBanner from '@/components/HeroBanner.astro';
import Home from '@/pages/index.astro';
import { HERO_BANNER_CONTENT } from '@/lib/config/hero-banner';

// These tests cover two scenarios declared in
// `openspec/changes/layout-tweaks/specs/panel-home/spec.md` that previously had
// NO automated coverage:
//   - S9: PanelHome is rendered after the HeroBanner in the DOM (and appears once)
//   - S10: HeroBanner HTML is not modified by the presence of PanelHome
// Both are validated against the real home page (`index.astro`), which is the
// source of truth for the component ordering (HeroBanner -> PanelHome siblings).

function stripHtmlComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function normalizeWhitespace(s: string): string {
  // Collapse runs of whitespace so attribute/indentation differences between a
  // standalone render and an in-page render don't cause a false mismatch.
  return s.replace(/\s+/g, ' ').trim();
}

function extractSections(html: string): string[] {
  return html.match(/<section[^>]*>[\s\S]*?<\/section>/g) ?? [];
}

function heroSectionOf(html: string): string {
  // The home page renders exactly one <h1> (owned by HeroBanner), so the
  // section containing it is unambiguously the HeroBanner.
  const hero = extractSections(html).find((s) => s.includes('<h1'));
  if (!hero) throw new Error('HeroBanner <section> (with <h1>) not found in rendered HTML');
  return hero;
}

function panelSectionOf(html: string): string {
  const panel = extractSections(html).find((s) => s.includes('DESDE 1979'));
  if (!panel) throw new Error('PanelHome <section> not found in rendered HTML');
  return panel;
}

async function renderHome(): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Home, { props: {} });
  return stripHtmlComments(html);
}

async function renderHeroBannerStandalone(): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(HeroBanner, { props: { ...HERO_BANNER_CONTENT } });
  return stripHtmlComments(html);
}

describe('Home page — PanelHome DOM order & HeroBanner isolation (panel-home spec S9/S10)', () => {
  it('S9: PanelHome renders after the HeroBanner and appears exactly once on the home page', async () => {
    const html = await renderHome();
    const hero = heroSectionOf(html);
    const panel = panelSectionOf(html);

    const heroIndex = html.indexOf(hero);
    const panelIndex = html.indexOf(panel);

    expect(heroIndex).toBeGreaterThanOrEqual(0);
    // PanelHome MUST come after HeroBanner in document order.
    expect(panelIndex).toBeGreaterThan(heroIndex);

    // PanelHome appears exactly once in the document.
    const panelOccurrences = extractSections(html).filter((s) =>
      s.includes('DESDE 1979'),
    ).length;
    expect(panelOccurrences).toBe(1);
  });

  it('S10: HeroBanner HTML is identical rendered alone vs within the home page (not modified by PanelHome)', async () => {
    const standalone = normalizeWhitespace(heroSectionOf(await renderHeroBannerStandalone()));
    const inPage = normalizeWhitespace(heroSectionOf(await renderHome()));

    // The HeroBanner markup (classes + content) must be byte-equivalent whether
    // or not PanelHome is present in the page.
    expect(inPage).toBe(standalone);
  });
});
