import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ValuePropCard from '@/components/ValuePropCard.astro';
import { REPRESENTACIONES_PAGE_CONTENT } from '@/lib/config/representaciones-page';

const pillar = REPRESENTACIONES_PAGE_CONTENT.valuePropsSection.valueProps[0]!;

async function render(): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(ValuePropCard, {
    props: { ...pillar },
  });
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

describe('ValuePropCard', () => {
  it('renders the decorative Lucide icon via astro-icon', async () => {
    const html = await render();
    expect(html).toContain('data-icon="lucide:wrench"');
  });

  it('renders the indexed label and the h4 title', async () => {
    const html = await render();
    expect(html).toContain('01 / Respaldo Técnico');
    expect(html).toMatch(/<h4[^>]*>Soporte de Ingeniería Local<\/h4>/);
  });

  it('renders the description paragraph', async () => {
    const html = await render();
    expect(html).toContain('Ingenieros de fluidos certificados');
  });

  it('stays flat: no rounded or shadow classes', async () => {
    const html = await render();
    expect(html).not.toMatch(/class="[^"]*\brounded/);
    expect(html).not.toMatch(/class="[^"]*\bshadow/);
  });
});
