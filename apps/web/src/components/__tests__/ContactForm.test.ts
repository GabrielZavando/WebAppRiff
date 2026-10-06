import { describe, it, expect, afterEach } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ContactForm from '@/components/ContactForm.astro';
import { CONTACT_PAGE_CONTENT } from '@/lib/config/contact-page';
import type { ContactFormProps } from '@/lib/types/contact-form';

const baseProps: ContactFormProps = CONTACT_PAGE_CONTENT.form;

async function render(
  props: ContactFormProps = baseProps,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ContactForm, { props: { ...props } });
}

// Strip HTML comments so literal mentions of tokens inside the JSX comment
// don't count as violations.
function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function getForm(html: string): string {
  const match = html.match(/<form[\s\S]*?<\/form>/);
  if (!match) throw new Error('Form not found in rendered HTML');
  return match[0];
}

function getInputByName(html: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<input[^>]*name="${escaped}"[^>]*>`));
  if (!match) throw new Error(`Input name="${name}" not found`);
  return match[0];
}

function getLabelFor(html: string, forId: string): string {
  const escaped = forId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<label[^>]*for="${escaped}"[^>]*>[\\s\\S]*?</label>`));
  if (!match) throw new Error(`Label for="${forId}" not found`);
  return match[0];
}

describe('ContactForm — form element', () => {
  afterEach(() => {
    delete import.meta.env.PUBLIC_API_URL;
  });

  it('renders a <form method="post"> with default absolute action resolved from PUBLIC_API_URL fallback', async () => {
    delete import.meta.env.PUBLIC_API_URL;
    const html = await render();
    const form = getForm(html);
    expect(form).toContain('method="post"');
    expect(form).toContain('action="http://localhost:3000/api/v1/contacts"');
  });

  it('resolves the action to an absolute URL when PUBLIC_API_URL is configured (with or without /api/v1)', async () => {
    import.meta.env.PUBLIC_API_URL = 'https://api.somosriff.cl/api/v1';
    let html = await render();
    expect(getForm(html)).toContain('action="https://api.somosriff.cl/api/v1/contacts"');

    import.meta.env.PUBLIC_API_URL = 'https://api.somosriff.cl';
    html = await render();
    expect(getForm(html)).toContain('action="https://api.somosriff.cl/api/v1/contacts"');
  });

  it('honours an already-absolute action from config', async () => {
    const html = await render({
      ...baseProps,
      config: { ...baseProps.config, action: 'https://api.riff.cl/api/v1/contacts' },
    });
    expect(getForm(html)).toContain('action="https://api.riff.cl/api/v1/contacts"');
  });

  it('honours a custom relative action from config by resolving it against PUBLIC_API_URL', async () => {
    const html = await render({
      ...baseProps,
      config: { ...baseProps.config, action: '/custom-endpoint' },
    });
    expect(getForm(html)).toContain('action="http://localhost:3000/api/v1/custom-endpoint"');
  });

  it('renders the form as a full-width white box on the blue background', async () => {
    const html = await render();
    const form = getForm(html);
    expect(form).toContain('bg-white');
    // Full content width (same container as the header), not a narrower card
    expect(form).not.toContain('max-w-3xl');
    expect(form).toContain('border-border');
  });
});

describe('ContactForm — text inputs with labels', () => {
  it('renders the four text inputs', async () => {
    const html = await render();
    expect(getInputByName(html, 'nombre')).toBeTruthy();
    expect(getInputByName(html, 'empresa')).toBeTruthy();
    expect(getInputByName(html, 'email')).toContain('type="email"');
    expect(getInputByName(html, 'telefono')).toContain('type="tel"');
  });

  it('associates each input with a non-empty uppercase label', async () => {
    const html = await render();
    for (const [name, id, text] of [
      ['nombre', 'contact-nombre', 'NOMBRE COMPLETO'],
      ['empresa', 'contact-empresa', 'EMPRESA'],
      ['email', 'contact-email', 'CORREO ELECTRÓNICO'],
      ['telefono', 'contact-telefono', 'TELÉFONO'],
    ] as const) {
      const input = getInputByName(html, name);
      expect(input).toContain(`id="${id}"`);
      const label = getLabelFor(html, id);
      expect(label).toContain(text);
    }
  });

  it('carries placeholders from config', async () => {
    const html = await render();
    expect(getInputByName(html, 'nombre')).toContain(
      `placeholder="${baseProps.config.placeholders.nombre}"`,
    );
    expect(getInputByName(html, 'email')).toContain(
      `placeholder="${baseProps.config.placeholders.email}"`,
    );
  });
});

describe('ContactForm — areas of interest checkboxes', () => {
  it('renders a fieldset with a legend', async () => {
    const html = await render();
    expect(html).toContain('<fieldset');
    expect(html).toContain('<legend');
    expect(html).toMatch(/<legend[^>]*>[\s\S]*ÁREA DE INTERÉS[\s\S]*<\/legend>/);
  });

  it('renders exactly five checkboxes named areasDeInteres', async () => {
    const html = await render();
    const checkboxes = html.match(/<input[^>]*type="checkbox"[^>]*>/g) ?? [];
    expect(checkboxes).toHaveLength(5);
    for (const cb of checkboxes) {
      expect(cb).toContain('name="areasDeInteres"');
    }
  });

  it('binds each checkbox value to its area id and labels it', async () => {
    const html = await render();
    for (const area of baseProps.areas) {
      const cb = html.match(
        new RegExp(`<input[^>]*type="checkbox"[^>]*value="${area.id}"[^>]*>`),
      );
      expect(cb, `checkbox for ${area.id}`).toBeTruthy();
      const label = getLabelFor(html, `contact-area-${area.id}`);
      expect(label).toContain(area.label);
    }
  });
});

