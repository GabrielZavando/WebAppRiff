import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import DistribuidorCard from '@/components/DistribuidorCard.astro';
import { REPRESENTACIONES_PAGE_CONTENT } from '@/lib/config/representaciones-page';

const piusi = REPRESENTACIONES_PAGE_CONTENT.distributorsSection.distributors[0]!;

async function render(): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(DistribuidorCard, {
    props: { ...piusi },
  });
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

describe('DistribuidorCard', () => {
  it('renders wordmark, badge and h3 title', async () => {
    const html = await render();
    expect(html).toContain('data-brand-logo');
    expect(html).toContain('PIUSI');
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
});
