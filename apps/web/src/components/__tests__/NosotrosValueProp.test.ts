import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import NosotrosValueProp from '@/components/NosotrosValueProp.astro';
import type { NosotrosValuePropProps } from '@/lib/types/nosotros-page';
import { NOSOTROS_PAGE_CONTENT } from '@/lib/config/nosotros-page';

const baseProps: NosotrosValuePropProps = NOSOTROS_PAGE_CONTENT.value;

async function render(
  props: NosotrosValuePropProps = baseProps,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(NosotrosValueProp, { props: { ...props } });
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
 * Behavioural contract for `NosotrosValueProp.astro` (change `nosotros-page`,
 * SC-204): the verbatim section header + side note, the four value pillars
 * and the four industry-sector cards with Lucide decorative icons, declared
 * responsive grids, and flat design (no hex, no rounded).
 */
describe('NosotrosValueProp — section header (SC-204)', () => {
  it('renders the verbatim eyebrow, h2 and intro paragraph', async () => {
    const html = await render();
    const text = stripTags(html);
    expect(text).toContain('Diferenciación Operativa');
    expect(html).toMatch(/<h2[^>]*>[\s\S]*?Nuestra Propuesta de Valor/);
    expect(text).toContain(
      'Más de tres décadas acumuladas de know-how hidrométrico nos permiten abordar la ingeniería de fluidos no como una simple venta de suministros, sino como una alianza técnica de aseguramiento de continuidad operativa y certidumbre en datos de flujo.',
    );
  });

  it('renders the side note chip verbatim', async () => {
    const html = await render();
    expect(stripTags(html)).toContain(
      'Arquitectura de Procesos & Metrología Certificada',
    );
  });
});

describe('NosotrosValueProp — four value pillars (SC-204)', () => {
  it('renders the 4 pillar titles and descriptions verbatim', async () => {
    const html = await render();
    const text = stripTags(html);
    expect(text).toContain('Durabilidad Extrema');
    expect(text).toContain(
      'Componentes de fundición dúctil, aceros inoxidables especiales y revestimientos para soportar la abrasión minera y los químicos corrosivos del tratamiento de agua.',
    );
    expect(text).toContain('Precisión Certificada');
    expect(text).toContain('Eficiencia Hídrica');
    expect(text).toContain('Servicio In-Situ');
    expect(text).toContain('Respuesta prioritaria en paradas no programadas.');
    // 4 pillar <h3> + the sectors block header <h3> ("Presencia Sólida…",
    // same hierarchy as the reference, SC-212).
    expect(html.match(/<h3[\s\S]*?<\/h3>/g) ?? []).toHaveLength(5);
  });

  it('renders each pillar icon as a decorative Lucide reference', async () => {
    const html = await render();
    for (const pillar of baseProps.pillars) {
      expect(html).toContain(`lucide:${pillar.icon}`);
    }
    expect(html).toContain('aria-hidden="true"');
  });
});

describe('NosotrosValueProp — four industry sectors (SC-204)', () => {
  it('renders the sectors block header verbatim', async () => {
    const html = await render();
    const text = stripTags(html);
    expect(text).toContain('Campos de Acción');
    expect(text).toContain('Presencia Sólida en Industrias Críticas');
  });

  it('renders the SECTOR 01..04 seals, titles and copy verbatim', async () => {
    const html = await render();
    const text = stripTags(html);
    for (const sector of baseProps.sectors) {
      expect(text).toContain(sector.label);
      expect(text).toContain(sector.title);
      expect(text).toContain(sector.description);
      expect(html).toContain(`lucide:${sector.icon}`);
    }
    expect(html.match(/<h4[\s\S]*?<\/h4>/g) ?? []).toHaveLength(4);
  });
});

describe('NosotrosValueProp — responsive grids (SC-211)', () => {
  it('declares the pillars grid collapsing 1 → 2 → 4 columns', async () => {
    const html = await render();
    expect(html).toMatch(
      /class="[^"]*\bgrid-cols-1\b[^"]*\bmd:grid-cols-2\b[^"]*\blg:grid-cols-4\b[^"]*"/,
    );
  });

  it('declares the sectors grid collapsing 1 → 2 → 4 columns', async () => {
    const html = await render();
    const grids =
      html.match(
        /class="[^"]*\bgrid-cols-1\b[^"]*\bmd:grid-cols-2\b[^"]*\blg:grid-cols-4\b[^"]*"/g,
      ) ?? [];
    expect(grids.length).toBeGreaterThanOrEqual(2);
  });
});

describe('NosotrosValueProp — flat design & icon set (SC-209, SC-210)', () => {
  it('renders no rounded utilities and no hex literals', async () => {
    const html = stripComments(await render());
    expect(html).not.toMatch(/rounded/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('uses only Lucide icons (no material-symbols)', async () => {
    const html = await render();
    expect(html).toContain('lucide:');
    expect(html).not.toContain('material-symbols');
  });

  it('renders no <h1> or <h2> duplicates (single h2 header)', async () => {
    const html = await render();
    expect(html).not.toMatch(/<h1/);
    expect(html.match(/<h2[\s\S]*?<\/h2>/g) ?? []).toHaveLength(1);
  });
});
