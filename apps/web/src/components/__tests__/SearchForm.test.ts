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

async function renderTransparent(
  props: SearchFormProps = baseProps,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(SearchForm, {
    props: { ...props, transparent: true },
  });
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
    expect(input).toContain('placeholder="¿Qué productos estás buscando?"');
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
  it('renders a <button type="submit"> with label "BUSCAR" using bg-primary', async () => {
    const html = await render();
    const button = getButton(html);
    expect(button).toContain('type="submit"');
    expect(button).toContain('bg-primary');
    expect(button).toContain('hover:bg-primary-dark');
    expect(button).not.toContain('bg-accent');
    expect(button).toContain('BUSCAR');
  });

  it('uses flex layout for icon+text alignment with wider padding', async () => {
    const html = await render();
    const button = getButton(html);
    expect(button).toContain('flex');
    expect(button).toContain('items-center');
    expect(button).toContain('justify-center');
    expect(button).toContain('gap-2');
    expect(button).toContain('px-8');
    expect(button).not.toContain('px-6');
  });
});

describe('SearchForm — submit button search icon', () => {
  it('renders a lucide:search icon inside the button before the label', async () => {
    const html = await render();
    const button = getButton(html);
    // The Icon component renders as an inline <svg> in SSR.
    expect(button).toContain('<svg');
    // The icon is decorative (aria-hidden) — the button's accessible name is "BUSCAR".
    expect(button).toContain('aria-hidden="true"');
  });

  it('places the icon before the BUSCAR text label', async () => {
    const html = await render();
    const button = getButton(html);
    const svgIndex = button.indexOf('<svg');
    // Search for "BUSCAR" AFTER the SVG closes so the HTML comment
    // mentioning "BUSCAR" doesn't produce a false match.
    const svgEnd = button.indexOf('</svg>');
    const textIndex = button.indexOf('BUSCAR', svgEnd);
    expect(svgIndex).toBeGreaterThan(-1);
    expect(textIndex).toBeGreaterThan(-1);
    expect(svgIndex).toBeLessThan(textIndex);
  });
});

describe('SearchForm — component max-width & centering', () => {
  it('constrains the form container to max-w-[860px] centered and removes the container utility', async () => {
    const html = await render();
    // The inner div is the direct parent of <form>; it carries the max-width + centering.
    const formMatch = html.match(/<form[\s\S]*?<\/form>/);
    expect(formMatch).toBeTruthy();
    // Find the parent div of the form (directly wrapping it).
    const formHtml = formMatch![0] ?? '';
    const formStart = html.indexOf(formHtml);
    const beforeForm = html.slice(0, formStart);
    const divMatches = beforeForm.matchAll(/<div[^>]*>/g);
    const divsBeforeForm = [...divMatches].map((m) => m[0] ?? '');
    // The closest preceding div is the container. It should have max-w-[860px] and NOT
    // the `container` utility (which would impose max-w-7xl = 1280px with padding).
    const containerDiv = divsBeforeForm[divsBeforeForm.length - 1] ?? '';
    expect(containerDiv).toContain('max-w-[860px]');
    expect(containerDiv).toContain('mx-auto');
    expect(containerDiv).not.toContain('container');
    expect(containerDiv).not.toMatch(/px-[468]/);
  });
});

describe('SearchForm — desktop gap (1px between controls)', () => {
  it('uses gap-3 for mobile and md:gap-px for desktop (replacing md:gap-3)', async () => {
    const html = await render();
    const form = getForm(html);
    expect(form).toContain('gap-3');
    expect(form).toContain('md:gap-px');
    expect(form).not.toContain('md:gap-3');
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

describe('SearchForm — token-based border & focus (task 8.21)', () => {
  it('the <select> uses the border-border token (--color-border) and NOT border-gray-300', async () => {
    const html = await render();
    const select = getSelect(html);
    expect(select).toContain('border-border');
    expect(select).not.toContain('border-gray-300');
  });

  it('the <input> uses the border-border token (--color-border) and NOT border-gray-300', async () => {
    const html = await render();
    const input = getInput(html);
    expect(input).toContain('border-border');
    expect(input).not.toContain('border-gray-300');
  });

  it('the <select> focus state uses focus:border-primary (--color-primary) and NOT focus:ring-accent', async () => {
    const html = await render();
    const select = getSelect(html);
    expect(select).toContain('focus:border-primary');
    expect(select).not.toContain('focus:ring-accent');
    expect(select).not.toContain('focus:ring-2');
  });

  it('the <input> focus state uses focus:border-primary (--color-primary) and NOT focus:ring-accent', async () => {
    const html = await render();
    const input = getInput(html);
    expect(input).toContain('focus:border-primary');
    expect(input).not.toContain('focus:ring-accent');
    expect(input).not.toContain('focus:ring-2');
  });
});

describe('SearchForm — snapshot', () => {
  it('matches the snapshot for full SearchForm', async () => {
    const html = await render();
    expect(html).toMatchSnapshot();
  });
});

describe('SearchForm — transparent mode (home hero full-bleed background)', () => {
  it('removes the white wrapper background and bottom border in transparent mode', async () => {
    const html = await renderTransparent();
    const wrapper = html.match(/<div role="search"[^>]*>/)?.[0] ?? '';

    const wrapperClass = wrapper.match(/class="([^"]*)"/)?.[1] ?? '';
    expect(wrapperClass).not.toContain('bg-white');
    expect(wrapperClass).not.toContain('border-gray-200');

    // The <form> sits directly in the container; the white wrapper (outer div)
    // no longer carries border-b on its own. Controls (select/input) keep
    // their white fields, so the assertion targets the wrapper/border only.
    expect(wrapperClass).not.toContain('border-b');
  });

  it('keeps the form, select, input and submit button in transparent mode', async () => {
    const html = await renderTransparent();

    expect(html).toContain('role="search"');
    expect(getForm(html)).toContain('method="get"');
    expect(getSelect(html)).toContain('name="categoriaId"');
    expect(getInput(html)).toContain('type="search"');
    expect(getButton(html)).toContain('BUSCAR');
  });

  it('keeps the select and input fields on a white background in transparent mode', async () => {
    // Spec: search-form § "The select and input fields keep their white
    // background for legibility". Only the wrapper loses its fill; the
    // controls must stay readable over the hero image.
    const html = await renderTransparent();

    expect(getSelect(html)).toContain('bg-white');
    expect(getInput(html)).toContain('bg-white');
    // The submit button keeps bg-primary (not bg-white, not bg-accent).
    expect(getButton(html)).toContain('bg-primary');
    expect(getButton(html)).not.toContain('bg-accent');
  });

  it('defaults to the white background wrapper when transparent is not set', async () => {
    const html = await render();
    const wrapper = html.match(/<div role="search"[^>]*>/)?.[0] ?? '';

    expect(wrapper).toContain('bg-white');
    expect(html).toContain('border-border');
  });

  it('select, input and button do not use rounded* utility (flat radio 0)', async () => {
    const html = await render();
    // helper to check a control doesn't have rounded*
    function assertNoRounded(controlHtml: string, name: string) {
      expect(controlHtml, `${name} must not use rounded* (flat radio 0)`).not.toMatch(
        /(?<=[\s"'`{])rounded(?:-(?:sm|md|lg|xl|2xl|3xl|full|t|b|l|r|tl|tr|bl|br|none))?(?=[\s"'`}])/
      );
    }
    assertNoRounded(getSelect(html), 'select');
    assertNoRounded(getInput(html), 'input');
    assertNoRounded(getButton(html), 'button');
  });
});
