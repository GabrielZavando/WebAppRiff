import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import NosotrosClients from '@/components/NosotrosClients.astro';
import type { NosotrosClientsProps } from '@/lib/types/nosotros-page';
import { NOSOTROS_PAGE_CONTENT } from '@/lib/config/nosotros-page';

const baseProps: NosotrosClientsProps = NOSOTROS_PAGE_CONTENT.clients;

async function render(
  props: NosotrosClientsProps = baseProps,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(NosotrosClients, { props: { ...props } });
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
 * Behavioural contract for `NosotrosClients.astro` (change `nosotros-page`,
 * SC-207): the verbatim header, a grid with exactly eight client tiles
 * (name + sector subtitle), and the closing CTA banner whose advisory button
 * points to the real `/contacto` route and whose phone is the canonical
 * `tel:` link — flat design: no hex, no rounded and no shadows on buttons
 * (design.md D11).
 */
describe('NosotrosClients — section header (SC-207)', () => {
  it('renders the verbatim eyebrow, h2 and intro paragraph', async () => {
    const html = await render();
    const text = stripTags(html);
    expect(text).toContain('CONFIANZA Y TRAYECTORIA');
    expect(html).toMatch(
      /<h2[^>]*>[\s\S]*?Quienes Han Confiado en Nosotros/,
    );
    expect(text).toContain(
      'Empresas líderes en minería, saneamiento, agroindustria y construcción que respaldan nuestra calidad metrológica.',
    );
    expect(html).toContain('lucide:handshake');
    expect(html).toContain('aria-hidden="true"');
  });
});

describe('NosotrosClients — eight client tiles (SC-207)', () => {
  it('renders exactly 8 client tiles with verbatim names and subtitles in order', async () => {
    const html = await render();
    const text = stripTags(html);
    const expected: ReadonlyArray<readonly [string, string]> = [
      ['ANGLO AMERICAN', 'Minería'],
      ['CODELCO', 'División Andina / El Teniente'],
      ['AGUAS ANDINAS', 'Sanitaria'],
      ['ESVAL', 'Región de Valparaíso'],
      ['NESTLÉ', 'Plantas Productivas'],
      ['CONCHA Y TORO', 'Agroindustria'],
      ['COLBÚN', 'Energía'],
      ['SALFACORP', 'Edificación & Obras'],
    ];
    let cursor = 0;
    for (const [name, subtitle] of expected) {
      const nameIndex = text.indexOf(name, cursor);
      expect(nameIndex).toBeGreaterThan(-1);
      const subtitleIndex = text.indexOf(subtitle, nameIndex);
      expect(subtitleIndex).toBeGreaterThan(nameIndex);
      cursor = subtitleIndex;
    }
  });

  it('declares the client grid collapsing 2 → 4 → 8 columns', async () => {
    const html = await render();
    expect(html).toMatch(
      /class="[^"]*\bgrid-cols-2\b[^"]*\bsm:grid-cols-4\b[^"]*\blg:grid-cols-8\b[^"]*"/,
    );
  });
});

describe('NosotrosClients — closing CTA banner (SC-207, SC-208)', () => {
  it('renders the verbatim banner eyebrow, headline and paragraph', async () => {
    const html = await render();
    const text = stripTags(html);
    expect(text).toContain('Resolución Técnica Inmediata');
    expect(text).toContain(
      '¿Listo para optimizar la medición y el flujo de su operación?',
    );
    expect(text).toContain(
      'Nuestros ingenieros de aplicaciones evalúan su proyecto en menos de 24 horas hábiles.',
    );
    expect(html.match(/<h3[\s\S]*?<\/h3>/g) ?? []).toHaveLength(1);
  });

  it('renders the advisory CTA pointing to /contacto and never #contacto', async () => {
    const html = await render();
    expect(html).toMatch(
      /<a[^>]*href="\/contacto"[^>]*>[\s\S]*?SOLICITAR ASESORÍA TÉCNICA[\s\S]*?<\/a>/,
    );
    expect(html).not.toContain('href="#contacto"');
  });

  it('renders the canonical phone as a tel: link with the visible number', async () => {
    const html = await render();
    expect(html).toMatch(
      /<a[^>]*href="tel:\+56229079067"[^>]*>[\s\S]*?\+56 2 29079067[\s\S]*?<\/a>/,
    );
    expect(html).toContain('lucide:phone');
  });
});

describe('NosotrosClients — flat design & icon set (SC-209, SC-210, D11)', () => {
  it('renders no rounded utilities and no hex literals', async () => {
    const html = stripComments(await render());
    expect(html).not.toMatch(/rounded/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('renders no shadow utilities on the CTA buttons (flat design, D11)', async () => {
    const html = stripComments(await render());
    const anchors = html.match(/<a[^>]*class="[^"]*"[^>]*>/g) ?? [];
    expect(anchors.length).toBeGreaterThanOrEqual(2);
    for (const anchor of anchors) {
      expect(anchor).not.toMatch(/shadow/);
    }
  });

  it('uses only Lucide icons (no material-symbols)', async () => {
    const html = await render();
    expect(html).toContain('lucide:');
    expect(html).not.toContain('material-symbols');
  });
});
