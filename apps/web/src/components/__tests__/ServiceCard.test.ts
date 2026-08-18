import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ServiceCard from '@/components/ServiceCard.astro';
import type { ServiceCardProps } from '@/lib/types/services-page';
import { SERVICIOS_PAGE_SERVICES } from '@/lib/config/services-page';

// All four cards now carry bullets (cards 01 and 03 migrated to bullets in the
// post-apply text expansion); card 03 (index 2) dropped tags. `cardPlain` is
// card 01 (index 0) which now also has an intro paragraph.
const cardWithBullets = SERVICIOS_PAGE_SERVICES[1]!;
const cardWithTags = SERVICIOS_PAGE_SERVICES[2]!;
const cardPlain = SERVICIOS_PAGE_SERVICES[0]!;

async function render(
  props: Partial<ServiceCardProps> = {},
  imagePosition: 'left' | 'right' = 'left',
): Promise<string> {
  const container = await AstroContainer.create();
  // Spread inline (fresh object literal) so the props argument is assignable to
  // AstroContainer's `Record<string, any>` param — annotating a `ServiceCardProps`
  // variable instead would trigger a missing-index-signature error.
  return container.renderToString(ServiceCard, {
    props: { ...cardPlain, imagePosition, ...props },
  });
}

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function stripTags(html: string): string {
  return stripComments(html).replace(/<[^>]+>/g, '');
}

describe('ServiceCard — number, sector, title', () => {
  it('renders the number as a two-digit badge with text-primary', async () => {
    const html = await render({ ...cardPlain, number: 1 });
    expect(stripTags(html)).toContain('01');
    const badge = html.match(/<span[^>]*class="[^"]*text-primary[^"]*"[^>]*>\s*01/);
    expect(badge).not.toBeNull();
  });

  it('renders the sector label in primary uppercase', async () => {
    const html = await render({ ...cardPlain, sector: 'SECTOR INDUSTRIAL' });
    const sector = html.match(
      /<(span|p)[^>]*class="[^"]*text-primary[^"]*uppercase[^"]*"[^>]*>SECTOR INDUSTRIAL/,
    );
    expect(sector).not.toBeNull();
  });

  it('renders the title as an <h2>', async () => {
    const html = await render({ ...cardPlain, title: 'Medición en Edificios' });
    const h2 = html.match(/<h2[^>]*>[\s\S]*?Medición en Edificios[\s\S]*?<\/h2>/);
    expect(h2).not.toBeNull();
    expect(h2![0]).toContain('text-secondary');
  });
});

describe('ServiceCard — image', () => {
  it('renders an astro:assets optimized <img> with lazy loading and descriptive alt', async () => {
    const html = await render({ ...cardPlain, imageAlt: 'Foto descriptiva' });
    const img = html.match(/<img[^>]*>/);
    expect(img).not.toBeNull();
    expect(img![0]).toContain('loading="lazy"');
    expect(img![0]).toMatch(/alt="[^"]*Foto descriptiva/);
    // astro:assets emits an optimized endpoint, not the raw assets path
    expect(img![0]).not.toMatch(/src="[^"]*(assets\/img|\/@fs\/)/);
    expect(img![0]).toMatch(/src="\/_(astro|image)\?/);
    expect(img![0]).toMatch(/width=/);
    expect(img![0]).toMatch(/height=/);
  });

  it('alt is NOT identical to the title (describes the photo)', async () => {
    const html = await render({
      ...cardPlain,
      title: 'Medición en Edificios',
      imageAlt: 'Edificios residenciales con instalación de medidores',
    });
    const img = html.match(/<img[^>]*alt="([^"]*)"/);
    expect(img![1]!.trim()).not.toBe('Medición en Edificios');
  });
});

describe('ServiceCard — image position', () => {
  it('image left does NOT add md:flex-row-reverse', async () => {
    const html = await render(cardPlain, 'left');
    // Strip the component's own HTML comment (which mentions the utility verbatim).
    expect(stripComments(html)).not.toContain('md:flex-row-reverse');
  });

  it('image right adds md:flex-row-reverse', async () => {
    const html = await render(cardPlain, 'right');
    expect(html).toContain('md:flex-row-reverse');
  });
});

describe('ServiceCard — optional bullets', () => {
  it('renders a <ul> with one <li> per bullet and a decorative check icon', async () => {
    const bullets = ['Precisión: ±0.5%', 'Integración: SCADA/PLC'];
    const html = await render({ ...cardWithBullets, bullets });
    const ul = html.match(/<ul[^>]*>([\s\S]*?)<\/ul>/);
    expect(ul).not.toBeNull();
    const liCount = (ul![0].match(/<li/g) ?? []).length;
    expect(liCount).toBe(2);
    expect(ul![0]).toContain('<svg');
    expect(ul![0]).toContain('aria-hidden="true"');
  });

  it('does NOT render a <ul> when bullets are absent', async () => {
    const html = await render({ ...cardPlain, bullets: [] });
    expect(html).not.toMatch(/<ul/);
  });
});

