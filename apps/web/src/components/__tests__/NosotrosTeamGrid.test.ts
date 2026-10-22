import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import NosotrosTeamGrid from '@/components/NosotrosTeamGrid.astro';
import type { NosotrosTeamGridProps } from '@/lib/types/nosotros-page';
import { NOSOTROS_PAGE_CONTENT } from '@/lib/config/nosotros-page';
import { TEAM_MEMBERS } from '@/lib/config/team';

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
 * Behavioural contract for `NosotrosTeamGrid.astro` (change `team-members`,
 * SC-206): the verbatim header + accreditation badge and exactly the eight
 * shared-roster cards (photo 3:4, name, exact role and description). The
 * area badge and icon footer are removed.
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

describe('NosotrosTeamGrid — eight roster cards (SC-206)', () => {
  it('renders exactly 8 cards in canonical roster order', async () => {
    const html = await render();
    const articles = html.match(/<article[\s\S]*?<\/article>/g) ?? [];
    expect(articles).toHaveLength(8);

    TEAM_MEMBERS.forEach((member, index) => {
      expect(stripTags(articles[index] ?? '')).toContain(member.name);
    });
  });

  it('renders each card with the exact visible role and description from the roster', async () => {
    const html = await render();
    const articles = html.match(/<article[\s\S]*?<\/article>/g) ?? [];
    expect(articles).toHaveLength(8);

    TEAM_MEMBERS.forEach((member, index) => {
      const cardText = stripTags(articles[index] ?? '');
      expect(cardText).toContain(member.role);
      expect(cardText).toContain(member.description);
    });
  });

  it('does not render the removed area badge or footer strip', async () => {
    const html = await render();
    const text = stripTags(html);
    expect(text).not.toContain('Gestión Corporativa');
    expect(text).not.toContain('Cálculo & Comisionamiento');
    expect(text).not.toContain('Alianzas Globales');
    expect(text).not.toContain('Metrología & Faena');

    const articles = html.match(/<article[\s\S]*?<\/article>/g) ?? [];
    expect(articles).toHaveLength(8);
    for (const article of articles) {
      expect(article).not.toContain('lucide:');
      expect(article).not.toContain('bg-primary-deep');
      expect(article).not.toContain('mix-blend-color');
    }
  });

  it('renders each portrait as a lazy astro:assets image with a non-empty descriptive alt', async () => {
    const html = await render();
    const images = html.match(/<img[^>]*>/g) ?? [];
    expect(images).toHaveLength(8);
    for (const img of images) {
      expect(img).toMatch(/src="\/_(astro|image)\?/);
      expect(img).toMatch(/alt="[^"]+"/);
      expect(img).toContain('loading="lazy"');
      expect(img).toContain('object-cover');
    }
    for (const member of TEAM_MEMBERS) {
      expect(html).toContain(`alt="${member.imageAlt}"`);
    }
  });

  it('renders the portraits in full color (no grayscale filter)', async () => {
    const html = await render();
    const images = html.match(/<img[^>]*>/g) ?? [];
    expect(images).toHaveLength(8);
    for (const img of images) {
      expect(img).not.toContain('grayscale');
    }
  });

  it('uses the delivered 3:4 portrait proportion (not square)', async () => {
    const html = await render();
    expect(html).toContain('aspect-[3/4]');
    expect(html).not.toContain('aspect-square');
  });

  it('renders exactly 8 <h3> card titles and no <h1>', async () => {
    const html = await render();
    expect(html.match(/<h3[\s\S]*?<\/h3>/g) ?? []).toHaveLength(8);
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
