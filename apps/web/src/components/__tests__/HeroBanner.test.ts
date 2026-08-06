import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import HeroBanner from '@/components/HeroBanner.astro';
import type { HeroBannerProps } from '@/lib/types/hero-banner';

const baseProps: HeroBannerProps = {
  headline: 'Innovación que Fluye',
  highlightedWord: 'Fluye',
  subtitle: 'Experiencia, tecnología y control en medición de fluidos y tratamientos de agua.',
  description: 'Desarrollamos soluciones para la medición, control y tratamiento de agua, integrando equipos, soporte técnico y ejecución en terreno.',
  ctas: [
    { label: 'VER SERVICIOS', href: '/servicios', variant: 'primary' },
    { label: 'ESCRÍBENOS', href: '/contacto', variant: 'secondary' },
  ],
};

async function render(props: HeroBannerProps = baseProps): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(HeroBanner, { props: { ...props } });
  // Strip AstroContainer-emitted JSX comments so structural regex matches don't
  // accidentally hit `<h1>` mentions inside documentation comments (same
  // pattern used by SearchForm.test.ts).
  return stripHtmlComments(html);
}

function stripHtmlComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function withoutRenderedWhitespace(s: string): string {
  // Collapse only the structural whitespace between tags to compare concatenated
  // visible text inside an h1 (e.g. " Innovación que Fluye" -> concatenable).
  return s.replace(/>\s+</g, '><');
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

describe('HeroBanner — structure & landmark', () => {
  it('renders a <section> as the outermost element', async () => {
    const html = await render();
    // Outermost non-comment content must start with <section
    const stripped = stripHtmlComments(html).trim();
    expect(stripped.startsWith('<section')).toBe(true);
  });

  it('contains exactly one <h1> and one <h2>', async () => {
    const html = await render();
    const h1Count = countOccurrences(html, '<h1');
    const h2Count = countOccurrences(html, '<h2');
    expect(h1Count).toBe(1);
    expect(h2Count).toBe(1);
  });
});

describe('HeroBanner — headline with highlighted word', () => {
  it('renders <h1> with the literal before-text "Innovación que " followed by the highlighted span (no whitespace added by the split itself)', async () => {
    // Use the real HERO_BANNER_CONTENT headline ("Innovación que Fluye") with
    // the trailing space already in the headline. The split must NOT introduce
    // any extra whitespace; the visible concatenation reads
    // "Innovación que Fluye" exactly as the input.
    const html = await render();
    const h1Match = html.match(/<h1[\s\S]*?<\/h1>/);
    if (!h1Match) throw new Error('h1 not found');
    // Compact structural whitespace between tags, then assert the literal
    // text includes the single space that was already in the headline.
    const compacted = withoutRenderedWhitespace(h1Match[0]);
    expect(compacted).toContain(
      'Innovación que <span class="text-primary">Fluye</span>',
    );
  });

  it('renders a <span class="text-primary">Fluye</span> inside the <h1>', async () => {
    const html = await render();
    const h1Match = html.match(/<h1[\s\S]*?<\/h1>/);
    if (!h1Match) throw new Error('h1 not found');
    expect(h1Match[0]).toContain('<span class="text-primary">Fluye</span>');
  });

  it('does NOT render any <span class="text-primary"> when highlightedWord is not present in headline', async () => {
    const html = await render({ ...baseProps, highlightedWord: 'Inexistente' });
    expect(html).not.toContain('text-primary');
    const h1Match = html.match(/<h1[\s\S]*?<\/h1>/);
    if (!h1Match) throw new Error('h1 not found');
    // The full headline text is rendered plain
    expect(h1Match[0]).toContain('Innovación que Fluye');
  });

  it('renders exactly ONE <span class="text-primary"> when highlightedWord appears twice in headline', async () => {
    const html = await render({
      ...baseProps,
      headline: 'Fluye y vuelve a Fluye',
      highlightedWord: 'Fluye',
    });
    const tealSpanCount = countOccurrences(html, '<span class="text-primary">Fluye</span>');
    expect(tealSpanCount).toBe(1);
  });
});

describe('HeroBanner — subtitle and description', () => {
  it('renders the subtitle as <h2> with the exact text and a max-w-3xl class', async () => {
    const html = await render();
    const h2Match = html.match(/<h2[\s\S]*?<\/h2>/);
    if (!h2Match) throw new Error('h2 not found');
    const h2 = h2Match[0];
    expect(h2).toContain(baseProps.subtitle);
    expect(h2).toContain('max-w-3xl');
  });

  it('renders the description as <p> with reduced opacity (text-white/80) and max-w-2xl', async () => {
    const html = await render();
    const pMatch = html.match(/<p[^>]*>[\s\S]*?<\/p>/);
    if (!pMatch) throw new Error('p not found');
    const p = pMatch[0];
    expect(p).toContain(baseProps.description);
    expect(p).toContain('text-white/80');
    expect(p).toContain('max-w-2xl');
  });
});

describe('HeroBanner — CTAs', () => {
  it('renders two <a> elements with href+label matching ctas[0] and ctas[1]', async () => {
    const html = await render();
    const aMatches = html.match(/<a\s[^>]*>[\s\S]*?<\/a>/g) ?? [];
    expect(aMatches.length).toBe(2);
    expect(aMatches[0]).toContain(`href="${baseProps.ctas[0]!.href}"`);
    expect(aMatches[0]).toContain(baseProps.ctas[0]!.label);
    expect(aMatches[1]).toContain(`href="${baseProps.ctas[1]!.href}"`);
    expect(aMatches[1]).toContain(baseProps.ctas[1]!.label);
  });

  it('the primary CTA carries bg-primary and text-white classes', async () => {
    const html = await render();
    const aMatches = html.match(/<a\s[^>]*>[\s\S]*?<\/a>/g) ?? [];
    const primary = aMatches[0]!;
    expect(primary).toContain('bg-primary');
    expect(primary).toContain('text-white');
  });

  it('the secondary CTA carries border-white and NOT bg-primary', async () => {
    const html = await render();
    const aMatches = html.match(/<a\s[^>]*>[\s\S]*?<\/a>/g) ?? [];
    const secondary = aMatches[1]!;
    expect(secondary).toContain('border-white');
    expect(secondary).not.toContain('bg-primary');
  });

  it('wraps the two <a> in a flex-col + sm:flex-row container', async () => {
    const html = await render();
    // Find the container immediately wrapping both <a>
    const ctasContainerMatch = html.match(/class="[^"]*flex[^"]*"[^>]*>\s*<a[\s\S]*?<a[\s\S]*?<\/a>/);
    expect(ctasContainerMatch).not.toBeNull();
    const containerClass = ctasContainerMatch![0];
    expect(containerClass).toContain('flex-col');
    expect(containerClass).toContain('sm:flex-row');
  });
});

describe('HeroBanner — CSS-only placeholder background', () => {
  it('renders a <section> with a navy gradient class', async () => {
    const html = await render();
    const sectionMatch = html.match(/<section[^>]*>/);
    if (!sectionMatch) throw new Error('section not found');
    expect(sectionMatch[0]).toContain('bg-gradient-to-br');
    expect(sectionMatch[0]).toContain('from-secondary');
    expect(sectionMatch[0]).toContain('via-secondary-light');
    expect(sectionMatch[0]).toContain('to-secondary');
  });

  it('does NOT reference any external image (<img>, <picture>, or inline background-image url)', async () => {
    const html = await render();
    expect(html).not.toMatch(/<img\s/i);
    expect(html).not.toMatch(/<picture\s/i);
    expect(html).not.toMatch(/background-image:\s*url\(/i);
    expect(html).not.toMatch(/background:\s*url\(/i);
  });

  it('contains an absolute background layer and a relative content layer', async () => {
    const html = await render();
    expect(html).toContain('absolute');
    expect(html).toContain('inset-0');
    expect(html).toContain('relative');
  });
});

describe('HeroBanner — responsive typography & padding', () => {
  it('the <h1> has responsive text size (text-4xl base + md:text-6xl)', async () => {
    const html = await render();
    const h1Match = html.match(/<h1[^>]*>/);
    if (!h1Match) throw new Error('h1 not found');
    expect(h1Match[0]).toContain('text-4xl');
    expect(h1Match[0]).toContain('md:text-6xl');
  });

  it('the content wrapper has responsive vertical padding (py-16 base + md:py-24)', async () => {
    const html = await render();
    // The content wrapper typically uses the container class with py-16 md:py-24
    expect(html).toContain('py-16');
    expect(html).toContain('md:py-24');
  });
});

describe('HeroBanner — accessibility', () => {
  it('the CTAs do not carry tabindex="-1" or aria-hidden="true"', async () => {
    const html = await render();
    const aMatches = html.match(/<a\s[^>]*>[\s\S]*?<\/a>/g) ?? [];
    for (const a of aMatches) {
      expect(a).not.toContain('tabindex="-1"');
      expect(a).not.toContain('aria-hidden="true"');
    }
  });

  it('decorative background layers do NOT carry role="img", aria-label, or alt', async () => {
    const html = await render();
    // The decorative layers are absolutely-positioned <div> elements inside the
    // section. They should not expose decorative noise to screen readers.
    expect(html).not.toContain('role="img"');
    // alt is an <img> attribute; combined with the no-<img> rule this is redundant
    // but explicit: ensures no accidental alt="" sneaks in.
    expect(html).not.toMatch(/\salt="/);
    // The decorative layer must not carry an aria-label
    // (the section may carry one but the decorative layer must not)
    const sectionMatch = html.match(/<section[\s\S]*?<\/section>/);
    if (!sectionMatch) throw new Error('section not found');
    // Find the absolute decorative layer
    const decorativeMatch = sectionMatch[0].match(/<div[^>]*class="[^"]*absolute[^"]*"[^>]*>/g) ?? [];
    for (const d of decorativeMatch) {
      expect(d).not.toContain('aria-label');
    }
  });
});

describe('HeroBanner — snapshot', () => {
  it('matches the snapshot for base props', async () => {
    const html = await render();
    expect(html).toMatchSnapshot();
  });
});
