import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import DistribuidorCard from '@/components/DistribuidorCard.astro';
import { REPRESENTACIONES_PAGE_CONTENT } from '@/lib/config/representaciones-page';

const distributors =
  REPRESENTACIONES_PAGE_CONTENT.distributorsSection.distributors;
const piusi = distributors[0]!;

async function render(distributor = piusi): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(DistribuidorCard, {
    props: { ...distributor },
  });
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

describe('DistribuidorCard', () => {
  it('renders the real logo, badge and h3 title', async () => {
    const html = await render();
    expect(html).toContain('data-brand-logo');
    expect(html).toMatch(/<img[^>]*alt="PIUSI"/);
    expect(html).toMatch(/<img[^>]*loading="lazy"/);
    expect(html).toMatch(/<img[^>]*object-contain/);
    expect(html).toContain('Italia');
    expect(html).toMatch(
      /<h3[^>]*>Contadores de Litros y Despacho de Combustibles<\/h3>/,
    );
  });

  it('renders the Lucide thematic icon via astro-icon', async () => {
    const html = await render();
    expect(html).toContain('data-icon="lucide:fuel"');
  });

  it('renders exactly three bullets each with a decorative lucide:check icon', async () => {
    const html = await render();
    const listItems = html.match(/<li[\s>]/g) ?? [];
    expect(listItems).toHaveLength(3);
    const checkIcons = (html.match(/data-icon="lucide:check"/g) ?? []).length;
    expect(checkIcons).toBe(3);
    expect(html).toContain('Medidores de pulsos y mecánicos para combustible');
  });

  it('renders the guarantee legend', async () => {
    const html = await render();
    expect(html).toContain('Garantía Oficial PIUSI Italia');
  });

  it('stays flat: no rounded or shadow classes', async () => {
    const html = await render();
    expect(html).not.toMatch(/class="[^"]*\brounded/);
    expect(html).not.toMatch(/class="[^"]*\bshadow/);
  });

  describe('clickable distributor logo (change web-content-and-ui-polish)', () => {
    function logoSegment(html: string): string {
      return html.match(/<div[^>]*data-brand-logo[^>]*>[\s\S]*?<\/div>/)?.[0] ?? '';
    }

    it('wraps the logos of distributors with url in an external link around only the image', async () => {
      for (const distributor of distributors) {
        const html = await render(distributor);
        const segment = logoSegment(html);
        expect(segment).toContain('data-brand-logo');
        const escapedUrl = distributor.url!.replace(/[/.]/g, '\\$&');
        expect(segment).toMatch(
          new RegExp(
            `<a\\s[^>]*href="${escapedUrl}"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>\\s*<img`,
          ),
        );
        expect(segment.match(/<a[\s>]/g) ?? []).toHaveLength(1);
      }
    });

    it('renders the logo of a distributor without url with no link', async () => {
      const html = await render({ ...piusi, url: undefined });
      const segment = logoSegment(html);
      expect(segment).toContain('data-brand-logo');
      expect(segment).not.toMatch(/<a[\s>]/);
      expect(segment).toMatch(/<img[^>]*alt="PIUSI"/);
    });
  });
});
