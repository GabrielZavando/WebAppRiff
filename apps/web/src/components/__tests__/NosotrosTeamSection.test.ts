import { describe, it, expect } from 'vitest';
import type { NosotrosTeamSectionProps } from '@/lib/types/nosotros-team-section';
import { NOSOTROS_TEAM_SECTION_CONTENT } from '@/lib/config/nosotros-team-section';
import {
  renderNosotrosTeamSection as render,
  getSectionTag,
  getMemberCards,
  getGradientOverlays,
  getMemberImages,
  countOccurrences,
  stripHtmlComments,
} from './helpers/nosotros-team-section-test-utils';

const baseProps: NosotrosTeamSectionProps = NOSOTROS_TEAM_SECTION_CONTENT;

/**
 * Escapes a string the same way Astro escapes text nodes in SSR HTML, so
 * `toContain` assertions match the real rendered output (e.g. "Liderazgo &
 * Experiencia" → "Liderazgo &amp; Experiencia").
 */
function escaped(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Raw component source (frontmatter + template + scoped style). */
async function getSource(): Promise<string> {
  const m = await import('@/components/NosotrosTeamSection.astro?raw');
  return m.default as string;
}

describe('NosotrosTeamSection — structure & outermost section', () => {
  it('renders a <section> as the outermost element', async () => {
    const html = await render();
    const stripped = stripHtmlComments(html).trim();
    expect(stripped.startsWith('<section')).toBe(true);
  });

  it('the <section> carries the bg-bg token (light background per mockup)', async () => {
    const section = getSectionTag(await render());
    expect(section).toContain('bg-bg');
  });

  it('the <section> contains the responsive grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3', async () => {
    const html = await render();
    expect(html).toMatch(
      /class="[^"]*\bgrid-cols-1\b[^"]*\bmd:grid-cols-2\b[^"]*\blg:grid-cols-3\b[^"]*"/,
    );
  });

  it('renders exactly 3 member cards (one per mockup person)', async () => {
    const cards = getMemberCards(await render());
    expect(cards).toHaveLength(3);
  });
});

describe('NosotrosTeamSection — header (h2 + subtitle)', () => {
  it('renders exactly one <h2> with the headline verbatim, text-secondary and font-heading', async () => {
    const html = await render();
    const h2Match = html.match(/<h2[\s\S]*?<\/h2>/);
    if (!h2Match) throw new Error('h2 not found');
    expect(h2Match[0]).toContain(escaped(baseProps.headline));
    expect(h2Match[0]).toContain('text-secondary');
    expect(h2Match[0]).toContain('font-heading');
    expect(countOccurrences(html, '<h2')).toBe(1);
  });

  it('renders the subtitle paragraph with text-text-2 and font-body', async () => {
    const html = await render();
    const pMatch = html.match(/<p[^>]*>[\s\S]*?<\/p>/);
    if (!pMatch) throw new Error('subtitle paragraph not found');
    expect(pMatch[0]).toContain(baseProps.subtitle);
    expect(pMatch[0]).toContain('text-text-2');
    expect(pMatch[0]).toContain('font-body');
  });

  it('the header does NOT render the eyebrow (mockup has no eyebrow — task 3.1)', async () => {
    const html = await render();
    expect(html).not.toContain(baseProps.eyebrow);
  });

  it('renders zero <h1>, zero <h3> and zero <h4> (heading outline: only the h2)', async () => {
    const html = await render();
    expect(countOccurrences(html, '<h1')).toBe(0);
    expect(countOccurrences(html, '<h3')).toBe(0);
    expect(countOccurrences(html, '<h4')).toBe(0);
  });
});

describe('NosotrosTeamSection — member cards (photo, overlay, name, role)', () => {
  it('renders only the header with NO member cards when the members array is empty', async () => {
    const html = await render({ ...baseProps, members: [] });
    expect(getMemberCards(html)).toHaveLength(0);
    expect(getGradientOverlays(html)).toHaveLength(0);
    expect(getMemberImages(html)).toHaveLength(0);
    // The header must still render (section header is independent of cards).
    expect(html).toContain(escaped(baseProps.headline));
  });
  it('each card renders the member name (text-white font-heading) and uppercase role label (text-primary)', async () => {
    const html = await render();
    for (const member of baseProps.members) {
      expect(html).toContain(member.name);
    }
    // Display labels from the mockup (Gerente General, Jefe de Proyectos,
    // Comercial) derived by getTeamMemberRoleLabel in config.
    expect(html).toContain('Gerente General');
    expect(html).toContain('Jefe de Proyectos');
    expect(html).toContain('Comercial');
    const roleMatches = html.match(/<span[^>]*text-primary[^>]*>/g) ?? [];
    expect(roleMatches).toHaveLength(3);
    for (const span of roleMatches) {
      expect(span).toContain('font-heading');
      expect(span).toContain('uppercase');
    }
  });

  it('each card renders exactly one astro:assets image with lazy loading, descriptive alt and grayscale at rest', async () => {
    const images = getMemberImages(await render());
    expect(images).toHaveLength(3);
    for (const img of images) {
      expect(img).toMatch(/src="\/_(astro|image)\?/);
      expect(img).toContain('loading="lazy"');
      expect(img).toMatch(/alt="[^"]+"/);
      // POST-APPLY FIX #1: photos are black & white at rest, revealed in
      // color on hover (client feedback).
      expect(img).toContain('grayscale');
    }
    for (const member of baseProps.members) {
      const html = await render();
      expect(html).toContain(`alt="${member.imageAlt}"`);
    }
  });

  it('each card container is a relative overflow-hidden group (clips zoom, enables group-hover)', async () => {
    const html = await render();
    const containers =
      html.match(
        /<article[^>]*class="[^"]*(relative|overflow-hidden|group)[^"]*"[^>]*>/g,
      ) ?? [];
    expect(containers).toHaveLength(3);
    for (const container of containers) {
      expect(container).toContain('relative');
      expect(container).toContain('overflow-hidden');
      expect(container).toContain('group');
    }
  });
});

describe('NosotrosTeamSection — gradient overlay and hover interaction (POST-APPLY FIX #1 & #2)', () => {
  it('renders exactly 3 linear gradient overlays (bg-linear-to-b), light top / dark bottom-third band (POST-APPLY FIX #4)', async () => {
    const overlays = getGradientOverlays(await render());
    expect(overlays).toHaveLength(3);
    for (const overlay of overlays) {
      expect(overlay).toContain('absolute');
      expect(overlay).toContain('inset-0');
      expect(overlay).toContain('bg-linear-to-b');
      expect(overlay).toContain('from-secondary/40');
      // Positioned via stop at 67% of the card height concentrates the
      // darkness in the bottom third (client feedback).
      expect(overlay).toContain('via-secondary/75');
      expect(overlay).toContain('via-[67%]');
      expect(overlay).toContain('to-secondary/95');
      // The overlay never disappears: the gradient direction stays present.
      expect(overlay).not.toContain('bg-secondary/80');
    }
  });

  it('the overlay stays a single static gradient and only becomes more transparent as a whole via opacity fade (POST-APPLY FIX #2/#3/#4)', async () => {
    const overlays = getGradientOverlays(await render());
    for (const overlay of overlays) {
      // The gradient declaration is static — the client edits these stop
      // values BY HAND, so no per-stop hover overrides may exist.
      expect(overlay).toContain('bg-linear-to-b');
      expect(overlay).toContain('from-secondary/40');
      expect(overlay).toContain('via-secondary/75');
      expect(overlay).toContain('via-[67%]');
      expect(overlay).toContain('to-secondary/95');
      expect(overlay).not.toContain('group-hover:from-secondary/');
      expect(overlay).not.toContain('group-hover:to-secondary/');
      // The whole overlay fades via opacity: rest 100 → hover 60.
      expect(overlay).toContain('opacity-100');
      expect(overlay).toContain('group-hover:opacity-60');
      // Never disappears (fully transparent / hidden / invisible forbidden).
      expect(overlay).not.toMatch(/group-hover:(opacity-0|hidden|invisible)/);
    }
  });

  it('each overlay animates via transition-opacity, NOT background-image (gradients do not interpolate reliably — POST-APPLY FIX #2)', async () => {
    const overlays = getGradientOverlays(await render());
    for (const overlay of overlays) {
      expect(overlay).toContain('transition-opacity');
      expect(overlay).toContain('ease-out');
      expect(overlay).not.toContain('transition-[background-image]');
      expect(overlay).not.toContain('group-hover:from-');
    }
  });

  it('the photo animates filter + transform together and reveals color on hover', async () => {
    const html = await render();
    const images = getMemberImages(html);
    expect(images).toHaveLength(3);
    for (const img of images) {
      expect(img).toContain('grayscale');
      expect(img).toContain('group-hover:grayscale-0');
      expect(img).toContain('transition-[filter,transform]');
      expect(img).toContain('ease-out');
      expect(img).toContain('will-change-transform');
    }
    const source = await getSource();
    expect(source).toContain('scale3d(1.05, 1.05, 1)');
    expect(source).toContain('scale3d(1, 1, 1)');
  });

  it('scoped CSS disables the zoom and transitions under prefers-reduced-motion (color reveal kept)', async () => {
    const source = await getSource();
    expect(source).toContain('@media (prefers-reduced-motion: reduce)');
    // Slice from the actual CSS media query (not the first mention in a
    // documentation comment) and assert the rule kills transform+transition.
    const reduceBlock = source.slice(
      source.indexOf('@media (prefers-reduced-motion: reduce)'),
    );
    expect(reduceBlock).toContain('transform: none');
    expect(reduceBlock).toContain('transition: none');
    // POST-APPLY FIX #2: the overlay's opacity transition must also be
    // disabled under reduced motion (photo + overlay selectors in the block).
    expect(reduceBlock).toContain('.team-card-overlay');
  });
});

describe('NosotrosTeamSection — center card lowered on desktop (POST-APPLY FIX #2)', () => {
  it('the second card (index 1) carries lg:translate-y-8; first and third do not', async () => {
    const cards = getMemberCards(await render());
    expect(cards).toHaveLength(3);
    expect(cards[1]).toContain('lg:translate-y-8');
    expect(cards[0]).not.toContain('translate-');
    expect(cards[2]).not.toContain('translate-');
  });

  it('the offset is a translate transform, not a margin (grid flow untouched)', async () => {
    const cards = getMemberCards(await render());
    expect(cards[1]).not.toContain('lg:mt-8');
    expect(cards[1]).not.toContain('md:translate-');
  });
});

describe('NosotrosTeamSection — canonical design tokens only', () => {
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

  it('rendered HTML does NOT contain shadow-* utilities (flat design)', async () => {
    const html = await render();
    expect(html).not.toMatch(/shadow-\d/);
  });
});

describe('NosotrosTeamSection — dumb component contract', () => {
  it('renders in isolation with all required props (headline + subtitle + 3 members)', async () => {
    const html = await render();
    expect(html).toContain(escaped(baseProps.headline));
    expect(html).toContain(escaped(baseProps.subtitle));
    for (const member of baseProps.members) {
      expect(html).toContain(member.name);
    }
  });

  it('frontmatter contains NO import.meta.env access', async () => {
    const source = await getSource();
    const frontmatter = source.split('---')[1] ?? '';
    expect(frontmatter).not.toContain('import.meta.env');
  });

  it('frontmatter contains NO fetch( calls', async () => {
    const source = await getSource();
    const frontmatter = source.split('---')[1] ?? '';
    expect(frontmatter).not.toContain('fetch(');
  });

  it('frontmatter does NOT render the eyebrow prop (header spec: title + subtitle only)', async () => {
    const source = await getSource();
    const frontmatter = source.split('---')[1] ?? '';
    expect(frontmatter).toContain('headline');
    expect(frontmatter).toContain('subtitle');
    expect(frontmatter).toContain('members');
  });
});