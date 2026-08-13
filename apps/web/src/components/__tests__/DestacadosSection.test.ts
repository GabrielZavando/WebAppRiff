import { describe, it, expect } from 'vitest';
import type { DestacadosSectionProps } from '@/lib/types/destacados-section';
import { DESTACADOS_SECTION_CONTENT } from '@/lib/config/destacados-section';
import {
  renderDestacadosSection as render,
  forEachCard,
  getCardCta,
  getHeaderCta,
  countOccurrences,
  escapeRegex,
  stripHtmlComments,
} from './helpers/destacados-section-test-utils';

const baseProps: DestacadosSectionProps = DESTACADOS_SECTION_CONTENT;

describe('DestacadosSection — structure & outermost section', () => {
  it('renders a <section> as the outermost element', async () => {
    const html = await render();
    const stripped = stripHtmlComments(html).trim();
    expect(stripped.startsWith('<section')).toBe(true);
  });

  it('the <section> carries vertical padding utilities', async () => {
    const html = await render();
    const sectionMatch = html.match(/<section[^>]*>/);
    if (!sectionMatch) throw new Error('section not found');
    expect(sectionMatch[0]).toMatch(/py-\d+/);
    expect(sectionMatch[0]).toMatch(/md:py-\d+/);
  });

  it('the <section> carries the dark navy background token bg-secondary-dark', async () => {
    const html = await render();
    const sectionMatch = html.match(/<section[^>]*>/);
    if (!sectionMatch) throw new Error('section not found');
    expect(sectionMatch[0]).toContain('bg-secondary-dark');
    expect(sectionMatch[0]).not.toContain('bg-primary-deep');
  });

  it('the <section> contains a canonical container inner div', async () => {
    const html = await render();
    expect(html).toMatch(/<section[\s\S]*?<div[^>]*class="[^"]*\bcontainer\b[^"]*"/);
  });
});

describe('DestacadosSection — header row (headline + accent CTA)', () => {
  it('renders exactly one <h3> with the headline verbatim, text-white and font-heading', async () => {
    const html = await render();
    const h3Match = html.match(/<h3[\s\S]*?<\/h3>/);
    if (!h3Match) throw new Error('h3 not found');
    expect(h3Match[0]).toContain(baseProps.headline);
    expect(h3Match[0]).toContain('text-white');
    expect(h3Match[0]).toContain('font-heading');
  });

  it('the <h3> does NOT carry aria-hidden or tabindex=-1', async () => {
    const html = await render();
    const h3Open = html.match(/<h3[^>]*>/);
    if (!h3Open) throw new Error('h3 not found');
    expect(h3Open[0]).not.toContain('aria-hidden="true"');
    expect(h3Open[0]).not.toContain('tabindex="-1"');
  });

  it('renders the header CTA linking to ctaHref with the solid accent pattern', async () => {
    const html = await render();
    const a = getHeaderCta(html);
    expect(a).toContain(`href="${baseProps.ctaHref}"`);
    expect(a).toContain('bg-accent');
    expect(a).toContain('hover:bg-accent-dark');
    expect(a).toContain('text-white');
    expect(a).toContain('font-heading');
    expect(a).toContain('font-semibold');
    expect(a).toContain('uppercase');
    expect(a).toContain('text-xs');
    expect(a).toContain('tracking-wide');
    expect(a).toContain('px-6');
    expect(a).toContain('py-3');
    // Opening tag must not be hidden from assistive tech.
    expect(a).not.toContain('aria-hidden="true"');
    expect(a).not.toContain('tabindex="-1"');
  });

  it('the header CTA visible text equals ctaText verbatim', async () => {
    const html = await render();
    expect(html).toContain(baseProps.ctaText);
  });

  it('the header row lays CTA on the right: flex flex-col sm:flex-row justify-between', async () => {
    const html = await render();
    const headerDiv = html.match(
      /<div[^>]*class="[^"]*justify-between[^"]*"[^>]*>/,
    );
    if (!headerDiv) throw new Error('header row div not found');
    expect(headerDiv[0]).toContain('flex');
    expect(headerDiv[0]).toContain('flex-col');
    expect(headerDiv[0]).toContain('sm:flex-row');
    expect(headerDiv[0]).toContain('justify-between');
  });

  it('the header does NOT render an eyebrow span', async () => {
    const html = await render();
    const eyebrowSignature = html.match(
      /<(span|p|div)[^>]*class="[^"]*uppercase[^"]*(accent|accent-dark)[^"]*"[^>]*>/,
    );
    expect(eyebrowSignature).toBeNull();
  });

  it('the header does NOT render a teal underline bar (no h-1 w-16 bg-primary div)', async () => {
    const html = await render();
    const underlineSignature = html.match(
      /<div[^>]*class="[^"]*h-1[^"]*w-16[^"]*bg-primary[^"]*"[^>]*>/,
    );
    expect(underlineSignature).toBeNull();
  });
});

