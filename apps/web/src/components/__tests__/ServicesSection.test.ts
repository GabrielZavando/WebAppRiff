import { describe, it, expect } from 'vitest';
import type { ServicesSectionProps } from '@/lib/types/services-section';
import { SERVICES_SECTION_CONTENT } from '@/lib/config/services-section';
import {
  renderServicesSection as render,
  forEachCard,
  getCardCta,
  getBottomWrapper,
  countOccurrences,
  escapeRegex,
  stripHtmlComments,
} from './helpers/services-section-test-utils';

const baseProps: ServicesSectionProps = SERVICES_SECTION_CONTENT;

describe('ServicesSection — structure & outermost section', () => {
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
  });

  it('the <section> contains a canonical container inner div', async () => {
    const html = await render();
    expect(html).toMatch(/<section[\s\S]*?<div[^>]*class="[^"]*\bcontainer\b[^"]*"/);
  });
});

describe('ServicesSection — header (centered, no eyebrow, no underline)', () => {
  it('the header block carries text-center', async () => {
    const html = await render();
    const headerDiv = html.match(/<div[^>]*class="[^"]*text-center[^"]*"/);
    if (!headerDiv) throw new Error('centered header div not found');
    expect(headerDiv[0]).toContain('text-center');
  });

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

  it('renders the description <p> with text-muted and max-w-2xl', async () => {
    const html = await render();
    const pMatches = html.match(/<p[^>]*>[\s\S]*?<\/p>/g) ?? [];
    const descP = pMatches.find((p) => p.includes(baseProps.description));
    if (!descP) throw new Error('description <p> not found');
    expect(descP).toContain('text-muted');
    expect(descP).toContain('max-w-2xl');
  });

  it('the header does NOT render an eyebrow (no uppercase accent span)', async () => {
    const html = await render();
    const eyebrowSignature = html.match(
      /<(span|p|div)[^>]*class="[^"]*uppercase[^"]*(accent|accent-dark)[^"]*"[^>]*>/,
    );
    expect(eyebrowSignature).toBeNull();
  });

  it('the header does NOT render a teal underline bar (no h-1 w-16 bg-primary div)', async () => {
    const html = await render();
    const underlineSignature = html.match(/<div[^>]*class="[^"]*h-1[^"]*w-16[^"]*bg-primary[^"]*"[^>]*>/);
    expect(underlineSignature).toBeNull();
  });
});

describe('ServicesSection — card grid (2x2 mobile-first)', () => {
  it('renders a card grid with grid-cols-1 md:grid-cols-2 and a gap utility', async () => {
    const html = await render();
    const gridMatch = html.match(
      /class="[^"]*grid-cols-1[^"]*md:grid-cols-2[^"]*"/,
    );
    if (!gridMatch) throw new Error('card grid not found');
    expect(gridMatch[0]).toContain('grid-cols-1');
    expect(gridMatch[0]).toContain('md:grid-cols-2');
    expect(gridMatch[0]).toMatch(/gap-\d+/);
  });

  it('the card grid does NOT carry sm:grid-cols-2 or lg:grid-cols-4 (SolutionSection layout)', async () => {
    const html = await render();
    const gridMatch = html.match(
      /class="[^"]*grid-cols-1[^"]*md:grid-cols-2[^"]*"/,
    );
    if (!gridMatch) throw new Error('card grid not found');
    expect(gridMatch[0]).not.toContain('sm:grid-cols-2');
    expect(gridMatch[0]).not.toContain('lg:grid-cols-4');
  });

  it('renders exactly 4 <article> cards', async () => {
    const html = await render();
    expect(countOccurrences(html, '<article')).toBe(4);
  });
});

describe('ServicesSection — card layout (horizontal, mobile-first)', () => {
  it('each card carries bg-secondary, border-secondary-light, overflow-hidden', async () => {
    const html = await render();
    forEachCard(html, (card) => {
      expect(card).toContain('bg-secondary');
      expect(card).toContain('border');
      expect(card).toContain('border-secondary-light');
      expect(card).toContain('overflow-hidden');
    });
  });

  it('each card carries flex flex-col sm:flex-row', async () => {
    const html = await render();
    forEachCard(html, (card) => {
      expect(card).toContain('flex');
      expect(card).toContain('flex-col');
      expect(card).toContain('sm:flex-row');
    });
  });

  it('no card applies a shadow utility (flat design)', async () => {
    const html = await render();
    forEachCard(html, (card) => {
      expect(card).not.toMatch(/shadow-[1-5]/);
    });
  });
});