describe('ServiceCard — optional tags', () => {
  it('renders a pill per tag with border border-border', async () => {
    const tags = ['Ingeniería Conceptual', 'Diseño de Detalle'];
    const html = await render({ ...cardWithTags, tags });
    const tagPills = html.match(/<span[^>]*border-border[^>]*>[^<]*Ingeniería Conceptual/);
    expect(tagPills).not.toBeNull();
    expect((html.match(/border-border/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('does NOT render pills when tags are absent (only the card root carries border-border)', async () => {
    const html = await render({ ...cardPlain });
    // The card root always carries `border border-border`; with no tags there
    // must be exactly one occurrence (the root), not one per pill. Strip the
    // component comment, which mentions the token verbatim.
    const occurrences = stripComments(html).match(/border-border/g) ?? [];
    expect(occurrences).toHaveLength(1);
  });
});

describe('ServiceCard — optional intro paragraph', () => {
  it('renders the intro paragraph when provided', async () => {
    const html = await render({
      intro:
        'Optimizamos el consumo de agua en comunidades y edificios con la instalación y renovación de medidores de agua caliente. Nuestro servicio incluye:',
    });
    expect(stripTags(html)).toContain(
      'Optimizamos el consumo de agua en comunidades',
    );
    // The intro copy is wrapped in its own <p> (the only prose block on the card).
    const introP = html.match(
      /<p[^>]*>([\s\S]*?Optimizamos el consumo de agua en comunidades[\s\S]*?)<\/p>/,
    );
    expect(introP).not.toBeNull();
  });

  it('intro paragraph appears before the bullets <ul> in DOM order', async () => {
    const html = await render({
      intro: 'Nuestro servicio incluye:',
      bullets: ['Uno', 'Dos'],
    });
    const clean = stripComments(html);
    const introIdx = clean.indexOf('Nuestro servicio incluye:');
    const ulIdx = clean.indexOf('<ul');
    expect(introIdx).toBeGreaterThanOrEqual(0);
    expect(ulIdx).toBeGreaterThan(introIdx);
  });

  it('does NOT render an intro paragraph when absent', async () => {
    const html = await render({
      intro: '',
    });
    // The intro copy must not be wrapped in a <p> (no prose block is rendered,
    // since the short `description` field was removed).
    const introWrapped = html.match(
      /<p[^>]*>([\s\S]*?Nuestro servicio[\s\S]*?)<\/p>/,
    );
    expect(introWrapped).toBeNull();
  });

  it('renders no prose <p> at all when neither description nor intro is present (card 04)', async () => {
    const card04 = SERVICIOS_PAGE_SERVICES[3]!;
    // `intro: ''` clears the `cardPlain` default (card 01) intro that the shared
    // `render` helper spreads; card 04's real config has no `intro` either.
    const html = await render({ ...card04, intro: '', imagePosition: 'left' });
    // The short `description` field was removed; card 04 has no `intro`, so the
    // only prose block is gone. Exclude `<path>` (svg) from the count.
    const pCount = (stripComments(html).match(/<p[ >]/g) ?? []).length;
    expect(pCount).toBe(0);
  });
});

describe('ServiceCard — CTA', () => {
  it('renders an <a href="/contacto"> with accent color and arrow icon', async () => {
    const html = await render();
    const a = html.match(/<a\s[^>]*href="\/contacto"[^>]*>[\s\S]*?<\/a>/);
    expect(a).not.toBeNull();
    expect(a![0]).toContain('CONTACTAR A UN ESPECIALISTA');
    expect(a![0]).toContain('bg-accent');
    expect(a![0]).toContain('<svg');
    expect(a![0]).toContain('aria-hidden="true"');
  });

  it('CTA opening tag is not hidden from assistive tech', async () => {
    const html = await render();
    const aOpen = html.match(/<a\s[^>]*>/)![0];
    expect(aOpen).not.toContain('aria-hidden="true"');
    expect(aOpen).not.toContain('tabindex="-1"');
  });
});

describe('ServiceCard — flat design tokens', () => {
  it('card root is white with a 1px border and no rounded/shadow', async () => {
    const html = await render();
    const article = html.match(/<article[^>]*>/)![0];
    expect(article).toContain('bg-white');
    expect(article).toContain('border');
    expect(article).toContain('border-border');
    const clean = stripComments(html);
    expect(clean).not.toMatch(/rounded/);
    expect(clean).not.toMatch(/shadow/);
  });

  it('does NOT contain literal hex color values', async () => {
    const html = await render();
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('does NOT contain deprecated brand-* tokens', async () => {
    const html = await render();
    expect(html).not.toMatch(/brand-(teal|navy|orange|gray)/);
  });
});

describe('ServiceCard — snapshot', () => {
  it('matches the snapshot (card with bullets, image left)', async () => {
    const html = await render(cardWithBullets, 'left');
    expect(html).toMatchSnapshot();
  });

  it('matches the snapshot (card with tags, image right)', async () => {
    const html = await render(cardWithTags, 'right');
    expect(html).toMatchSnapshot();
  });
});
