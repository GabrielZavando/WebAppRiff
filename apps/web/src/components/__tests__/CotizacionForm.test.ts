import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import CotizacionForm from '@/components/CotizacionForm.astro';
import { COTIZACION_PAGE_CONTENT } from '@/lib/config/cotizacion-page';
import type { CotizacionFormProps } from '@/lib/types/cotizacion-form';

const baseProps: CotizacionFormProps = COTIZACION_PAGE_CONTENT.form;

async function render(
  props: CotizacionFormProps = baseProps,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(CotizacionForm, { props: { ...props } });
}

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
  const match = html.match(
    new RegExp(`<label[^>]*for="${escaped}"[^>]*>[\\s\\S]*?</label>`),
  );
  if (!match) throw new Error(`Label for="${forId}" not found`);
  return match[0];
}

describe('CotizacionForm — form element', () => {
  it('renders a <form method="post"> with action /api/v1/quotes', async () => {
    const html = await render();
    const form = getForm(html);
    expect(form).toContain('method="post"');
    expect(form).toContain('action="/api/v1/quotes"');
  });

  it('renders the page heading "Datos del Requerimiento" as h1', async () => {
    const html = stripComments(await render());
    expect(html).toMatch(/<h1[^>]*>[\s\S]*Datos del Requerimiento[\s\S]*<\/h1>/);
  });

  it('colors the heading with the primary-dark token (maps to #2E9AAD)', async () => {
    const html = stripComments(await render());
    const h1 = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/);
    expect(h1, 'h1 element').toBeTruthy();
    expect(h1![0]).toContain('text-primary-dark');
  });
});

describe('CotizacionForm — six fields with labels', () => {
  it('renders the six inputs/textarea with correct types', async () => {
    const html = await render();
    expect(getInputByName(html, 'nombre')).toContain('type="text"');
    expect(getInputByName(html, 'email')).toContain('type="email"');
    expect(getInputByName(html, 'telefono')).toContain('type="tel"');
    expect(getInputByName(html, 'empresa')).toContain('type="text"');
    expect(getInputByName(html, 'rut')).toContain('type="text"');
    const textarea = html.match(/<textarea[^>]*name="mensaje"[^>]*>/);
    expect(textarea, 'textarea name=mensaje').toBeTruthy();
  });

  it('sends the RUT field as name="rut" (persisted by backend change)', async () => {
    const html = await render();
    expect(getInputByName(html, 'rut')).toBeTruthy();
  });

  it('associates each input with a non-empty uppercase label', async () => {
    const html = await render();
    for (const [name, id, text] of [
      ['nombre', 'cotizacion-nombre', 'NOMBRE COMPLETO'],
      ['email', 'cotizacion-email', 'CORREO ELECTRÓNICO'],
      ['telefono', 'cotizacion-telefono', 'TELÉFONO'],
      ['empresa', 'cotizacion-empresa', 'NOMBRE DE LA EMPRESA'],
      ['rut', 'cotizacion-rut', 'RUT DE LA EMPRESA'],
    ] as const) {
      const input = getInputByName(html, name);
      expect(input).toContain(`id="${id}"`);
      const label = getLabelFor(html, id);
      expect(label).toContain(text);
    }
    // Message textarea label
    const textarea = html.match(/<textarea[^>]*name="mensaje"[^>]*>/)![0];
    expect(textarea).toContain('id="cotizacion-mensaje"');
    expect(getLabelFor(html, 'cotizacion-mensaje')).toContain('MENSAJE');
  });

  it('carries placeholders from config', async () => {
    const html = await render();
    expect(getInputByName(html, 'nombre')).toContain(
      `placeholder="${baseProps.config.placeholders.nombre}"`,
    );
    expect(getInputByName(html, 'email')).toContain(
      `placeholder="${baseProps.config.placeholders.email}"`,
    );
    expect(getInputByName(html, 'rut')).toContain(
      `placeholder="${baseProps.config.placeholders.rut}"`,
    );
    const textarea = html.match(/<textarea[^>]*name="mensaje"[^>]*>/)![0];
    expect(textarea).toContain(
      `placeholder="${baseProps.config.placeholders.mensaje}"`,
    );
  });

  it('uses a responsive two-column grid layout for the text inputs', async () => {
    const html = await render();
    // Grid container: stacked on mobile, two columns on md+
    expect(html).toMatch(/grid-cols-1\s+md:grid-cols-2/);
  });
});

describe('CotizacionForm — submit button', () => {
  it('renders a submit button with accent color and arrow icon', async () => {
    const html = await render();
    const button = html.match(/<button[^>]*type="submit"[\s\S]*?<\/button>/);
    expect(button, 'submit button').toBeTruthy();
    expect(button![0]).toContain('ENVIAR SOLICITUD');
    expect(button![0]).toContain('bg-accent');
    expect(button![0]).toContain('lucide:arrow-right');
    expect(button![0]).toContain('aria-hidden="true"');
  });

  it('renders a full-width submit button, centered, with gap to the arrow', async () => {
    const html = await render();
    const button = html.match(/<button[^>]*type="submit"[\s\S]*?<\/button>/)![0];
    expect(button).toContain('w-full');
    expect(button).toContain('justify-center');
    expect(button).toMatch(/gap-\d/);
    const textIndex = button.indexOf('ENVIAR SOLICITUD');
    const iconIndex = button.indexOf('lucide:arrow-right');
    expect(iconIndex).toBeGreaterThan(textIndex);
  });
});

describe('CotizacionForm — flat design', () => {
  it('does not use rounded or shadow classes', async () => {
    const html = stripComments(await render());
    expect(html).not.toMatch(/rounded/);
    expect(html).not.toMatch(/shadow/);
  });
});
