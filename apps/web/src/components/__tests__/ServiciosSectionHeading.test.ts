import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ServiciosSectionHeading from '@/components/ServiciosSectionHeading.astro';
import type { ServiciosSectionHeadingProps } from '@/lib/types/services-page';

const BASE_PROPS: ServiciosSectionHeadingProps = {
  eyebrow: 'LÍNEA DE EQUIPAMIENTO & TECNOLOGÍA',
  headline: 'Nuestras Soluciones — Portafolio Técnico',
  intro:
    'Suministro especializado, instrumentación y tecnologías certificadas para redes de agua, plantas industriales y minería.',
  markerTone: 'primary',
};

async function render(
  props: Partial<ServiciosSectionHeadingProps> = {},
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ServiciosSectionHeading, {
    props: { ...BASE_PROPS, ...props },
  });
}

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

describe('ServiciosSectionHeading — content', () => {
  it('renders the eyebrow in primary uppercase', async () => {
    const html = stripComments(await render());
    const eyebrow = html.match(/<span[^>]*data-eyebrow[^>]*>[\s\S]*?<\/span>/);
    expect(eyebrow).not.toBeNull();
    expect(eyebrow![0]).toContain('LÍNEA DE EQUIPAMIENTO &amp; TECNOLOGÍA');
    expect(eyebrow![0]).toContain('text-primary');
    expect(eyebrow![0]).toContain('uppercase');
  });

  it('renders the headline as an h2', async () => {
    const html = stripComments(await render());
    expect(html).toMatch(
      /<h2[^>]*>Nuestras Soluciones — Portafolio Técnico<\/h2>/,
    );
  });

  it('renders the intro as a paragraph', async () => {
    const html = stripComments(await render());
    expect(html).toMatch(/<p[^>]*>Suministro especializado/);
  });
});

describe('ServiciosSectionHeading — marker tone', () => {
  it('uses bg-primary for the primary tone', async () => {
    const html = stripComments(await render({ markerTone: 'primary' }));
    const marker = html.match(/<span[^>]*data-marker[^>]*>/);
    expect(marker).not.toBeNull();
    expect(marker![0]).toContain('bg-primary');
    expect(marker![0]).not.toContain('bg-accent');
  });

  it('uses bg-accent for the accent tone', async () => {
    const html = stripComments(
      await render({
        markerTone: 'accent',
        eyebrow: 'EJECUCIÓN, MONTAJE & POSTVENTA',
        headline: 'Servicios Especializados en Terreno',
      }),
    );
    const marker = html.match(/<span[^>]*data-marker[^>]*>/);
    expect(marker).not.toBeNull();
    expect(marker![0]).toContain('bg-accent');
    expect(marker![0]).not.toContain('bg-primary');
  });
});

describe('ServiciosSectionHeading — flat design', () => {
  it('does not use rounded or shadow classes', async () => {
    const html = stripComments(await render());
    expect(html).not.toMatch(/class="[^"]*rounded/);
    expect(html).not.toMatch(/class="[^"]*shadow/);
  });
});
