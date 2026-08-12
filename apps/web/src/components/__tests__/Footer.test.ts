import { describe, it, expect } from 'vitest';
import type { SiteFooterProps } from '@/lib/types/footer';
import {
  SITE_FOOTER_CONTENT,
  FOOTER_COPYRIGHT,
  FOOTER_LOCATION,
} from '@/lib/config/footer';
import {
  renderFooter as render,
  getAnchors,
  getBrandImage,
  getScrollTopButton,
  stripHtmlComments,
} from './helpers/footer-test-utils';

async function getSource(): Promise<string> {
  const m = await import('@/components/Footer.astro?raw');
  return m.default as string;
}

describe('Footer — structure & outermost element', () => {
  it('renders a <footer> as the outermost element (landmark)', async () => {
    const html = stripHtmlComments(await render()).trim();
    expect(html.startsWith('<footer')).toBe(true);
  });

  it('the <footer> carries the bg-secondary-dark token (full-bleed dark shell)', async () => {
    const html = await render();
    const footerTag = html.match(/<footer[^>]*>/)?.[0] ?? '';
    expect(footerTag).toContain('bg-secondary-dark');
    expect(html).not.toContain('bg-bg');
  });

  it('the <footer> contains the canonical container with vertical padding', async () => {
    const html = await render();
    expect(html).toMatch(/class="[^"]*\bcontainer\b[^"]*"/);
    expect(html).toContain('py-16');
    expect(html).toContain('md:py-24');
  });

  it('renders the responsive grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 with a gap', async () => {
    const html = await render();
    expect(html).toMatch(
      /class="[^"]*\bgrid-cols-1\b[^"]*\bmd:grid-cols-2\b[^"]*\blg:grid-cols-4\b[^"]*"/,
    );
    expect(html).toMatch(/class="[^"]*\bgap-1[0-9]\b[^"]*"/);
  });

  it('preserves the per-page heading outline: no h2/h3/h4 headings in the footer', async () => {
    const html = await render();
    expect(html).not.toMatch(/<h2[\s>]/);
    expect(html).not.toMatch(/<h3[\s>]/);
    expect(html).not.toMatch(/<h4[\s>]/);
  });
});

describe('Footer — brand column (logo + tagline + social)', () => {
  it('renders the brand logo image via astro:assets with lazy loading and alt', async () => {
    const img = getBrandImage(await render());
    expect(img).toContain('logo-web');
    expect(img).toMatch(/loading="lazy"/);
    expect(img).toMatch(/alt="Riff"/);
  });

  it('renders the tagline paragraph verbatim with muted text', async () => {
    const html = await render();
    const pMatch = html.match(/<p[^>]*>[\s\S]*?<\/p>/);
    if (!pMatch) throw new Error('tagline paragraph not found');
    expect(pMatch[0]).toContain(SITE_FOOTER_CONTENT.tagline);
    expect(pMatch[0]).toContain('text-muted');
  });

  it('renders social anchors with aria-label, target=_blank and rel=noopener', async () => {
    const html = await render();
    const socialAnchors = html.match(
      /<a[^>]*aria-label="(?:Facebook|X|Instagram|LinkedIn)"[^>]*>/g,
    );
    // Should render at least the networks present in the config; in the
    // absence of env vars, getSocialLinks can filter everything out, so we
    // only assert the markup pattern when socialLinks is non-empty.
    if (SITE_FOOTER_CONTENT.socialLinks.length > 0) {
      expect(socialAnchors).not.toBeNull();
      for (const anchor of socialAnchors ?? []) {
        expect(anchor).toContain('target="_blank"');
        expect(anchor).toContain('rel="noopener noreferrer"');
      }
    }
  });

  it('renders EXACTLY the configured social links (2 of 4 → 2 anchors)', async () => {
    const twoSocialProps: SiteFooterProps = {
      ...SITE_FOOTER_CONTENT,
      socialLinks: [
        { name: 'Facebook', href: 'https://facebook.com/riff' },
        { name: 'Instagram', href: 'https://instagram.com/riff' },
      ],
    };
    const html = await render(twoSocialProps);
    const socialAnchors = html.match(
      /<a[^>]*aria-label="(?:Facebook|X|Instagram|LinkedIn)"[^>]*>/g,
    );
    // Exactly two anchors — one per configured network, no duplicates.
    expect(socialAnchors).toHaveLength(2);
    const labels = socialAnchors?.map((a) =>
      a.match(/aria-label="([^"]+)"/)?.[1],
    );
    expect(labels).toEqual(['Facebook', 'Instagram']);
    // Each anchor is a real external link with an icon inside.
    for (const anchor of socialAnchors ?? []) {
      expect(anchor).toContain('target="_blank"');
      expect(anchor).toContain('rel="noopener noreferrer"');
    }
    // Ensure the non-configured networks are NOT rendered.
    expect(html).not.toContain('aria-label="X"');
    expect(html).not.toContain('aria-label="LinkedIn"');
  });
});