describe('ServicesSection — card image (full color, lazy, alt)', () => {
  it('each card image is rendered full-color (no grayscale filter)', async () => {
    const html = await render();
    forEachCard(html, (card) => {
      const img = card.match(/<img[^>]*>/);
      if (!img) throw new Error('card image not found');
      expect(img[0]).not.toContain('grayscale');
    });
  });

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
      // The image must be processed by astro:assets (spec scenario "Images are
      // processed by astro:assets"): its src is an optimized endpoint
      // (`/_astro/...` in build output, `/_image?...` in dev/test AstroContainer)
      // rather than a raw `apps/web/src/assets/img/...` path.
      expect(img[0]).not.toMatch(/src="[^"]*(assets\/img|\/@fs\/)/);
      expect(img[0]).toMatch(/src="\/_(astro|image)\?/);
      expect(img[0]).toMatch(/width=/);
      expect(img[0]).toMatch(/height=/);
    });
  });
});

describe('ServicesSection — card content', () => {
  it('each card renders an <h4> with the title verbatim, text-primary and font-heading', async () => {
    const html = await render();
    for (const service of baseProps.services) {
      const h4Match = html.match(
        new RegExp(`<h4[^>]*>[\\s\\S]*?${escapeRegex(service.title)}[\\s\\S]*?<\\/h4>`),
      );
      if (!h4Match) {
        throw new Error(`h4 not found for title="${service.title}"`);
      }
      expect(h4Match[0]).toContain('text-primary');
      expect(h4Match[0]).toContain('font-heading');
    }
  });

  it('each card renders a <p> with the description verbatim and text-muted', async () => {
    const html = await render();
    for (const service of baseProps.services) {
      const pMatches = html.match(/<p[^>]*>[\s\S]*?<\/p>/g) ?? [];
      const descP = pMatches.find((p) => p.includes(service.description));
      if (!descP) {
        throw new Error(`description <p> not found for "${service.title}"`);
      }
      expect(descP).toContain('text-muted');
    }
  });
});

describe('ServicesSection — card CTA (design-system solid button)', () => {
  it('each card CTA links to /servicios', async () => {
    const html = await render();
    forEachCard(html, (card) => {
      expect(getCardCta(card)).toContain('href="/servicios"');
    });
  });

  it('each card CTA visible text is the service ctaLabel "Ver detalles" (POST-APPLY UPDATE)', async () => {
    const html = await render();
    forEachCard(html, (card, service) => {
      const a = card.match(/<a\s[^>]*>[\s\S]*?<\/a>/);
      if (!a) throw new Error('card CTA <a> not found');
      expect(a[0]).toContain('Ver detalles');
      expect(a[0]).toContain(service.ctaLabel);
      // The card CTA must NOT reuse the bottom CTA label "Ver todos los servicios".
      expect(a[0]).not.toContain('Ver todos los servicios');
    });
  });

  it('each card CTA follows the solid primary button pattern', async () => {
    const html = await render();
    forEachCard(html, (card) => {
      const a = getCardCta(card);
      expect(a).toContain('bg-primary');
      expect(a).toContain('hover:bg-primary-dark');
      expect(a).toContain('text-white');
      expect(a).toContain('inline-flex');
      expect(a).toContain('px-6');
      expect(a).toContain('py-3');
      expect(a).toContain('font-heading');
      expect(a).toContain('font-semibold');
      expect(a).toContain('uppercase');
      expect(a).toContain('text-xs');
      expect(a).toContain('tracking-wide');
      expect(a).toContain('transition-colors');
      // A plain text link (only text-accent/text-primary, no background) is NOT compliant.
      expect(a).not.toMatch(/class="[^"]*\btext-accent\b[^"]*"/);
      expect(a).not.toMatch(/class="[^"]*\btext-primary\b[^"]*"/);
      // Opening tag must not be hidden from assistive tech.
      expect(a).not.toContain('aria-hidden="true"');
      expect(a).not.toContain('tabindex="-1"');
    });
  });

  it('each card CTA contains a decorative arrow svg with aria-hidden', async () => {
    const html = await render();
    forEachCard(html, (card) => {
      const a = card.match(/<a\s[^>]*>[\s\S]*?<\/a>/);
      if (!a) throw new Error('card CTA <a> not found');
      expect(a[0]).toContain('<svg');
      expect(a[0]).toContain('aria-hidden="true"');
    });
  });
});

