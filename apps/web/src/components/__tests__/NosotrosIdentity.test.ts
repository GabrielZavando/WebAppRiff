import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import NosotrosIdentity from '@/components/NosotrosIdentity.astro';
import type { NosotrosIdentityProps } from '@/lib/types/nosotros-page';
import { NOSOTROS_PAGE_CONTENT } from '@/lib/config/nosotros-page';

const baseProps: NosotrosIdentityProps = NOSOTROS_PAGE_CONTENT.identity;

async function render(
  props: NosotrosIdentityProps = baseProps,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(NosotrosIdentity, { props: { ...props } });
}

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function unescapeHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function stripTags(html: string): string {
  return unescapeHtml(stripComments(html).replace(/<[^>]+>/g, ''));
}

/**
 * Behavioural contract for `NosotrosIdentity.astro` (change `nosotros-page`,
 * SC-205): two adjacent blocks — MISIÓN on a light surface and VISIÓN on a
 * dark one — each with its eyebrow, verbatim quote and closing note,
 * decorative Lucide icons, stacked on mobile and flat (no hex, no rounded).
 */
describe('NosotrosIdentity — mission block (SC-205)', () => {
  it('renders the MISIÓN heading and eyebrow verbatim', async () => {
    const html = await render();
    expect(html).toMatch(/<h2[^>]*>[\s\S]*?MISIÓN/);
    expect(stripTags(html)).toContain('PRINCIPIO FUNDAMENTAL');
    expect(html).toContain('lucide:clipboard-list');
  });

  it('renders the verbatim quote, paragraph and closing note', async () => {
    const html = await render();
    const text = stripTags(html);
    expect(text).toContain(
      '"Suministrar soluciones integrales para la medición de fluidos y el tratamiento de agua, tanto industrial como residencial, respaldadas por un servicio técnico de excelencia y tecnología de punta."',
    );
    expect(text).toContain(
      'Trabajamos para que cada metro cúbico medido y cada proceso hídrico optimizado signifique para nuestros clientes mayor rentabilidad, reducción de mermas y estricto apego a las normativas medioambientales vigentes.',
    );
    expect(text).toContain(
      'Compromiso inquebrantable con la trazabilidad y la honestidad técnica.',
    );
    expect(html).toContain('lucide:shield-check');
  });
});

describe('NosotrosIdentity — vision block (SC-205)', () => {
  it('renders the VISIÓN heading and eyebrow verbatim', async () => {
    const html = await render();
    expect(html).toMatch(/<h2[^>]*>[\s\S]*?VISIÓN/);
    expect(stripTags(html)).toContain('PROYECCIÓN DE FUTURO');
    expect(html).toContain('lucide:eye');
  });

  it('renders the verbatim quote, paragraph and closing note', async () => {
    const html = await render();
    const text = stripTags(html);
    expect(text).toContain(
      '"Ser líderes en el suministro de equipos y tecnologías de medición y tratamiento de fluidos en Chile y la región, distinguiéndonos por la innovación permanente, la precisión absoluta y un firme compromiso con la sostenibilidad hídrica."',
    );
    expect(text).toContain(
      'Aspiramos a consolidar la plataforma de instrumentación más confiable de la costa pacífico sur, integrando analítica predictiva, automatización hidrodinámica y soporte directo que establezca el nuevo estándar de la industria.',
    );
    expect(text).toContain(
      'Sostenibilidad hídrica como pilar de ingeniería hacia 2030.',
    );
    expect(html).toContain('lucide:leaf');
  });
});

describe('NosotrosIdentity — layout, surfaces and accessibility (SC-205, SC-211)', () => {
  it('renders a light block (bg-white) and a dark block (bg-secondary)', async () => {
    const html = await render();
    expect(html).toContain('bg-white');
    expect(html).toMatch(/<div[^>]*class="[^"]*bg-secondary[^"]*"[^>]*>/);
  });

  it('stacks the blocks on mobile and places them side by side on desktop', async () => {
    const html = await render();
    expect(html).toMatch(
      /class="[^"]*\bgrid-cols-1\b[^"]*\blg:grid-cols-2\b[^"]*"/,
    );
  });

  it('renders exactly two <h2> (MISIÓN, VISIÓN), no <h1> and decorative icons', async () => {
    const html = await render();
    expect(html.match(/<h2[\s\S]*?<\/h2>/g) ?? []).toHaveLength(2);
    expect(html).not.toMatch(/<h1/);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('material-symbols');
  });

  it('renders no rounded utilities and no hex literals', async () => {
    const html = stripComments(await render());
    expect(html).not.toMatch(/rounded/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
