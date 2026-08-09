import { describe, it, expect } from 'vitest';
import type { PilaresSectionProps } from '@/lib/types/pilares-section';
import { PILARES_SECTION_CONTENT } from '@/lib/config/pilares-section';
import {
  renderPilaresSection as render,
  getSectionTag,
  getLeftColumn,
  getRightColumn,
  forEachPillar,
  getBackgroundImages,
  countOccurrences,
  stripHtmlComments,
} from './helpers/pilares-section-test-utils';

const baseProps: PilaresSectionProps = PILARES_SECTION_CONTENT;

describe('PilaresSection — structure & outermost section', () => {
  it('renders a <section> as the outermost element', async () => {
    const html = await render();
    const stripped = stripHtmlComments(html).trim();
    expect(stripped.startsWith('<section')).toBe(true);
  });

  it('the <section> does NOT carry a bg-* color utility (backgrounds live on columns)', async () => {
    const section = getSectionTag(await render());
    expect(section).not.toMatch(/bg-(primary|secondary|accent|white|bg)/);
  });

  it('the <section> is full-bleed: does NOT carry the container class', async () => {
    const section = getSectionTag(await render());
    expect(section).not.toContain('container');
  });

  it('the <section> contains the stack-to-split grid: grid-cols-1 lg:grid-cols-2', async () => {
    const html = await render();
    expect(html).toMatch(
      /class="[^"]*\bgrid-cols-1\b[^"]*\blg:grid-cols-2\b[^"]*"/,
    );
  });
});