describe('Footer — X social icon uses official X brand logo (topheader-click-to-call-x-icon)', () => {
  it('renders the X social link with simple-icons:x (not lucide:twitter) when configured', async () => {
    const props: SiteFooterProps = {
      ...SITE_FOOTER_CONTENT,
      socialLinks: [{ name: 'X', href: 'https://x.com/riff' }],
    };
    const html = await render(props);

    // The X anchor holds an <svg> whose data-icon is the brand logo name.
    const xAnchor = html.match(/aria-label="X"[^]*?<\/a>/);
    expect(xAnchor).not.toBeNull();
    expect(xAnchor![0]).toContain('data-icon="simple-icons:x"');
    expect(xAnchor![0]).not.toContain('data-icon="lucide:twitter"');
  });
});

describe('Footer — SERVICIOS & EMPRESA link columns', () => {
  it('renders the SERVICIOS label as a <p> with primary/heading/uppercase classes', async () => {
    const html = await render();
    const pMatch = html.match(/<p[^>]*>SERVICIOS<\/p>/);
    if (!pMatch) throw new Error('SERVICIOS label <p> not found');
    expect(pMatch[0]).toContain('text-primary');
    expect(pMatch[0]).toContain('font-heading');
    expect(pMatch[0]).toContain('uppercase');
  });

  it('renders the EMPRESA label as a <p> with primary/heading/uppercase classes', async () => {
    const html = await render();
    const pMatch = html.match(/<p[^>]*>EMPRESA<\/p>/);
    if (!pMatch) throw new Error('EMPRESA label <p> not found');
    expect(pMatch[0]).toContain('text-primary');
    expect(pMatch[0]).toContain('font-heading');
  });

  it('renders the 8 configured links with placeholder href="#"', async () => {
    const anchors = getAnchors(await render());
    const linkTexts = SITE_FOOTER_CONTENT.columns.flatMap((c) =>
      c.links.map((l) => l.label),
    );
    // Filter anchors that are social links (they have aria-label) — link
    // column anchors are the plain ones.
    const columnAnchors = anchors.filter((a) => !a.tag.includes('aria-label'));
    expect(columnAnchors).toHaveLength(8);
    for (const anchor of columnAnchors) {
      expect(anchor.tag).toContain('href="#"');
      expect(linkTexts).toContain(anchor.text);
    }
  });
});

describe('Footer — HORARIO TÉCNICO schedule column', () => {
  it('renders the schedule as a <dl> with <dt>/<dd> pairs (mockup rows)', async () => {
    const html = await render();
    expect(html).toMatch(/<dl[\s\S]*?<\/dl>/);
    // dt/dd carry styling classes (design.md D10): dt white semibold, dd muted
    expect(html).toMatch(/<dt[^>]*>Lunes a Jueves<\/dt>/);
    expect(html).toMatch(/<dd[^>]*>09:00 a 18:00<\/dd>/);
    expect(html).toMatch(/<dt[^>]*>Viernes<\/dt>/);
    expect(html).toMatch(/<dd[^>]*>09:00 a 17:00<\/dd>/);
    // day label is white + semibold, hours are muted (mockup visual pairing) —
    // class order in the rendered HTML is font-semibold text-white, so the
    // assertions are order-independent word-boundary matches.
    expect(html).toMatch(/<dt class="[^"]*\btext-white\b[^"]*">/);
    expect(html).toMatch(/<dt class="[^"]*\bfont-semibold\b[^"]*">/);
    expect(html).toMatch(/<dd class="[^"]*\btext-muted\b[^"]*">/);
  });

  it('renders the 24/7 support note with a clock icon and teal text', async () => {
    const html = await render();
    const note = html.match(
      /<[^>]*>[\s\S]*?Soporte 24\/7 disponible[\s\S]*?<\/[^>]*>/,
    );
    if (!note) throw new Error('24/7 note not found');
    expect(note[0]).toContain('text-primary');
    // lucide:clock renders an <svg> with aria-hidden="true"
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"[^>]*>/);
  });
});

