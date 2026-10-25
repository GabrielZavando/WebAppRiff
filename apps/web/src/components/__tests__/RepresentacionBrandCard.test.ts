import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import RepresentacionBrandCard from '@/components/RepresentacionBrandCard.astro';
import { REPRESENTACIONES_PAGE_CONTENT } from '@/lib/config/representaciones-page';

const brands = REPRESENTACIONES_PAGE_CONTENT.brandsSection.brands;
const apator = brands[0]!;

async function render(brand = apator): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(RepresentacionBrandCard, {
    props: { ...brand },
  });
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

describe('RepresentacionBrandCard', () => {
  it('renders the real logo image inside a data-brand-logo container', async () => {
    const html = await render();
    expect(html).toContain('data-brand-logo');
    expect(html).toMatch(/<img[^>]*alt="Apator Powogaz"/);
    expect(html).toMatch(/<img[^>]*loading="lazy"/);
    expect(html).toMatch(/<img[^>]*object-contain/);
    expect(html).not.toContain('POWOGAZ');
  });

  it('renders the origin chip, sublabel, h3 title, category and description', async () => {
    const html = await render();
    expect(html).toContain('Polonia / UE');
    expect(html).toContain('Partner Exclusivo desde 2004');
    expect(html).toMatch(/<h3[^>]*>Apator Powogaz<\/h3>/);
    expect(html).toMatch(
      /class="[^"]*text-primary[^"]*"[^>]*>Medición Volumétrica y Macromedición/,
    );
    expect(html).toContain('Referente europeo en metrología hídrica');
  });

  it('renders the logo of every brand with its own alt text', async () => {
    for (const brand of brands) {
      const html = await render(brand);
      expect(html).toMatch(
        new RegExp(`<img[^>]*alt="${brand.title}"`),
      );
    }
  });

  it('stacks the wordmark panel on mobile and puts it in a row from md', async () => {
    const html = await render();
    expect(html).toMatch(/class="[^"]*flex-col[^"]*md:flex-row/);
    expect(html).toMatch(/class="[^"]*md:w-64/);
  });

  it('stays flat: no rounded or shadow classes', async () => {
    const html = await render();
    expect(html).not.toMatch(/class="[^"]*\brounded/);
    expect(html).not.toMatch(/class="[^"]*\bshadow/);
  });

  describe('clickable brand logo (change web-content-and-ui-polish)', () => {
    function brandLogoSegment(html: string): string {
      return html.match(/<div[^>]*data-brand-logo[^>]*>[\s\S]*?<\/div>/)?.[0] ?? '';
    }

    it('wraps the logo of a brand with url in an external link around only the image', async () => {
      const html = await render(apator);
      const segment = brandLogoSegment(html);
      expect(segment).toContain('data-brand-logo');
      expect(segment).toMatch(
        /<a\s[^>]*href="https:\/\/www\.apator\.com\/en"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>\s*<img/,
      );
      // The link wraps only the logo: chip and sublabel stay outside the <a>.
      expect(segment).toMatch(/<span[^>]*>Polonia \/ UE<\/span>/);
      expect(segment.match(/<a[\s>]/g) ?? []).toHaveLength(1);
    });

    it('renders the GL Flow logo (gl-sanitaria, without url) with no link', async () => {
      const glFlow = brands.find((brand) => brand.id === 'gl-sanitaria')!;
      const html = await render(glFlow);
      const segment = brandLogoSegment(html);
      expect(segment).toContain('data-brand-logo');
      expect(segment).not.toMatch(/<a[\s>]/);
      expect(segment).toMatch(/<img[^>]*alt="GL Sanitaria"/);
      expect(segment).toMatch(/<img[^>]*loading="lazy"/);
    });
  });
});
