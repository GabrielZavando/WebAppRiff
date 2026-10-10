import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import NosotrosTeamGrid from '@/components/NosotrosTeamGrid.astro';
import type { NosotrosTeamGridProps } from '@/lib/types/nosotros-page';
import { NOSOTROS_PAGE_CONTENT } from '@/lib/config/nosotros-page';

const baseProps: NosotrosTeamGridProps = NOSOTROS_PAGE_CONTENT.team;

async function render(
  props: NosotrosTeamGridProps = baseProps,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(NosotrosTeamGrid, { props: { ...props } });
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
 * Behavioural contract for `NosotrosTeamGrid.astro` (change `nosotros-page`,
 * SC-206): the verbatim header + accreditation badge and exactly four
 * leadership cards (name, role, area badge, verbatim bio and footer strip
 * with a decorative Lucide icon), local portraits with non-empty alt, the
 * 1 → 2 → 4 responsive grid and flat design (no hex, no rounded).
 */
describe('NosotrosTeamGrid — header and badge (SC-206)', () => {
  it('renders the verbatim eyebrow, h2 and subtitle', async () => {
    const html = await render();
    const text = stripTags(html);
    expect(text).toContain('Estructura de Liderazgo');
    expect(html).toMatch(
      /<h2[^>]*>[\s\S]*?Equipo RIFF — Liderazgo &amp; Experiencia/,
    );
    expect(text).toContain(
      'Profesionales comprometidos con la precisión y el servicio técnico en terreno.',
    );
  });

  it('renders the accreditation badge verbatim with a decorative Lucide icon', async () => {
    const html = await render();
    expect(stripTags(html)).toContain(
      '+100 años de experiencia combinada en terreno',
    );
    expect(html).toContain('lucide:wrench');
    expect(html).toContain('aria-hidden="true"');
  });
});

describe('NosotrosTeamGrid — four leadership cards (SC-206)', () => {
  it('renders exactly 4 cards with the verbatim names in order', async () => {
    const html = await render();
    const articles = html.match(/<article[\s\S]*?<\/article>/g) ?? [];
    expect(articles).toHaveLength(4);
    const text = stripTags(html);
    expect(text).toContain('Steven Marks');
    expect(text).toContain('Lara Smith');
    expect(text).toContain('John Doe');
    expect(text).toContain('Felipe Román');
  });

  it('renders the verbatim roles, areas and bios', async () => {
    const html = await render();
    const text = stripTags(html);
    expect(text).toContain('Gerente General');
    expect(text).toContain('Jefe de Proyectos de Ingeniería');
    expect(text).toContain('Dirección Comercial y Representaciones');
    expect(text).toContain('Gerencia de Operaciones y Medición');
    expect(text).toContain('Dirección');
    expect(text).toContain('Ingeniería');
    expect(text).toContain('Comercial');
    expect(text).toContain('Operaciones');
    expect(text).toContain(
      'Liderazgo estratégico, gobernanza corporativa y expansión industrial. Enfocado en la solvencia operativa y alianzas de largo plazo con mandantes mineros.',
    );
    expect(text).toContain(
      'Cofundador de la etapa técnica moderna. Responsable de la flota de laboratorios móviles, protocolos de calibración metrológica y aseguramiento de calidad en terreno.',
    );
  });

  it('renders the four footer strips with their verbatim labels and Lucide icons', async () => {
    const html = await render();
    const text = stripTags(html);
    expect(text).toContain('Gestión Corporativa');
    expect(text).toContain('Cálculo & Comisionamiento');
    expect(text).toContain('Alianzas Globales');
    expect(text).toContain('Metrología & Faena');
    expect(html).toContain('lucide:badge');
    expect(html).toContain('lucide:drafting-compass');
    expect(html).toContain('lucide:globe');
    expect(html).toContain('lucide:gauge');
  });

  it('renders each portrait as a lazy astro:assets image with a non-empty alt', async () => {
    const html = await render();
    const images = html.match(/<img[^>]*>/g) ?? [];
    expect(images).toHaveLength(4);
    for (const img of images) {
      expect(img).toMatch(/src="\/_(astro|image)\?/);
      expect(img).toMatch(/alt="[^"]+"/);
      expect(img).toContain('loading="lazy"');
    }
  });

  it('renders exactly 4 <h3> card titles and no <h1>', async () => {
    const html = await render();
    expect(html.match(/<h3[\s\S]*?<\/h3>/g) ?? []).toHaveLength(4);
    expect(html).not.toMatch(/<h1/);
  });
});

describe('NosotrosTeamGrid — responsive grid (SC-211)', () => {
  it('declares the grid collapsing 1 → 2 → 4 columns', async () => {
    const html = await render();
    expect(html).toMatch(
      /class="[^"]*\bgrid-cols-1\b[^"]*\bsm:grid-cols-2\b[^"]*\blg:grid-cols-4\b[^"]*"/,
    );
  });
});

describe('NosotrosTeamGrid — flat design & icon set (SC-209, SC-210)', () => {
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
});