describe('ContactForm — message textarea and submit button', () => {
  it('renders a labelled message textarea', async () => {
    const html = await render();
    const textarea = html.match(/<textarea[^>]*name="mensaje"[^>]*>/);
    expect(textarea, 'textarea name=mensaje').toBeTruthy();
    expect(textarea![0]).toContain('id="contact-mensaje"');
    expect(textarea![0]).toContain(
      `placeholder="${baseProps.config.placeholders.mensaje}"`,
    );
    expect(getLabelFor(html, 'contact-mensaje')).toContain(
      'MENSAJE O REQUERIMIENTO ESPECÍFICO',
    );
  });

  it('renders a submit button with accent color and arrow icon', async () => {
    const html = await render();
    const form = getForm(html);
    const button = form.match(/<button[^>]*type="submit"[\s\S]*?<\/button>/);
    expect(button, 'submit button').toBeTruthy();
    expect(button![0]).toContain('ENVIAR MENSAJE');
    expect(button![0]).toContain('bg-accent');
    // Decorative arrow icon, hidden from assistive tech
    expect(button![0]).toContain('lucide:arrow-right');
    expect(button![0]).toContain('aria-hidden="true"');
  });

  it('renders a full-width submit button, centered, with an elegant gap to the arrow', async () => {
    const html = await render();
    const form = getForm(html);
    const button = form.match(/<button[^>]*type="submit"[\s\S]*?<\/button>/);
    expect(button, 'submit button').toBeTruthy();
    // Full width of the form
    expect(button![0]).toContain('w-full');
    // Centered flex layout (text+icon group centered in the button)
    expect(button![0]).toContain('justify-center');
    // Elegant separation between text and icon (icon not stuck to text)
    expect(button![0]).toMatch(/gap-\d/);
    // The arrow icon must appear AFTER the visible text in DOM order
    const textIndex = button![0].indexOf('ENVIAR MENSAJE');
    const iconIndex = button![0].indexOf('lucide:arrow-right');
    expect(textIndex).toBeGreaterThanOrEqual(0);
    expect(iconIndex).toBeGreaterThan(textIndex);
  });
});

describe('ContactForm — flat design', () => {
  it('does not use rounded or shadow classes', async () => {
    const html = stripComments(await render());
    expect(html).not.toMatch(/rounded/);
    expect(html).not.toMatch(/shadow/);
  });

  it('spans the full page content width (same as the header), not a narrower card', async () => {
    const html = await render();
    const form = getForm(html);
    // White box, but full content width — NOT a narrower max-w-3xl card
    expect(form).toContain('bg-white');
    expect(form).not.toContain('max-w-3xl');
    // The outer wrapper uses the site container with the same side margins as the header
    const wrapper = html.match(/<div class="container mx-auto[^"]*">[\s\S]*?<\/form>/)![0];
    expect(wrapper).toContain('container mx-auto px-4 sm:px-6 lg:px-8');
  });
});

describe('ContactForm — required field indicators', () => {
  const REQUIRED_FIELDS = [
    ['contact-nombre', 'nombre'],
    ['contact-empresa', 'empresa'],
    ['contact-email', 'email'],
    ['contact-telefono', 'telefono'],
    ['contact-mensaje', 'mensaje'],
  ] as const;

  it('marks every required label with an aria-hidden asterisk', async () => {
    const html = await render();
    for (const [labelFor, name] of REQUIRED_FIELDS) {
      const label = getLabelFor(html, labelFor);
      expect(label, `label for ${name}`).toMatch(
        /<span aria-hidden="true"[^>]*>\*<\/span>/,
      );
      // `mensaje` is a textarea; the rest are inputs.
      const control =
        name === 'mensaje'
          ? (html.match(/<textarea[^>]*name="mensaje"[^>]*>/) ?? [''])[0]
          : getInputByName(html, name);
      expect(control, `control ${name}`).toContain('required');
    }
  });

  it('explains the asterisk convention above the fields', async () => {
    const html = await render();
    expect(html).toContain('son obligatorios');
  });

  it('does not mark the honeypot as required', async () => {
    const html = await render();
    expect(getInputByName(html, 'website')).not.toContain('required');
  });
});

describe('ContactForm — honeypot and inline submit status', () => {
  it('renders a hidden honeypot website field', async () => {
    const html = await render();
    const input = getInputByName(html, 'website');
    expect(input).toContain('tabindex="-1"');
    expect(input).toContain('autocomplete="off"');
    expect(input).toContain('aria-hidden="true"');
  });

  it('renders an accessible inline status region inside the form', async () => {
    const html = await render();
    const form = getForm(html);
    expect(form).toMatch(/role="status"/);
    expect(form).toMatch(/aria-live="polite"/);
  });

  it('keeps the flat design with the honeypot and status elements', async () => {
    const html = stripComments(await render());
    expect(html).not.toMatch(/rounded/);
    expect(html).not.toMatch(/shadow/);
  });
});

describe('ContactForm — snapshot', () => {
  it('matches the snapshot', async () => {
    const html = await render();
    expect(html).toMatchSnapshot();
  });
});
