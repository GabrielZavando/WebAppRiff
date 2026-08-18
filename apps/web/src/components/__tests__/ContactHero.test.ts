import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ContactHero from '@/components/ContactHero.astro';
import type { ContactHeroProps } from '@/lib/types/contact-form';

const baseProps: ContactHeroProps = {
  headline: 'Conecte con la Ingeniería de Precisión',
  highlightedWord: 'Ingeniería de Precisión',
  subtitle:
    'Expertos en medición de fluidos, control y tratamiento de agua. Soporte técnico y ejecución en terreno garantizada.',
};

async function render(
  props: ContactHeroProps = baseProps,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ContactHero, { props: { ...props } });
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

describe('ContactHero — headline & highlight', () => {
  it('renders the full headline text', async () => {
    const html = await render();
    expect(stripTags(html)).toContain('Conecte con la Ingeniería de Precisión');
  });

  it('wraps the highlighted word in a span.text-primary', async () => {
    const html = await render();
    // The highlighted substring must be wrapped in <span class="text-primary">
    expect(html).toMatch(
      /<span class="text-primary">Ingeniería de Precisión<\/span>/,
    );
  });

  it('does not render a highlight span when highlightedWord is empty', async () => {
    const html = await render({
      ...baseProps,
      highlightedWord: '',
    });
    expect(html).not.toContain('text-primary');
    expect(stripTags(html)).toContain('Conecte con la Ingeniería de Precisión');
  });

  it('does not render a highlight span when the word is absent from the headline', async () => {
    const html = await render({
      headline: 'Contacto simple',
      highlightedWord: 'Inexistente',
      subtitle: 'Sub',
    });
    expect(html).not.toContain('text-primary');
    expect(stripTags(html)).toContain('Contacto simple');
  });
});

describe('ContactHero — subtitle', () => {
  it('renders the subtitle as a non-empty element', async () => {
    const html = await render();
    expect(stripTags(html)).toContain(
      'Expertos en medición de fluidos, control y tratamiento de agua.',
    );
  });
});

describe('ContactHero — flat design', () => {
  it('does not use rounded or shadow classes', async () => {
    const html = await render();
    const clean = stripComments(html);
    expect(clean).not.toMatch(/rounded/);
    expect(clean).not.toMatch(/shadow/);
  });

  it('has no large bottom padding (the hero↔form gap is set by the page spacer)', async () => {
    const html = await render();
    const clean = stripComments(html);
    const section = clean.match(/<section[^>]*>[\s\S]*?<\/section>/)![0];
    // pb-0: the gap to the form is a 16/32px spacer in contacto.astro, not this padding
    expect(section).toContain('pb-0');
    expect(section).not.toMatch(/pb-(16|24|32)/);
  });
});

describe('ContactHero — snapshot', () => {
  it('matches the snapshot', async () => {
    const html = await render();
    expect(html).toMatchSnapshot();
  });
});