describe('ServicesSection — bottom CTA (centered, larger)', () => {
  it('renders a text-center wrapper AFTER the card grid with the bottom CTA', async () => {
    const html = await render();
    const wrapper = getBottomWrapper(html);
    expect(wrapper).toContain('text-center');
    expect(wrapper).toContain('<a');
  });

  it('the bottom CTA links to /servicios', async () => {
    const html = await render();
    expect(getBottomWrapper(html)).toContain('href="/servicios"');
  });

  it('the bottom CTA visible text includes "Ver todos los servicios"', async () => {
    const html = await render();
    expect(html).toContain('Ver todos los servicios');
  });

  it('the bottom CTA follows the larger solid button pattern (px-8 py-4 text-sm)', async () => {
    const html = await render();
    const wrapper = getBottomWrapper(html);
    const aOpen = wrapper.match(/<a\s[^>]*>/);
    if (!aOpen) throw new Error('bottom CTA <a> not found');
    const a = aOpen[0];
    expect(a).toContain('bg-primary');
    expect(a).toContain('hover:bg-primary-dark');
    expect(a).toContain('text-white');
    expect(a).toContain('inline-flex');
    expect(a).toContain('items-center');
    expect(a).toContain('gap-2');
    expect(a).toContain('font-heading');
    expect(a).toContain('font-semibold');
    expect(a).toContain('uppercase');
    expect(a).toContain('text-sm');
    expect(a).toContain('tracking-wide');
    expect(a).toContain('px-8');
    expect(a).toContain('py-4');
    expect(a).toContain('transition-colors');
    // Opening tag must not be hidden from assistive tech.
    expect(a).not.toContain('aria-hidden="true"');
    expect(a).not.toContain('tabindex="-1"');
  });

  it('the bottom CTA contains a decorative arrow svg with aria-hidden', async () => {
    const html = await render();
    const wrapper = getBottomWrapper(html);
    expect(wrapper).toContain('<svg');
    expect(wrapper).toContain('aria-hidden="true"');
  });
});

describe('ServicesSection — heading outline', () => {
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

  it('the <h3> does NOT carry aria-hidden or tabindex=-1', async () => {
    const html = await render();
    const h3Open = html.match(/<h3[^>]*>/);
    if (!h3Open) throw new Error('h3 not found');
    expect(h3Open[0]).not.toContain('aria-hidden="true"');
    expect(h3Open[0]).not.toContain('tabindex="-1"');
  });
});

describe('ServicesSection — design tokens', () => {
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

describe('ServicesSection — dumb component', () => {
  it('the frontmatter does NOT contain import.meta.env', async () => {
    const source = await import(
      /* @vite-ignore */ '@/components/ServicesSection.astro?raw'
    ).then((m) => String(m.default));
    expect(source).not.toContain('import.meta.env');
  });

  it('the frontmatter does NOT contain fetch(', async () => {
    const source = await import(
      /* @vite-ignore */ '@/components/ServicesSection.astro?raw'
    ).then((m) => String(m.default));
    expect(source).not.toContain('fetch(');
  });
});

describe('ServicesSection — content config', () => {
  it('SERVICES_SECTION_CONTENT has the documented shape with non-empty fields', async () => {
    expect(baseProps.headline.length).toBeGreaterThan(0);
    expect(baseProps.description.length).toBeGreaterThan(0);
    expect(baseProps.services).toHaveLength(4);
    expect(baseProps.cta.label.length).toBeGreaterThan(0);
    expect(baseProps.cta.href.length).toBeGreaterThan(0);
    expect(baseProps.cta.href).toContain('/');
  });

  it('SERVICES_DATA titles in render order are exactly the spec titles', async () => {
    const titles = baseProps.services.map((s) => s.title);
    expect(titles).toEqual([
      'Medición en Edificios',
      'Medición Industrial',
      'Obras y Proyectos',
      'Tratamiento de Agua y Desalinización',
    ]);
  });

  it('SERVICES_DATA descriptions in render order match the spec exactly', async () => {
    const descriptions = baseProps.services.map((s) => s.description);
    expect(descriptions).toEqual([
      'Instalación y recambio de medidores de agua caliente en comunidades.',
      'Instalación y puesta en marcha de sistemas de medición de caudal.',
      'Desarrollo de infraestructura para sistemas de medición y control.',
      'Diseño y optimización de plantas de tratamiento con tecnología de vanguardia.',
    ]);
  });

  it('every SERVICE href equals /servicios', async () => {
    for (const service of baseProps.services) {
      expect(service.href).toBe('/servicios');
    }
  });

  it('every SERVICE imageAlt is a non-empty string', async () => {
    for (const service of baseProps.services) {
      expect(service.imageAlt.length).toBeGreaterThan(0);
    }
  });

  it('SERVICES_DATA imports the correct image file per card index', async () => {
    // `src` covers ImageMetadata; the guard tolerates bare-string asset imports.
    const sources = baseProps.services.map((s) =>
      typeof s.image === 'string' ? s.image : s.image.src,
    );
    expect(sources[0]).toContain('edificios.jpg');
    expect(sources[1]).toContain('medidores-de-agua.webp');
    expect(sources[2]).toContain('planta-tratamiento.webp');
    expect(sources[3]).toContain('osmosis-inversa.jpg');
  });

  it('every SERVICE ctaLabel is exactly "Ver detalles" (POST-APPLY UPDATE)', async () => {
    for (const service of baseProps.services) {
      expect(service.ctaLabel).toBe('Ver detalles');
    }
  });

  it('the cta block carries "Ver todos los servicios" and /servicios', async () => {
    expect(baseProps.cta.label).toBe('Ver todos los servicios');
    expect(baseProps.cta.href).toBe('/servicios');
  });
});

describe('ServicesSection — snapshot', () => {
  it('matches the snapshot for base props', async () => {
    const html = await render();
    expect(html).toMatchSnapshot();
  });
});