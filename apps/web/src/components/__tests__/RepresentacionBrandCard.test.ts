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
  it('renders the wordmark inside a data-brand-logo container (replaceable placeholder)', async () => {
    const html = await render();
    expect(html).toContain('data-brand-logo');
    expect(html).toContain('APATOR');
    expect(html).toContain('POWOGAZ');
    // No <img> logo is rendered (placeholder only).
    expect(html).not.toMatch(/<img[^>]*alt="[^"]*logo/i);
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

  it('renders the optional wordmark note when present', async () => {
    const html = await render(brands[1]!);
    expect(html).toContain('Flow Metering Control');
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
});