describe('DestacadosSection — card grid (1/2/4 mobile-first)', () => {
  it('renders a card grid with grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 and a gap utility', async () => {
    const html = await render();
    const gridMatch = html.match(
      /class="[^"]*grid-cols-1[^"]*sm:grid-cols-2[^"]*lg:grid-cols-4[^"]*"/,
    );
    if (!gridMatch) throw new Error('card grid not found');
    expect(gridMatch[0]).toContain('grid-cols-1');
    expect(gridMatch[0]).toContain('sm:grid-cols-2');
    expect(gridMatch[0]).toContain('lg:grid-cols-4');
    expect(gridMatch[0]).toMatch(/gap-\d+/);
  });

  it('renders exactly 4 <article> cards', async () => {
    const html = await render();
    expect(countOccurrences(html, '<article')).toBe(4);
  });
});

describe('DestacadosSection — card structure (white raised card with image mat)', () => {
  it('each card carries bg-white, shadow-2, hover:shadow-4 and transition-shadow', async () => {
    const html = await render();
    forEachCard(html, (card) => {
      expect(card).toContain('bg-white');
      expect(card).toContain('shadow-2');
      expect(card).toContain('hover:shadow-4');
      expect(card).toContain('transition-shadow');
    });
  });

  it('each card has an image mat area with padding wrapping the image with object-contain', async () => {
    const html = await render();
    forEachCard(html, (card) => {
      expect(card).toMatch(/<div[^>]*class="[^"]*\bp-4\b[^"]*"/);
      const img = card.match(/<img[^>]*>/);
      if (!img) throw new Error('card image not found');
      expect(img[0]).toContain('object-contain');
    });
  });

  it('each card does NOT render a price (no $ prefixed text)', async () => {
    const html = await render();
    expect(html).not.toMatch(/\$\d/);
    forEachCard(html, (card) => {
      expect(card).not.toMatch(/\$\d/);
    });
  });
});

describe('DestacadosSection — card image (lazy, alt, astro:assets)', () => {
  it('each card image carries loading="lazy" and a non-empty alt', async () => {
    const html = await render();
    forEachCard(html, (card) => {
      const img = card.match(/<img[^>]*>/);
      if (!img) throw new Error('card image not found');
      expect(img[0]).toContain('loading="lazy"');
      const alt = img[0].match(/alt="([^"]*)"/);
      expect(alt).not.toBeNull();
      expect(alt![1]!.length).toBeGreaterThan(0);
    });
  });

  it('each card image alt is NOT identical to the card h4 title (describes the photo)', async () => {
    const html = await render();
    forEachCard(html, (card) => {
      const alt = card.match(/<img[^>]*alt="([^"]*)"/);
      const h4 = card.match(/<h4[^>]*>([\s\S]*?)<\/h4>/);
      if (!alt || !h4) throw new Error('card image alt or h4 title not found');
      expect(alt[1]!.trim()).not.toBe(h4[1]!.trim());
    });
  });

  it('each card image resolves to an astro:assets optimized path with width/height', async () => {
    const html = await render();
    forEachCard(html, (card) => {
      const img = card.match(/<img[^>]*>/);
      if (!img) throw new Error('card image not found');
      expect(img[0]).not.toMatch(/src="[^"]*(assets\/img|\/@fs\/)/);
      expect(img[0]).toMatch(/src="\/_(astro|image)\?/);
      expect(img[0]).toMatch(/width=/);
      expect(img[0]).toMatch(/height=/);
    });
  });
});

describe('DestacadosSection — card content', () => {
  it('each card renders an <h4> with the title verbatim, text-secondary and font-heading', async () => {
    const html = await render();
    for (const product of baseProps.products) {
      const h4Match = html.match(
        new RegExp(`<h4[^>]*>[\\s\\S]*?${escapeRegex(product.titulo)}[\\s\\S]*?<\\/h4>`),
      );
      if (!h4Match) {
        throw new Error(`h4 not found for title="${product.titulo}"`);
      }
      expect(h4Match[0]).toContain('text-secondary');
      expect(h4Match[0]).toContain('font-heading');
    }
  });

  it('long product titles carry the line-clamp-3 utility', async () => {
    const html = await render();
    const h4s = html.match(/<h4[^>]*>[\s\S]*?<\/h4>/g) ?? [];
    expect(h4s.length).toBe(4);
    for (const h4 of h4s) {
      expect(h4).toContain('line-clamp-3');
    }
  });
});