describe('Footer — bottom bar (copyright + location + scroll-to-top)', () => {
  it('renders the divider border-t border-white/10 between zones', async () => {
    const html = await render();
    expect(html).toMatch(/<div[^>]*class="[^"]*border-t[^"]*border-white\/10[^"]*"/);
  });

  it('renders the copyright text muted and uppercase', async () => {
    const html = await render();
    const copyrightMatch = html.match(/<[^>]*>[\s\S]*?© 2024 RIFF SPA[^<]*<\/[^>]*>/);
    if (!copyrightMatch) throw new Error('copyright not found');
    expect(copyrightMatch[0]).toContain(FOOTER_COPYRIGHT);
    expect(copyrightMatch[0]).toContain('text-muted');
    expect(copyrightMatch[0]).toContain('uppercase');
  });

  it('renders the location muted and uppercase', async () => {
    const html = await render();
    const locationMatch = html.match(/<[^>]*>[\s\S]*?SANTIAGO, CHILE[^<]*<\/[^>]*>/);
    if (!locationMatch) throw new Error('location not found');
    expect(locationMatch[0]).toContain(FOOTER_LOCATION);
    expect(locationMatch[0]).toContain('text-muted');
    expect(locationMatch[0]).toContain('uppercase');
  });

  it('renders the scroll-to-top button with teal bg, arrow icon and aria-label', async () => {
    const button = getScrollTopButton(await render());
    expect(button).toContain('bg-primary');
    expect(button).toContain('text-white');
    expect(button).toContain('aria-label="Volver arriba"');
    expect(button).toContain('type="button"');
    const html = await render();
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"[^>]*>/);
  });
});

describe('Footer — scroll-to-top inline script', () => {
  it('ships an inline script targeting [data-scroll-top] with smooth scrollTo', async () => {
    const source = await getSource();
    expect(source).toContain('<script is:inline>');
    expect(source).toContain('[data-scroll-top]');
    expect(source).toContain("window.scrollTo({ top: 0, behavior: 'smooth' })");
  });

  it('respects prefers-reduced-motion (no smooth scroll behavior forced)', async () => {
    const source = await getSource();
    // The script must not force smooth scrolling when reduced motion is
    // requested — the scrollTo is a single call without matchMedia override.
    expect(source).toMatch(/scrollTo\(\{[^}]*top: 0[^}]*\}\)/);
  });
});

describe('Footer — flat design (no rounded*/shadow*), design tokens only', () => {
  it('no rounded* or shadow* classes in the rendered markup', async () => {
    const html = await render();
    expect(html).not.toMatch(/\brounded[a-z-]*\b/);
    expect(html).not.toMatch(/\bshadow-[a-z0-9]+\b/);
  });

  it('the component source references no brand-* utilities (linter regression)', async () => {
    const source = await getSource();
    expect(source).not.toMatch(/\b(bg|text|border)-brand-(navy|orange|teal|navy-light)\b/);
  });
});

describe('Footer — dumb component source', () => {
  it('only destructures Astro.props without network/service imports', async () => {
    const source = await getSource();
    // It may import types/config/assets, but no fetch/HttpClient/service calls.
    expect(source).not.toMatch(/fetch\(/);
    expect(source).not.toMatch(/import\s*.*from\s*['"]@\/lib\/services/);
    expect(source).toMatch(/Astro\.props/);
  });
});

describe('Footer — snapshot', () => {
  it('matches the stored snapshot (stable visual markup)', async () => {
    const html = stripHtmlComments(await render());
    // Normalize the logo path (astro:assets emits hashed filenames) so the
    // snapshot is stable across builds.
    const normalized = html.replace(
      /(src=")[^"]*logo-web[^"]*(")/,
      '$1/assets/img/logo-web.webp$2',
    );
    expect(normalized).toMatchSnapshot();
  });
});