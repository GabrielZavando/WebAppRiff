import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import NosotrosHero from '@/components/NosotrosHero.astro';
import type { NosotrosHeroProps } from '@/lib/types/nosotros-page';
import { NOSOTROS_PAGE_CONTENT } from '@/lib/config/nosotros-page';

const baseProps: NosotrosHeroProps = NOSOTROS_PAGE_CONTENT.hero;

async function render(props: NosotrosHeroProps = baseProps): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(NosotrosHero, { props: { ...props } });
}

// Strip HTML comments so literal mentions of tokens inside comments don't
// count as violations.
function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

// Unescapes the entities Astro emits in text nodes (`&` → `&amp;`, …) so
// assertions can use the verbatim copy from the reference.
function unescapeHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// Strip HTML tags so the highlighted `<span>` doesn't break contiguous text.
function stripTags(html: string): string {
  return unescapeHtml(stripComments(html).replace(/<[^>]+>/g, ''));
}

/**
 * Behavioural contract for `NosotrosHero.astro` (change `nosotros-page`,
 * SC-201/SC-202): the institutional hero renders the page's single `<h1>`
 * ("SOMOS RIFF" with the brand-highlight token), the verbatim copy, two CTAs
 * (`/contacto` real route — never `#contacto` — and the `#historia` anchor)
 * and a local placeholder image with a non-empty alt, on a dark token
 * background, flat design (no hex, no rounded) and Lucide-only icons.
 */
describe('NosotrosHero — h1 and headline highlight (SC-201)', () => {
  it('renders exactly one <h1> containing "SOMOS" and "RIFF"', async () => {
    const html = await render();
    const h1Matches = html.match(/<h1[\s\S]*?<\/h1>/g) ?? [];
    expect(h1Matches).toHaveLength(1);
    expect(stripTags(html)).toContain('SOMOS');
    expect(stripTags(html)).toContain('RIFF');
  });

  it('wraps the highlighted word in a span with the brand token text-primary', async () => {
    const html = await render();
    expect(html).toMatch(
      /<span class="text-primary"[^>]*>RIFF<\/span>/,
    );
  });

  it('renders the verbatim subtitle and institutional paragraph', async () => {
    const html = await render();
    expect(stripTags(html)).toContain(
      'Más de 40 años innovando en la medición, control de fluidos y tratamiento de agua.',
    );
    expect(stripTags(html)).toContain(
      'Especialistas chilenos en ingeniería aplicada para infraestructuras de alta exigencia: gran minería, plantas agroindustriales, redes sanitarias y complejos inmobiliarios.',
    );
  });
});

describe('NosotrosHero — eyebrow badge (SC-201)', () => {
  it('renders the eyebrow text with a decorative Lucide icon', async () => {
    const html = await render();
    expect(stripTags(html)).toContain('IDENTIDAD & TRAYECTORIA CORPORATIVA');
    expect(html).toContain('lucide:badge-check');
    expect(html).toContain('aria-hidden="true"');
  });
});

describe('NosotrosHero — CTAs (SC-201, SC-208)', () => {
  it('renders the asesoría CTA pointing to the real /contacto route with lucide:arrow-right', async () => {
    const html = await render();
    expect(html).toMatch(
      /<a[^>]*href="\/contacto"[^>]*>[\s\S]*?SOLICITAR ASESORÍA TÉCNICA[\s\S]*?<\/a>/,
    );
    const asesoria = html.match(
      /<a[^>]*href="\/contacto"[^>]*>[\s\S]*?<\/a>/,
    )?.[0];
    expect(asesoria).toContain('lucide:arrow-right');
    expect(asesoria).toContain('aria-hidden="true"');
  });

  it('renders the historia CTA pointing to the in-page #historia anchor with lucide:book-open-text', async () => {
    const html = await render();
    expect(html).toMatch(
      /<a[^>]*href="#historia"[^>]*>[\s\S]*?CONOCER NUESTRA HISTORIA[\s\S]*?<\/a>/,
    );
    expect(html).toContain('lucide:book-open-text');
  });

  it('never renders a #contacto href', async () => {
    const html = await render();
    expect(html).not.toContain('href="#contacto"');
  });
});

describe('NosotrosHero — technical image (SC-202)', () => {
  it('renders a local astro:assets image with a non-empty alt', async () => {
    const html = await render();
    const imgMatch = html.match(/<img[^>]*>/);
    expect(imgMatch).not.toBeNull();
    expect(imgMatch?.[0]).toMatch(/src="\/_(astro|image)\?/);
    expect(imgMatch?.[0]).toMatch(/alt="[^"]+"/);
    expect(html).toContain(`alt="${baseProps.imageAlt}"`);
  });

  it('renders the two image captions verbatim', async () => {
    const html = await render();
    expect(stripTags(html)).toContain('Ingeniería Hidráulica Certificada');
    expect(stripTags(html)).toContain('Norma ISO 9001:2015');
  });
});

describe('NosotrosHero — dark token background and decorative grid (D4, D14)', () => {
  it('the section uses the dark brand token bg-secondary (no hex)', async () => {
    const html = await render();
    const section = html.match(/<section[^>]*>/)?.[0] ?? '';
    expect(section).toContain('bg-secondary');
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('renders the decorative SVG grid as aria-hidden and desktop-only', async () => {
    const html = await render();
    const svgMatch = html.match(/<svg[^>]*>[\s\S]*?<\/svg>/)?.[0] ?? '';
    expect(svgMatch.length).toBeGreaterThan(0);
    expect(svgMatch).toContain('aria-hidden="true"');
    const svgContainer = html.match(/<div[^>]*hidden lg:block[^>]*>/)?.[0] ?? '';
    expect(svgContainer).toContain('hidden lg:block');
  });
});

describe('NosotrosHero — flat design & icon set (SC-209, SC-210)', () => {
  it('renders no rounded utilities and no hex literals', async () => {
    const html = stripComments(await render());
    expect(html).not.toMatch(/rounded/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('uses only Lucide icons (no material-symbols)', async () => {
    const html = await render();
    expect(html).toContain('lucide:');
    expect(html).not.toContain('material-symbols');
  });
});
