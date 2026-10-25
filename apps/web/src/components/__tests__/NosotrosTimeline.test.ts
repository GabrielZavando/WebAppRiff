import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import NosotrosTimeline from '@/components/NosotrosTimeline.astro';
import type { NosotrosTimelineProps } from '@/lib/types/nosotros-page';
import { NOSOTROS_PAGE_CONTENT } from '@/lib/config/nosotros-page';

const baseProps: NosotrosTimelineProps = NOSOTROS_PAGE_CONTENT.timeline;

async function render(
  props: NosotrosTimelineProps = baseProps,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(NosotrosTimeline, { props: { ...props } });
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
 * Behavioural contract for `NosotrosTimeline.astro` (change `nosotros-page`,
 * SC-203; milestones updated in change `web-content-and-ui-polish`): the
 * section carries the `#historia` anchor the hero CTA points to, renders the
 * verbatim header and the four approved milestones (years, badges, titles and
 * side notes), keeps the numeric markers desktop-only (`hidden lg:*`), uses a
 * single badge tone and omits the central rail, and stays flat (no hex, no
 * rounded).
 */
describe('NosotrosTimeline — section anchor and header (SC-203, SC-208)', () => {
  it('renders the #historia anchor on the outermost section', async () => {
    const html = await render();
    const section = html.match(/<section[^>]*>/)?.[0] ?? '';
    expect(section).toContain('id="historia"');
  });

  it('renders the verbatim eyebrow, headline and intro paragraph', async () => {
    const html = await render();
    expect(stripTags(html)).toContain('Cronología y Legado');
    expect(stripTags(html)).toContain(
      'Nuestra Historia — De una Tradición Familiar a la Excelencia Industrial',
    );
    expect(stripTags(html)).toContain(
      'Un recorrido continuo fundado en la rigurosidad científica, el servicio directo y la capacidad de anticipar los desafíos de gestión de fluidos en Chile.',
    );
  });
});

describe('NosotrosTimeline — four approved milestones (SC-203, web-content-and-ui-polish)', () => {
  it('renders the 4 badges and years in chronological order', async () => {
    const html = await render();
    for (const milestone of baseProps.milestones) {
      expect(stripTags(html)).toContain(milestone.badge);
      expect(stripTags(html)).toContain(milestone.title);
    }
    const badges = baseProps.milestones.map((m) => m.badge);
    const firstIndex = html.indexOf(badges[0] ?? 'AÑO 1979');
    const lastIndex = html.indexOf(badges[badges.length - 1] ?? 'DICIEMBRE 2024');
    expect(firstIndex).toBeGreaterThan(-1);
    expect(lastIndex).toBeGreaterThan(firstIndex);
    // The 2012 milestone is gone from the approved narrative.
    const text = stripTags(html);
    expect(text).not.toContain('Consolidación & Continuidad Familiar');
    expect(text).not.toContain('AÑO 2012');
  });

  it('renders every milestone title and body verbatim', async () => {
    const html = await render();
    const text = stripTags(html);
    expect(text).toContain('Nuestro Origen');
    expect(text).toContain('Nace Aguapur Medición');
    expect(text).toContain('El Nacimiento de RIFF');
    expect(text).toContain('La Evolución hacia RIFF');
    expect(text).toContain(
      'En 1979, comienza nuestra historia con la creación de Aguas Purificadas Ltda., fundada por el Sr. Patricio Barrientos Morales.',
    );
    expect(text).toContain(
      'En diciembre de 2024, damos un paso significativo en nuestra trayectoria con la transformación de Aguapur Medición en RIFF.',
    );
    // The relocated "En RIFF, contamos…" paragraph does not live in the
    // timeline (change `web-content-and-ui-polish`, post-apply fix).
    expect(text).not.toContain('En RIFF, contamos');
  });

  it('renders the 2024 offer as a two-item bullet list inside the dark card', async () => {
    const html = await render();
    // Exactly one list in the section, with exactly two items.
    const list = html.match(/<ul[\s\S]*?<\/ul>/)?.[0] ?? '';
    expect(list).not.toBe('');
    const items = list.match(/<li[\s\S]*?<\/li>/g) ?? [];
    expect(items).toHaveLength(2);
    expect(stripTags(items[0] ?? '')).toBe(
      'Equipos y Suministros para Tratamiento de Agua.',
    );
    expect(stripTags(items[1] ?? '')).toBe(
      'Desarrollo de Productos Químicos.',
    );
    // The list inherits the dark-card body tone (text-primary-light).
    expect(list).toContain('text-primary-light');
  });

  it('wraps the highlighted "RIFF" of the 2024 milestone in a <strong>', async () => {
    const html = await render();
    expect(html).toMatch(/<strong[^>]*>RIFF<\/strong>/);
    expect(html).not.toMatch(/<strong[^>]*>RIFF SpA<\/strong>/);
  });

  it('renders the four side notes verbatim, starting with "Hito Clave"', async () => {
    const html = await render();
    const text = stripTags(html);
    expect(text).toContain('Hito Clave');
    expect(text).toContain(
      'Inicio de la fabricación artesanal e industrial de sistemas para remoción físico-química y clarificación de aguas de pozo.',
    );
    expect(text).not.toContain('Evolución Estratégica');
    expect(text).toContain('Hito de Especialización');
    expect(text).toContain('Salto Tecnológico');
    expect(text).toContain('Capacidad Actual');
    expect(text).toContain(
      'Operaciones coordinadas desde Santiago para todo el territorio nacional, cubriendo minería de cobre, plantas de desalación, plantas celulosas e infraestructura hídrica crítica.',
    );
  });

  it('renders exactly 4 side notes and 4 milestone headings', async () => {
    const html = await render();
    expect(html.match(/<h3[\s\S]*?<\/h3>/g) ?? []).toHaveLength(4);
  });
});

describe('NosotrosTimeline — desktop-only markers without central rail (SC-211, SC-214)', () => {
  it('does not render the vertical central line', async () => {
    const html = await render();
    expect(html).not.toContain('bg-border/40');
    expect(html).not.toMatch(/absolute[^"]*left-1\/2/);
  });

  it('hides the numeric markers outside desktop (hidden lg:flex)', async () => {
    const html = await render();
    const markers = html.match(/<div[^>]*hidden lg:flex[^>]*>/g) ?? [];
    expect(markers).toHaveLength(4);
  });

  it('renders every numeric marker with the same bg-primary-deep surface', async () => {
    const html = await render();
    const numericMarkers =
      html.match(/<div class="[^"]*h-10 w-10[^"]*"[^>]*>[\s\S]*?<\/div>/g) ?? [];
    expect(numericMarkers).toHaveLength(3);
    for (const marker of numericMarkers) {
      expect(marker).toContain('bg-primary-deep');
      expect(marker).toContain('text-white');
      expect(marker).not.toContain('bg-bg');
    }
  });

  it('renders the numeric markers 01..03 and the star marker for the last milestone', async () => {
    const html = await render();
    const text = stripTags(html);
    expect(text).toContain('01');
    expect(text).toContain('02');
    expect(text).toContain('03');
    expect(text).not.toContain('04');
    expect(html).toContain('lucide:star');
    expect(html).toContain('aria-hidden="true"');
  });

  it('keeps the star marker on its original bg-accent surface', async () => {
    const html = await render();
    const star =
      html.match(/<div class="[^"]*h-12 w-12[^"]*"[^>]*>[\s\S]*?<\/div>/)?.[0] ??
      '';
    expect(star).toContain('bg-accent');
    expect(star).toContain('text-white');
    expect(star).toContain('lucide:star');
  });

  it('alternates the milestone layout via lg order classes (odd milestones flip)', async () => {
    const html = await render();
    expect(html).toMatch(/order-1 lg:order-3/);
    expect(html).toMatch(/order-2 lg:order-1/);
  });
});

describe('NosotrosTimeline — flat design & tokens (SC-210)', () => {
  it('renders no rounded utilities and no hex literals', async () => {
    const html = stripComments(await render());
    expect(html).not.toMatch(/rounded/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('renders no <h2> or <h1> (the section header is owned by the page h2 level)', async () => {
    const html = await render();
    expect(html).not.toMatch(/<h1/);
  });
});
