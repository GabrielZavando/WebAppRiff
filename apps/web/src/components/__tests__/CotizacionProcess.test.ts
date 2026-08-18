import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import CotizacionProcess from '@/components/CotizacionProcess.astro';
import { COTIZACION_PAGE_CONTENT } from '@/lib/config/cotizacion-page';
import type { CotizacionProcessProps } from '@/lib/types/cotizacion-form';

const baseProps: CotizacionProcessProps = COTIZACION_PAGE_CONTENT.process;

async function render(
  props: CotizacionProcessProps = baseProps,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(CotizacionProcess, { props: { ...props } });
}

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

describe('CotizacionProcess — card shell', () => {
  it('renders a card with light teal background and the process title', async () => {
    const html = stripComments(await render());
    expect(html).toContain('bg-primary-light');
    expect(html).toContain('Proceso de Cotización');
  });

  it('renders a question-mark circle icon (lucide)', async () => {
    const html = stripComments(await render());
    expect(html).toContain('lucide:circle-question-mark');
  });

  it('does not use rounded or shadow classes (flat design)', async () => {
    const html = stripComments(await render());
    expect(html).not.toMatch(/rounded/);
    expect(html).not.toMatch(/shadow/);
  });
});

describe('CotizacionProcess — process steps', () => {
  it('renders exactly three steps with bold titles', async () => {
    const html = stripComments(await render());
    for (const title of ['Recepción', 'Evaluación Técnica', 'Propuesta']) {
      expect(html).toContain(title);
    }
    // Each step title is emphasised (bold) — wrap in a <strong>/<b> or a
    // heading-level element. We assert a <strong> element exists for each.
    const strongCount = (html.match(/<strong/g) ?? []).length;
    expect(strongCount).toBeGreaterThanOrEqual(3);
  });

  it('numbers the steps explicitly (1. Recepción, 2. Evaluación Técnica, 3. Propuesta)', async () => {
    const html = stripComments(await render());
    expect(html).toContain('1. Recepción');
    expect(html).toContain('2. Evaluación Técnica');
    expect(html).toContain('3. Propuesta');
  });

  it('renders the description copy for each step', async () => {
    const html = stripComments(await render());
    expect(html).toContain('24 horas hábiles');
    expect(html).toContain('visita a terreno');
    expect(html).toContain('propuesta formal');
  });

  it('renders steps separated by visual dividers', async () => {
    const html = stripComments(await render());
    // A divider/separator element between steps (border-top divider).
    expect(html).toMatch(/border-t/);
  });
});
