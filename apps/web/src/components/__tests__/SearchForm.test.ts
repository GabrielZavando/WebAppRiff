import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import SearchForm from '@/components/SearchForm.astro';
import {
  CATEGORY_OPTIONS,
  getSearchFormConfig,
} from '@/lib/config/search-form';
import type { SearchFormProps } from '@/lib/types/search-form';

const baseProps: SearchFormProps = {
  categories: CATEGORY_OPTIONS,
  config: getSearchFormConfig(),
};

async function render(
  props: SearchFormProps = baseProps,
): Promise<string> {
  const container = await AstroContainer.create();
  // Spread into a fresh literal so the props are assignable to Astro's Props
  // (which carries an index signature for arbitrary attributes).
  return container.renderToString(SearchForm, { props: { ...props } });
}

function getForm(html: string): string {
  const match = html.match(/<form[\s\S]*?<\/form>/);
  if (!match) throw new Error('Form not found in rendered HTML');
  return match[0];
}

function getSelect(html: string): string {
  const match = html.match(/<select[\s\S]*?<\/select>/);
  if (!match) throw new Error('Select not found in rendered HTML');
  return match[0];
}

function getInput(html: string): string {
  const match = html.match(/<input[^>]*>/);
  if (!match) throw new Error('Input not found in rendered HTML');
  return match[0];
}

function getButton(html: string): string {
  const match = html.match(/<button[^>]*type="submit"[\s\S]*?<\/button>/);
  if (!match) throw new Error('Submit button not found in rendered HTML');
  return match[0];
}

describe('SearchForm — search landmark & structure', () => {
  it('renders a <div role="search"> wrapper with aria-label', async () => {
    const html = await render();
    expect(html).toContain('<div role="search"');
    expect(html).toContain('aria-label="Buscar productos"');
  });

  it('never introduces a <header> landmark', async () => {
    const html = await render();
    // Strip HTML comments so literal "<header" mentions inside them (e.g.
    // the rule-of-thumb note in the JSX comment) don't count as landmarks.
    const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
    expect(withoutComments).not.toContain('<header');
    expect(withoutComments).not.toMatch(/<\/header>/);
  });
});

describe('SearchForm — category select', () => {
  it('renders a <select> with name="categoriaId"', async () => {
    const html = await render();
    const select = getSelect(html);
    expect(select).toContain('name="categoriaId"');
  });

  it('renders "Todas las categorías" as the first <option selected> with empty value', async () => {
    const html = await render();
    const select = getSelect(html);
    const options = [...select.matchAll(/<option[^>]*>([^<]*)<\/option>/g)].map(
      (m) => m[0] ?? '',
    );
    expect(options.length).toBeGreaterThan(0);
    const first = options[0] ?? '';
    // Astro serialises value="" as the boolean-style attribute `value` (no `=""`).
    // Both `<option value selected>` and `<option value="" selected>` are valid
    // representations of the empty string; we accept either form.
    expect(first).toMatch(/\bvalue(?:="")?\b/);
    expect(first).toContain('selected');
    expect(first).toContain(`>Todas las categorías<`);
  });

  it('renders options in the order of the categories prop with value={id} and text {label}', async () => {
    const html = await render();
    const select = getSelect(html);
    const options = [...select.matchAll(/<option[^>]*>([^<]*)<\/option>/g)].map(
      (m) => m[0] ?? '',
    );
    expect(options).toHaveLength(CATEGORY_OPTIONS.length);
    CATEGORY_OPTIONS.forEach((category, index) => {
      const option = options[index] ?? '';
      // Empty id is serialised as `value` (boolean-style), non-empty as `value="..."`.
      if (category.id === '') {
        expect(option).toMatch(/\bvalue(?:="")?\b/);
      } else {
        expect(option).toContain(`value="${category.id}"`);
      }
      expect(option).toContain(`>${category.label}<`);
    });
  });

  it('pre-selects the option matching initialCategoriaId and unselects the default', async () => {
    const html = await render({
      ...baseProps,
      initialCategoriaId: 'herramientas',
    });
    const select = getSelect(html);
    const herramientas = select.match(/<option[^>]*value="herramientas"[^>]*>/)?.[0] ?? '';
    const allCats = select.match(/<option[^>]*value=""[^>]*>/)?.[0] ?? '';
    expect(herramientas).toContain('selected');
    expect(allCats).not.toContain('selected');
  });

  it('has a <label for="<select-id>"> with non-empty text', async () => {
    const html = await render();
    const selectMatch = html.match(/<select[^>]*id="([^"]+)"/);
    const selectId = selectMatch?.[1] ?? '';
    expect(selectId).not.toBe('');
    const labelMatch = html.match(
      new RegExp(`<label[^>]*for="${selectId}"[^>]*>([^<]+)</label>`),
    );
    expect(labelMatch).not.toBeNull();
    expect((labelMatch?.[1] ?? '').trim()).not.toBe('');
  });
});

describe('SearchForm — search input', () => {
  it('renders an <input type="search"> with name="q" and the configured placeholder', async () => {
    const html = await render();
    const input = getInput(html);
    expect(input).toContain('type="search"');
    expect(input).toContain('name="q"');
    expect(input).toContain('placeholder="¿Qué solución está buscando?"');
  });

  it('has a <label for="<input-id>"> with non-empty text', async () => {
    const html = await render();
    const inputMatch = html.match(/<input[^>]*id="([^"]+)"/);
    const inputId = inputMatch?.[1] ?? '';
    expect(inputId).not.toBe('');
    const labelMatch = html.match(
      new RegExp(`<label[^>]*for="${inputId}"[^>]*>([^<]+)</label>`),
    );
    expect(labelMatch).not.toBeNull();
    expect((labelMatch?.[1] ?? '').trim()).not.toBe('');
  });

  it('pre-fills the input value when initialQuery is provided (verbatim, no trim)', async () => {
    const html = await render({
      ...baseProps,
      initialQuery: 'taladro',
    });
    const input = getInput(html);
    expect(input).toContain('value="taladro"');
  });
});

describe('SearchForm — submit button', () => {
  it('renders a <button type="submit"> with label "BUSCAR" using bg-brand-orange', async () => {
    const html = await render();
    const button = getButton(html);
    expect(button).toContain('type="submit"');
    expect(button).toContain('bg-brand-orange');
    expect(button).toContain('>BUSCAR<');
  });
});

describe('SearchForm — form attributes', () => {
  it('renders <form method="get" action="/productos">', async () => {
    const html = await render();
    const form = getForm(html);
    expect(form).toContain('method="get"');
    expect(form).toContain('action="/productos"');
  });

  it('uses the action from config when overridden', async () => {
    const html = await render({
      ...baseProps,
      config: {
        ...baseProps.config,
        action: '/catalogo',
      },
    });
    const form = getForm(html);
    expect(form).toContain('action="/catalogo"');
  });
});

describe('SearchForm — responsive layout classes', () => {
  it('uses flex-col layout for mobile stacking (and md:flex-row for desktop)', async () => {
    const html = await render();
    const form = getForm(html);
    expect(form).toContain('flex');
    expect(form).toContain('flex-col');
    expect(form).toContain('md:flex-row');
  });

  it('makes the controls full-width on mobile and the input expandable on desktop', async () => {
    const html = await render();
    expect(html).toContain('w-full');
    expect(html).toContain('md:flex-1');
  });
});

describe('SearchForm — snapshot', () => {
  it('matches the snapshot for full SearchForm', async () => {
    const html = await render();
    expect(html).toMatchSnapshot();
  });
});
