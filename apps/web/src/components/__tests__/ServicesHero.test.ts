import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ServicesHero from '@/components/ServicesHero.astro';
import type { ServicesHeroProps } from '@/lib/types/services-page';

const baseProps: ServicesHeroProps = {
  headline: 'Portafolio industrial de soluciones & Servicios Industriales',
  highlightedWord: 'Servicios Industriales',
  subtitle:
    'Soluciones técnicas integrales para la instalación, mantenimiento y optimización de sistemas de medición y tratamiento de fluidos.',
};

async function render(
  props: ServicesHeroProps = baseProps,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ServicesHero, { props: { ...props } });
}

// Strip HTML comments so literal mentions of tokens inside the JSX comment
// (e.g. the note "no `rounded*` and no `shadow*`") don't count as violations.
function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

// Strip HTML tags so the highlighted `<span>` doesn't break the contiguous
// headline string when asserting the full text is present.
function stripTags(html: string): string {
  return stripComments(html).replace(/<[^>]+>/g, '');
}

describe('ServicesHero — headline & highlight', () => {
  it('renders the <h1> fully uppercase', async () => {
    const html = await render();
    const clean = html.replace(/<!--[\s\S]*?-->/g, '');
    const h1Match = clean.match(/<h1[^>]*>/);
    if (!h1Match) throw new Error('h1 not found');
    expect(h1Match[0]).toContain('uppercase');
  });

  it('renders the full headline text', async () => {
    const html = await render();
    expect(stripTags(html)).toContain(
      'Portafolio industrial de soluciones &amp; Servicios Industriales',
    );
  });

  it('wraps the highlighted words in a span.text-primary', async () => {
    const html = await render();
    expect(html).toMatch(
      /<span class="text-primary">Servicios Industriales<\/span>/,
    );
  });

  it('does not render a highlight span when highlightedWord is empty', async () => {
    const html = await render({ ...baseProps, highlightedWord: '' });
    // Strip the component's own HTML comment (which mentions tokens verbatim).
    expect(stripComments(html)).not.toContain('text-primary');
    expect(stripTags(html)).toContain(
      'Portafolio industrial de soluciones &amp; Servicios Industriales',
    );
  });

  it('does not render a highlight span when the word is absent from the headline', async () => {
    const html = await render({
      headline: 'Servicios simples',
      highlightedWord: 'Inexistente',
      subtitle: 'Sub',
    });
    expect(stripComments(html)).not.toContain('text-primary');
    expect(stripTags(html)).toContain('Servicios simples');
  });
});

describe('ServicesHero — subtitle', () => {
  it('renders the subtitle as a non-empty element', async () => {
    const html = await render();
    expect(stripTags(html)).toContain(
      'Soluciones técnicas integrales para la instalación',
    );
  });
});

describe('ServicesHero — transparent section over banner & flat design', () => {
  it('renders a transparent section (no own background) with white headline', async () => {
    const html = await render();
    const clean = stripComments(html);
    expect(clean).not.toContain('bg-secondary-dark');
    expect(clean).not.toMatch(/<section[^>]*class="[^"]*bg-/);
    expect(clean).toMatch(/<h1[^>]*class="[^"]*text-white/);
  });

  it('does not use rounded or shadow classes', async () => {
    const html = await render();
    const clean = stripComments(html);
    expect(clean).not.toMatch(/rounded/);
    expect(clean).not.toMatch(/shadow/);
  });
});

describe('ServicesHero — snapshot', () => {
  it('matches the snapshot', async () => {
    const html = await render();
    expect(html).toMatchSnapshot();
  });
});
