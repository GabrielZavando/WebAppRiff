import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import CotizacionSupport from '@/components/CotizacionSupport.astro';
import { COTIZACION_PAGE_CONTENT } from '@/lib/config/cotizacion-page';
import type { CotizacionSupportProps } from '@/lib/types/cotizacion-form';

const baseProps: CotizacionSupportProps = COTIZACION_PAGE_CONTENT.support;

async function render(
  props: CotizacionSupportProps = baseProps,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(CotizacionSupport, { props: { ...props } });
}

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

describe('CotizacionSupport — card shell', () => {
  it('renders a dark-teal card with white text and the support title', async () => {
    const html = stripComments(await render());
    expect(html).toContain('bg-primary-deep');
    expect(html).toContain('text-white');
    expect(html).toContain('¿Necesita soporte inmediato?');
  });

  it('renders the support description copy', async () => {
    const html = stripComments(await render());
    expect(html).toContain('soporte 24/7');
  });

  it('does not use rounded or shadow classes (flat design)', async () => {
    const html = stripComments(await render());
    expect(html).not.toMatch(/rounded/);
    expect(html).not.toMatch(/shadow/);
  });
});

describe('CotizacionSupport — phone link', () => {
  it('renders a clickable tel: link with the canonical phone number', async () => {
    const html = stripComments(await render());
    expect(html).toContain('href="tel:+56229079067"');
    expect(html).toContain('+56 2 29079067');
  });

  it('renders a phone icon next to the number (lucide)', async () => {
    const html = stripComments(await render());
    expect(html).toContain('lucide:phone');
  });
});
