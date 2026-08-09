import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import SolutionSection from '@/components/SolutionSection.astro';
import type { SolutionSectionProps } from '@/lib/types/solution-section';
import { SOLUTION_SECTION_CONTENT } from '@/lib/config/solution-section';

const baseProps: SolutionSectionProps = SOLUTION_SECTION_CONTENT;

async function render(props: SolutionSectionProps = baseProps): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(SolutionSection, {
    props: { ...props },
  });
  // Strip HTML comments so structural regex matches don't hit documentation
  // comments inside the rendered output (same pattern as PanelHome.test.ts).
  return stripHtmlComments(html);
}

function stripHtmlComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle === '') return 0;
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count += 1;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

/** Escapes regex special chars so titles/descriptions match literally. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('SolutionSection — structure & outermost section (tasks 2.2, 2.3)', () => {
  it('renders a <section> as the outermost element (task 2.2)', async () => {
    const html = await render();
    const stripped = stripHtmlComments(html).trim();
    expect(stripped.startsWith('<section')).toBe(true);
  });

  it('the <section> carries vertical padding utilities (task 2.3)', async () => {
    const html = await render();
    const sectionMatch = html.match(/<section[^>]*>/);
    if (!sectionMatch) throw new Error('section not found');
    expect(sectionMatch[0]).toMatch(/py-\d+/);
    expect(sectionMatch[0]).toMatch(/md:py-\d+/);
  });
});

describe('SolutionSection — header (tasks 2.4, 2.5, 2.6, 2.7, 2.8)', () => {
  it('the header contains a grid with grid-cols-1 and lg:grid-cols-2 (task 2.4)', async () => {
    const html = await render();
    // The header grid is the first element with both classes together.
    const gridMatch = html.match(
      /class="[^"]*grid-cols-1[^"]*lg:grid-cols-2[^"]*"/,
    );
    if (!gridMatch) throw new Error('header grid not found');
    expect(gridMatch[0]).toContain('grid-cols-1');
    expect(gridMatch[0]).toContain('lg:grid-cols-2');
  });

  it('renders the eyebrow "PORTAFOLIO" as a non-heading uppercase element with an accent-family color (task 2.5)', async () => {
    const html = await render();
    // Eyebrow must NOT be any heading.
    expect(html).not.toMatch(/<h[1-6][^>]*>PORTAFOLIO/);
    const eyebrowMatch = html.match(
      /<(span|p|div)[^>]*class="[^"]*uppercase[^"]*(accent|accent-dark)[^"]*"[^>]*>\s*PORTAFOLIO\s*<\/\1>/,
    );
    if (!eyebrowMatch) {
      // Fallback: simpler assertions.
      expect(html).toContain('PORTAFOLIO');
      expect(html).toContain('uppercase');
      expect(html).toMatch(/text-accent(-\w+)?/);
    } else {
      expect(eyebrowMatch).not.toBeNull();
    }
  });

  it('renders the headline as <h3> with the exact text, text-secondary and font-heading (task 2.6)', async () => {
    const html = await render();
    const h3Match = html.match(/<h3[\s\S]*?<\/h3>/);
    if (!h3Match) throw new Error('h3 not found');
    const h3 = h3Match[0];
    expect(h3).toContain(baseProps.headline);
    expect(h3).toContain('text-secondary');
    expect(h3).toContain('font-heading');
  });

  it('renders a teal underline bar after the h3 (task 2.7)', async () => {
    const html = await render();
    const h3Match = html.match(/<h3[\s\S]*?<\/h3>/);
    if (!h3Match) throw new Error('h3 not found');
    const h3Index = html.indexOf(h3Match[0]);
    // Find the underline bar div after the h3.
    const afterH3 = html.slice(h3Index + h3Match[0].length);
    const barMatch = afterH3.match(/<div[^>]*class="[^"]*h-1[^"]*w-16[^"]*bg-primary[^"]*"[^>]*>/);
    expect(barMatch).not.toBeNull();
  });

  it('renders the description as <p> with text-text-2 (task 2.8)', async () => {
    const html = await render();
    const pMatches = html.match(/<p[^>]*>[\s\S]*?<\/p>/g) ?? [];
    const descP = pMatches.find((p) => p.includes(baseProps.description));
    if (!descP) throw new Error('description <p> not found');
    expect(descP).toContain('text-text-2');
  });
});

describe('SolutionSection — card grid (tasks 2.9, 2.10)', () => {
  it('renders a card grid with grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 (task 2.9)', async () => {
    const html = await render();
    const gridMatch = html.match(
      /class="[^"]*grid-cols-1[^"]*sm:grid-cols-2[^"]*lg:grid-cols-4[^"]*"/,
    );
    if (!gridMatch) throw new Error('card grid not found');
    expect(gridMatch[0]).toContain('grid-cols-1');
    expect(gridMatch[0]).toContain('sm:grid-cols-2');
    expect(gridMatch[0]).toContain('lg:grid-cols-4');
  });

  it('renders exactly 4 <article> cards (task 2.10)', async () => {
    const html = await render();
    expect(countOccurrences(html, '<article')).toBe(4);
  });
});

describe('SolutionSection — card contents (tasks 2.11, 2.12, 2.13, 2.14, 2.15)', () => {
  it('each card contains a bg-primary badge with an <svg> icon (task 2.11)', async () => {
    const html = await render();
    // Find all badge divs: `<div ... bg-primary ...>` between article tags.
    const articleMatches = html.match(/<article[\s\S]*?<\/article>/g) ?? [];
    expect(articleMatches).toHaveLength(4);
    for (const article of articleMatches) {
      const badge = article.match(/<div[^>]*class="[^"]*bg-primary[^"]*"[^>]*>[\s\S]*?<\/div>/);
      if (!badge) throw new Error('badge div not found in card');
      expect(badge[0]).toContain('bg-primary');
      expect(badge[0]).toContain('<svg');
    }
  });

  it('each card contains an image with loading="lazy" and non-empty alt (task 2.12)', async () => {
    const html = await render();
    const articleMatches = html.match(/<article[\s\S]*?<\/article>/g) ?? [];
    for (const article of articleMatches) {
      const imgMatch = article.match(/<img[^>]*>/);
      expect(imgMatch).not.toBeNull();
      expect(imgMatch![0]).toContain('loading="lazy"');
      const altMatch = imgMatch![0].match(/alt="([^"]*)"/);
      expect(altMatch).not.toBeNull();
      expect(altMatch![1]!.length).toBeGreaterThan(0);
    }
  });

  it('each card contains an <h4> with the title verbatim, text-secondary and font-heading (task 2.13)', async () => {
    const html = await render();
    for (const solution of baseProps.solutions) {
      const h4Match = html.match(
        new RegExp(`<h4[^>]*>[\\s\\S]*?${escapeRegex(solution.title)}[\\s\\S]*?<\\/h4>`),
      );
      if (!h4Match) {
        throw new Error(`h4 not found for title="${solution.title}"`);
      }
      expect(h4Match[0]).toContain('text-secondary');
      expect(h4Match[0]).toContain('font-heading');
    }
  });

  it('each card contains a <p> description with text-text-2 (task 2.14)', async () => {
    const html = await render();
    for (const solution of baseProps.solutions) {
      const pMatches = html.match(/<p[^>]*>[\s\S]*?<\/p>/g) ?? [];
      const descP = pMatches.find((p) => p.includes(solution.description));
      if (!descP) {
        throw new Error(`description <p> not found for "${solution.title}"`);
      }
      expect(descP).toContain('text-text-2');
    }
  });

  it('each card CTA renders as the design-system solid primary button with SABER MÁS, bg-primary/text-white/px-6 py-3, and arrow svg aria-hidden (task 2.15, 2.29)', async () => {
    const html = await render();
    const articleMatches = html.match(/<article[\s\S]*?<\/article>/g) ?? [];
    for (const article of articleMatches) {
      const aMatch = article.match(/<a\s[^>]*>[\s\S]*?<\/a>/);
      if (!aMatch) throw new Error('card CTA <a> not found');
      const a = aMatch[0];
      expect(a).toContain('href="/soluciones"');
      expect(a).toContain('SABER MÁS');
      // Design-system solid button pattern (same as HeroBanner/Header/PanelHome CTAs).
      expect(a).toContain('bg-primary');
      expect(a).toContain('hover:bg-primary-dark');
      expect(a).toContain('text-white');
      expect(a).toContain('px-6');
      expect(a).toContain('py-3');
      expect(a).toContain('inline-flex');
      // A plain text link (only text-primary, no background) is NOT compliant.
      expect(a).not.toMatch(/class="[^"]*\btext-primary\b[^"]*"/);
      expect(a).toContain('<svg');
      expect(a).toContain('aria-hidden="true"');
    }
  });
});

describe('SolutionSection — heading outline (tasks 2.16, 2.17, 2.20)', () => {
  it('does NOT render <h1> or <h2> (task 2.16)', async () => {
    const html = await render();
    expect(html).not.toMatch(/<h1/);
    expect(html).not.toMatch(/<h2/);
  });

  it('renders exactly one <h3> and exactly 4 <h4> (task 2.17)', async () => {
    const html = await render();
    expect(countOccurrences(html, '<h3')).toBe(1);
    expect(countOccurrences(html, '<h4')).toBe(4);
  });

  it('the <h3> headline does NOT carry aria-hidden or tabindex=-1 (task 2.20)', async () => {
    const html = await render();
    const h3Match = html.match(/<h3[\s\S]*?>/);
    if (!h3Match) throw new Error('h3 not found');
    expect(h3Match[0]).not.toContain('aria-hidden="true"');
    expect(h3Match[0]).not.toContain('tabindex="-1"');
  });
});

describe('SolutionSection — design tokens (tasks 2.18, 2.19, 2.25)', () => {
  it('does NOT contain literal hex color values (task 2.18)', async () => {
    const html = await render();
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('does NOT contain deprecated brand-* tokens (task 2.19)', async () => {
    const html = await render();
    expect(html).not.toMatch(/brand-(teal|navy|orange|gray)/);
  });

  it('the eyebrow carries an accent-family color token (text-accent or text-accent-dark) (task 2.25)', async () => {
    const html = await render();
    const eyebrowMatch = html.match(
      /<(span|p|div)[^>]*class="[^"]*uppercase[^"]*"[^>]*>\s*PORTAFOLIO\s*<\/\1>/,
    );
    if (!eyebrowMatch) throw new Error('eyebrow not found');
    expect(eyebrowMatch[0]).toMatch(/text-accent(-\w+)?/);
    expect(eyebrowMatch[0]).not.toContain('text-secondary');
    expect(eyebrowMatch[0]).not.toContain('text-primary');
  });
});

describe('SolutionSection — accessibility (tasks 2.21, 2.22)', () => {
  it('the arrow icon inside the link carries aria-hidden="true" (task 2.21)', async () => {
    const html = await render();
    const aMatch = html.match(/<a\s[^>]*>[\s\S]*?<\/a>/);
    if (!aMatch) throw new Error('link <a> not found');
    expect(aMatch[0]).toContain('aria-hidden="true"');
  });

  it('the "SABER MÁS" links do NOT carry tabindex=-1 or aria-hidden on the link itself (task 2.22)', async () => {
    const html = await render();
    // Match only the opening <a ...> tag (not the full element, which
    // necessarily contains the decorative arrow <svg aria-hidden="true">).
    const aOpenMatches = html.match(/<a\s[^>]*>/g) ?? [];
    expect(aOpenMatches.length).toBeGreaterThan(0);
    for (const aOpen of aOpenMatches) {
      expect(aOpen).toContain('href="/soluciones"');
      expect(aOpen).not.toContain('tabindex="-1"');
      expect(aOpen).not.toContain('aria-hidden="true"');
    }
    // And at least one SABER MÁS link exists.
    expect(html).toContain('SABER MÁS');
  });
});

describe('SolutionSection — dumb component (tasks 2.23, 2.24)', () => {
  it('the frontmatter does NOT contain import.meta.env (task 2.23)', async () => {
    // The component source must not read environment variables directly.
    const source = await import(
      /* @vite-ignore */ '@/components/SolutionSection.astro?raw'
    ).then((m) => String(m.default));
    expect(source).not.toContain('import.meta.env');
  });

  it('the frontmatter does NOT contain fetch( (task 2.24)', async () => {
    const source = await import(
      /* @vite-ignore */ '@/components/SolutionSection.astro?raw'
      ).then((m) => String(m.default));
    expect(source).not.toContain('fetch(');
  });
});

describe('SolutionSection — snapshot (task 2.26)', () => {
  it('matches the snapshot for base props (task 2.26)', async () => {
    const html = await render();
    expect(html).toMatchSnapshot();
  });
});