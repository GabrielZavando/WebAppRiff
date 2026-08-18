import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import CotizacionPage from '@/pages/cotizacion.astro';

async function render(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(CotizacionPage, {});
}

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

describe('Cotizacion page — composition', () => {
  it('renders the cotizacion form, process card and support card', async () => {
    const html = stripComments(await render());
    expect(html).toContain('<form method="post"');
    expect(html).toContain('action="/api/v1/quotes"');
    expect(html).toContain('Proceso de Cotización');
    expect(html).toContain('¿Necesita soporte inmediato?');
  });

  it('hides the hero image and the global search form', async () => {
    const html = stripComments(await render());
    // No hero banner image (page passes hero={false})
    expect(html).not.toContain('banner_home');
    // No global search landmark and no search submit button
    expect(html).not.toContain('role="search"');
    expect(html).not.toContain('BUSCAR');
  });
});

describe('Cotizacion page — two-column layout', () => {
  it('uses a CSS grid that is two columns on lg+ (form + sidebar)', async () => {
    const html = stripComments(await render());
    expect(html).toMatch(/grid-cols-1\s+lg:grid-cols-3/);
    // The form occupies the left 2 columns; the sidebar occupies the right 1.
    expect(html).toContain('lg:col-span-2');
  });

  it('stacks on mobile (form appears before the sidebar in DOM order)', async () => {
    const html = stripComments(await render());
    const formEnd = html.indexOf('</form>');
    const supportStart = html.indexOf('¿Necesita soporte inmediato?');
    // Sidebar (support card) must come after the form when stacked on mobile.
    expect(supportStart).toBeGreaterThan(formEnd);
  });
});

describe('Cotizacion page — verification', () => {
  it('verifies the form submits to /api/v1/quotes', async () => {
    const html = stripComments(await render());
    expect(html).toContain('action="/api/v1/quotes"');
  });

  it('uses project design tokens and no hex literals', async () => {
    const html = stripComments(await render());
    // Tokens are used (deep teal for the support card, etc.)
    expect(html).toContain('bg-primary-deep');
    // No arbitrary hex utilities (e.g. bg-[#006874]) in the rendered markup.
    expect(html).not.toMatch(/bg-\[#/);
    expect(html).not.toMatch(/text-\[#/);
  });

  it('does not use rounded or shadow classes (flat design)', async () => {
    const html = stripComments(await render());
    expect(html).not.toMatch(/rounded/);
    expect(html).not.toMatch(/shadow/);
  });

  it('associates every form control with its label via for/id', async () => {
    const html = stripComments(await render());
    for (const id of [
      'cotizacion-nombre',
      'cotizacion-email',
      'cotizacion-telefono',
      'cotizacion-empresa',
      'cotizacion-rut',
      'cotizacion-mensaje',
    ]) {
      expect(html, `input/textarea id="${id}"`).toContain(`id="${id}"`);
      expect(html, `label for="${id}"`).toContain(`for="${id}"`);
    }
  });
});