describe('PilaresSection — column backgrounds (photo+overlay left, solid primary-deep right)', () => {
  it('renders exactly ONE background <img> element (left column only — POST-APPLY FIX #2)', async () => {
    const images = getBackgroundImages(await render());
    expect(images).toHaveLength(1);
  });

  it('the left background image carries absolute inset-0 w-full h-full object-cover', async () => {
    const [img] = getBackgroundImages(await render());
    expect(img).toContain('absolute');
    expect(img).toContain('inset-0');
    expect(img).toContain('w-full');
    expect(img).toContain('h-full');
    expect(img).toContain('object-cover');
  });

  it('renders exactly ONE overlay: the left navy bg-secondary/80 (no right overlay — POST-APPLY FIX #2)', async () => {
    const html = await render();
    const overlays = html.match(
      /<div[^>]*class="[^"]*bg-(secondary|primary)\/80[^"]*"[^>]*>/g,
    );
    expect(overlays).toHaveLength(1);
    const leftOverlay = html.match(/<div[^>]*class="[^"]*bg-secondary\/80[^"]*"[^>]*>/);
    if (!leftOverlay) throw new Error('left navy overlay not found');
    expect(leftOverlay[0]).toContain('absolute');
    expect(leftOverlay[0]).toContain('inset-0');
    // POST-APPLY FIX #1+#2: the overlays use the column-specific tokens
    // (left #1F2D40 navy secondary; right column is solid primary-deep, no
    // overlay), NOT the dark secondary-dark anywhere.
    expect(html).not.toMatch(/bg-secondary-dark\/80/);
    expect(html).not.toMatch(/bg-primary\/80/);
  });

  it('the right column carries the solid bg-primary-deep background (token #006874 — POST-APPLY FIX #2)', async () => {
    const right = getRightColumn(await render());
    expect(right).toContain('bg-primary-deep');
    expect(right).not.toMatch(/<img\b/);
    expect(right).not.toMatch(/<picture\b/);
  });

  it('the left background image is processed by astro:assets (optimized path, not raw asset paths)', async () => {
    const [img] = getBackgroundImages(await render());
    // AstroContainer/SSR renders the sharp-optimized `/_image?` endpoint;
    // the production build emits `/_astro/...` hashed files. Both prove the
    // astro:assets pipeline handled the image (same pattern as
    // DestacadosSection.test.ts).
    expect(img).toMatch(/src="\/_(astro|image)\?/);
    expect(img).not.toContain('src="/assets/img/');
    expect(img).toMatch(/width="\d+"/);
    expect(img).toMatch(/height="\d+"/);
  });

  it('the left background image loads lazily (section is below the initial fold)', async () => {
    const [img] = getBackgroundImages(await render());
    expect(img).toContain('loading="lazy"');
  });

  it('the left background image carries a non-empty descriptive alt attribute', async () => {
    const [img] = getBackgroundImages(await render());
    expect(img).toContain(`alt="${baseProps.leftImageAlt}"`);
  });
});

describe('PilaresSection — left column (eyebrow, h2, description, CTA)', () => {
  it('renders the eyebrow span with text-accent and uppercase utilities', async () => {
    const left = getLeftColumn(await render());
    const spanMatch = left.match(/<span[^>]*>[\s\S]*?<\/span>/);
    if (!spanMatch) throw new Error('eyebrow span not found');
    expect(spanMatch[0]).toContain(baseProps.eyebrow);
    expect(spanMatch[0]).toContain('text-accent');
    expect(spanMatch[0]).toContain('font-heading');
    expect(spanMatch[0]).toContain('uppercase');
  });

  it('renders exactly one <h2> with the headline verbatim, text-white and font-heading', async () => {
    const html = await render();
    const h2Match = html.match(/<h2[\s\S]*?<\/h2>/);
    if (!h2Match) throw new Error('h2 not found');
    expect(h2Match[0]).toContain(baseProps.headline);
    expect(h2Match[0]).toContain('text-white');
    expect(h2Match[0]).toContain('font-heading');
    expect(countOccurrences(html, '<h2')).toBe(1);
  });

  it('the <h2> does NOT carry aria-hidden or tabindex=-1', async () => {
    const html = await render();
    const h2Open = html.match(/<h2[^>]*>/);
    if (!h2Open) throw new Error('h2 not found');
    expect(h2Open[0]).not.toContain('aria-hidden="true"');
    expect(h2Open[0]).not.toContain('tabindex="-1"');
  });

  it('renders the description paragraph with text-white/80', async () => {
    const html = await render();
    const pMatch = html.match(/<p[^>]*>[\s\S]*?<\/p>/);
    if (!pMatch) throw new Error('description paragraph not found');
    expect(pMatch[0]).toContain(baseProps.description);
    expect(pMatch[0]).toContain('text-white/80');
  });

  it('renders the CTA linking to cta.href with the solid accent pattern', async () => {
    const html = await render();
    const aMatch = html.match(/<a\s[^>]*>/);
    if (!aMatch) throw new Error('CTA anchor not found');
    expect(aMatch[0]).toContain(`href="${baseProps.cta.href}"`);
    expect(aMatch[0]).toContain('bg-accent');
    expect(aMatch[0]).toContain('hover:bg-accent-dark');
    expect(aMatch[0]).toContain('text-white');
    expect(aMatch[0]).toContain('font-heading');
    expect(aMatch[0]).toContain('font-semibold');
    expect(aMatch[0]).toContain('uppercase');
    expect(aMatch[0]).toContain('text-xs');
    expect(aMatch[0]).toContain('tracking-wide');
    expect(aMatch[0]).toContain('px-6');
    expect(aMatch[0]).toContain('py-3');
    expect(aMatch[0]).not.toContain('aria-hidden="true"');
    expect(aMatch[0]).not.toContain('tabindex="-1"');
  });

  it('the CTA visible text equals cta.label verbatim', async () => {
    const html = await render();
    expect(html).toContain(baseProps.cta.label);
  });
});

describe('PilaresSection — right column (eyebrow, h3, description, pillars)', () => {
  it('renders the right eyebrow "Estándares de Calidad" with text-primary before the h3 (POST-APPLY FIX #2)', async () => {
    const right = getRightColumn(await render());
    const eyebrowIndex = right.indexOf('Estándares de Calidad');
    const h3Index = right.indexOf(baseProps.rightHeadline);
    expect(eyebrowIndex).toBeGreaterThan(-1);
    expect(h3Index).toBeGreaterThan(-1);
    expect(eyebrowIndex).toBeLessThan(h3Index);
    const span = right.slice(
      right.lastIndexOf('<span', eyebrowIndex),
      eyebrowIndex + 'Estándares de Calidad'.length + 10,
    );
    expect(span).toContain('text-primary');
    expect(span).toContain('font-heading');
    expect(span).toContain('uppercase');
  });

  it('renders exactly one <h3> with the rightHeadline verbatim, text-white and font-heading', async () => {
    const html = await render();
    const h3Match = html.match(/<h3[\s\S]*?<\/h3>/);
    if (!h3Match) throw new Error('h3 not found');
    expect(h3Match[0]).toContain(baseProps.rightHeadline);
    expect(h3Match[0]).toContain('text-white');
    expect(h3Match[0]).toContain('font-heading');
    expect(countOccurrences(html, '<h3')).toBe(1);
  });

  it('the <h3> does NOT carry aria-hidden or tabindex=-1', async () => {
    const html = await render();
    const h3Open = html.match(/<h3[^>]*>/);
    if (!h3Open) throw new Error('h3 not found');
    expect(h3Open[0]).not.toContain('aria-hidden="true"');
    expect(h3Open[0]).not.toContain('tabindex="-1"');
  });

  it('renders the right description paragraph with text-white/80', async () => {
    const right = getRightColumn(await render());
    expect(right).toContain(baseProps.rightDescription);
    expect(right).toContain('text-white/80');
  });

  it('renders exactly 4 pillar items with Lucide icons and labels', async () => {
    const html = await render();
    expect(countOccurrences(html, '<svg')).toBe(4);
    await forEachPillar(html, (item, label) => {
      expect(item).toContain(label);
      expect(item).toContain('<svg');
    });
  });

  it('each pillar icon carries aria-hidden="true", the lucide: reference and text-primary (POST-APPLY FIX #2)', async () => {
    const html = await render();
    const svgs = html.match(/<svg[^>]*>/g) ?? [];
    expect(svgs).toHaveLength(4);
    for (const svg of svgs) {
      expect(svg).toContain('aria-hidden="true"');
    }
    await forEachPillar(html, (item, _label, icon) => {
      expect(item).toContain(`lucide:${icon}`);
      expect(item).toContain('text-primary');
    });
  });

  it('each pillar label span carries text-white and font-heading', async () => {
    const html = await render();
    await forEachPillar(html, (item) => {
      const labelSpan = item.match(/<span[^>]*>[\s\S]*?<\/span>/);
      if (!labelSpan) throw new Error('pillar label span not found');
      expect(labelSpan[0]).toContain('text-white');
      expect(labelSpan[0]).toContain('font-heading');
    });
  });
});

describe('PilaresSection — heading outline', () => {
  it('renders exactly one <h2> and one <h3>, zero <h1> and zero <h4> in isolation', async () => {
    const html = await render();
    expect(countOccurrences(html, '<h1')).toBe(0);
    expect(countOccurrences(html, '<h2')).toBe(1);
    expect(countOccurrences(html, '<h3')).toBe(1);
    expect(countOccurrences(html, '<h4')).toBe(0);
  });
});

describe('PilaresSection — canonical design tokens only', () => {
  it('rendered HTML does NOT contain literal hex color values', async () => {
    const html = await render();
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('rendered HTML does NOT contain deprecated brand-* tokens', async () => {
    const html = await render();
    expect(html).not.toMatch(/brand-(teal|navy|orange|gray)/);
  });

  it('rendered HTML does NOT contain rounded-* utilities (flat design)', async () => {
    const html = await render();
    expect(html).not.toMatch(/rounded\b/);
  });
});

describe('PilaresSection — dumb component contract', () => {
  it('renders in isolation with all required props (left copy + right copy + 4 pillars)', async () => {
    const html = await render();
    expect(html).toContain(baseProps.eyebrow);
    expect(html).toContain(baseProps.headline);
    expect(html).toContain(baseProps.cta.label);
    expect(html).toContain(baseProps.rightHeadline);
    for (const pillar of baseProps.pillars) {
      expect(html).toContain(pillar.label);
    }
  });

  it('frontmatter contains NO import.meta.env access', async () => {
    const source = await import(
      '@/components/PilaresSection.astro?raw'
    ).then((m) => m.default as string);
    const frontmatter = source.split('---')[1] ?? '';
    expect(frontmatter).not.toContain('import.meta.env');
  });

  it('frontmatter contains NO fetch( calls', async () => {
    const source = await import(
      '@/components/PilaresSection.astro?raw'
    ).then((m) => m.default as string);
    const frontmatter = source.split('---')[1] ?? '';
    expect(frontmatter).not.toContain('fetch(');
  });
});