describe('DestacadosSection — card CTA (outline primary "Cotizar")', () => {
  it('each card CTA links to /productos/{slug}', async () => {
    const html = await render();
    forEachCard(html, (card, product) => {
      expect(getCardCta(card)).toContain(`href="/productos/${product.slug}"`);
    });
  });

  it('each card CTA visible text is exactly "Cotizar" (not SOLICITAR COTIZACIÓN)', async () => {
    const html = await render();
    forEachCard(html, (card) => {
      const a = card.match(/<a\s[^>]*>[\s\S]*?<\/a>/);
      if (!a) throw new Error('card CTA <a> not found');
      expect(a[0]).toContain('Cotizar');
      expect(a[0]).not.toContain('SOLICITAR COTIZACIÓN');
      expect(a[0]).not.toContain('Cotización');
    });
  });

  it('each card CTA follows the outline primary button pattern', async () => {
    const html = await render();
    forEachCard(html, (card) => {
      const a = getCardCta(card);
      expect(a).toContain('border-2');
      expect(a).toContain('border-primary');
      expect(a).toContain('text-primary');
      expect(a).toContain('hover:bg-primary');
      expect(a).toContain('hover:text-white');
      expect(a).toContain('font-heading');
      expect(a).toContain('font-semibold');
      expect(a).toContain('uppercase');
      expect(a).toContain('text-xs');
      expect(a).toContain('tracking-wide');
      expect(a).toContain('px-4');
      expect(a).toContain('py-3');
      expect(a).toContain('transition-colors');
      // Opening tag must not be hidden from assistive tech.
      expect(a).not.toContain('aria-hidden="true"');
      expect(a).not.toContain('tabindex="-1"');
    });
  });
});

describe('DestacadosSection — heading outline', () => {
  it('does NOT render <h1> or <h2>', async () => {
    const html = await render();
    expect(html).not.toMatch(/<h1/);
    expect(html).not.toMatch(/<h2/);
  });

  it('renders exactly one <h3> and exactly 4 <h4>', async () => {
    const html = await render();
    expect(countOccurrences(html, '<h3')).toBe(1);
    expect(countOccurrences(html, '<h4')).toBe(4);
  });
});

describe('DestacadosSection — design tokens', () => {
  it('does NOT contain literal hex color values', async () => {
    const html = await render();
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('does NOT contain deprecated brand-* tokens', async () => {
    const html = await render();
    expect(html).not.toMatch(/brand-(teal|navy|orange|gray)/);
  });

  it('does NOT contain any rounded-* utility (flat design)', async () => {
    const html = await render();
    expect(html).not.toMatch(/rounded\b/);
  });
});

describe('DestacadosSection — icons', () => {
  it('renders NO svg icons (no lucide or other icon set)', async () => {
    const html = await render();
    expect(html).not.toMatch(/<svg/);
    expect(html).not.toMatch(/lucide:/);
  });
});

describe('DestacadosSection — dumb component', () => {
  it('the frontmatter does NOT contain import.meta.env', async () => {
    const source = await import(
      /* @vite-ignore */ '@/components/DestacadosSection.astro?raw'
    ).then((m) => String(m.default));
    expect(source).not.toContain('import.meta.env');
  });

  it('the frontmatter does NOT contain fetch(', async () => {
    const source = await import(
      /* @vite-ignore */ '@/components/DestacadosSection.astro?raw'
    ).then((m) => String(m.default));
    expect(source).not.toContain('fetch(');
  });
});

describe('DestacadosSection — content config', () => {
  it('DESTACADOS_SECTION_CONTENT has the documented shape with non-empty fields', async () => {
    expect(baseProps.headline.length).toBeGreaterThan(0);
    expect(baseProps.ctaText.length).toBeGreaterThan(0);
    expect(baseProps.ctaHref.length).toBeGreaterThan(0);
    expect(baseProps.ctaHref).toContain('/');
    expect(baseProps.products).toHaveLength(4);
  });

  it('FEATURED_PRODUCTS titles in render order are exactly the client-specified titles', async () => {
    const titles = baseProps.products.map((p) => p.titulo);
    expect(titles).toEqual([
      'Antiincrustante Bimaks 420 para Ósmosis Inversa (Agua Salobre)',
      'Flujómetro Universal',
      'Medidor Ultrasónico Doppler Portátil Fullsonic (No Invasivo)',
      'MWN – MEDIDOR INDUSTRIAL PARA AGUA FRÍA LIMPIA – MEDIDOR TIPO WOLTMAN',
    ]);
  });

  it('every product imports the correct client image file per card index', async () => {
    // `src` covers ImageMetadata; the guard tolerates bare-string asset imports.
    const sources = baseProps.products.map((p) =>
      typeof p.imagen === 'string' ? p.imagen : p.imagen.src,
    );
    expect(sources[0]).toContain('antiincrustante-Bimaks.png');
    expect(sources[1]).toContain('flujometro-multiproposito.webp');
    expect(sources[2]).toContain('FULLSONIC-DOPPLER-CONTABLE.webp');
    expect(sources[3]).toContain('MWN-DN50.webp');
  });
});

describe('DestacadosSection — snapshot', () => {
  it('matches the snapshot for base props', async () => {
    const html = await render();
    expect(html).toMatchSnapshot();
  });
});