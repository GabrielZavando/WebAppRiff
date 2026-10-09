import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Toast from '@/components/Toast.astro';

type ToastProps = {
  variant?: 'success' | 'error';
  message?: string;
};

async function render(props: ToastProps = {}): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Toast, { props });
}

// Strip HTML comments so literal mentions of tokens inside the comment blocks
// don't count as violations (same pattern as ContactForm.test.ts).
function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function getRoot(html: string): string {
  // The toast renders standalone in the container and its root contains nested
  // elements, so match from the root div to the end of the document.
  const match = html.match(/<div[^>]*data-form-toast[\s\S]*/);
  if (!match) throw new Error('Toast root not found in rendered HTML');
  return match[0];
}

function getMessageElement(html: string): string {
  const match = html.match(/<p[^>]*data-toast-message[^>]*>[\s\S]*?<\/p>/);
  if (!match) throw new Error('Toast message element not found');
  return match[0];
}

function getMessageText(html: string): string {
  return getMessageElement(html)
    .replace(/^<p[^>]*>/, '')
    .replace(/<\/p>$/, '');
}

function getCloseButton(html: string): string {
  const match = html.match(/<button[^>]*[\s\S]*?<\/button>/);
  if (!match) throw new Error('Close button not found in rendered HTML');
  return match[0];
}

describe('Toast — variants (SSG render)', () => {
  it('renders the success variant with check icon, message prop, and hidden status region', async () => {
    const html = await render({
      variant: 'success',
      message: '¡Gracias! Mensaje enviado',
    });
    expect(html).toContain('data-variant="success"');
    expect(html).toContain('data-icon="lucide:circle-check"');
    expect(getMessageText(html)).toBe('¡Gracias! Mensaje enviado');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('data-state="hidden"');
    expect(html).toContain(' hidden');
  });

  it('renders the error variant with alert icon, message prop, and alert region', async () => {
    const html = await render({
      variant: 'error',
      message: 'Ocurrió un error, reintenta.',
    });
    expect(html).toContain('data-variant="error"');
    expect(html).toContain('data-icon="lucide:circle-alert"');
    expect(getMessageText(html)).toBe('Ocurrió un error, reintenta.');
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="assertive"');
    expect(html).toContain('data-state="hidden"');
    expect(html).toContain(' hidden');
  });

  it('resolves the visibility of each icon via CSS data-variant hooks (both icons in markup)', async () => {
    const html = await render({ variant: 'success' });
    // Both icons are always in the markup; visibility per variant is CSS-driven
    // (group-data hooks on the root's data-variant), never JS DOM manipulation.
    expect(html).toContain('data-icon="lucide:circle-check"');
    expect(html).toContain('data-icon="lucide:circle-alert"');
    expect(html).toMatch(/group-data-\[variant=error\]:hidden/);
    expect(html).toMatch(/group-data-\[variant=success\]:hidden/);
  });
});

describe('Toast — aria-live region pre-existing and empty', () => {
  it('renders the default toast with a pre-existing empty live region (no on-the-fly mounting)', async () => {
    const html = await render();
    const root = getRoot(html);
    // The region (role/aria-live/hidden) already exists in the initial HTML so
    // screen readers register it before any content change.
    expect(root).toContain('data-form-toast');
    expect(root).toContain('hidden');
    expect(root).toContain('role="status"');
    expect(root).toContain('aria-live="polite"');
    // Empty content: the message is only filled upon receiving the result.
    expect(getMessageText(html)).toBe('');
  });
});

describe('Toast — explicit close control', () => {
  it('renders an X close button with a descriptive aria-label and decorative icon', async () => {
    const html = await render();
    const button = getCloseButton(html);
    expect(button).toContain('aria-label="Cerrar notificación"');
    expect(button).toContain('data-icon="lucide:x"');
    expect(button).toContain('aria-hidden="true"');
    // A plain button: never submits a form (even if it were nested in one).
    expect(button).toContain('type="button"');
  });

  it('marks the toast root and close button so document-level delegation can resolve them', async () => {
    const html = await render();
    expect(html).toContain('data-form-toast');
    expect(html).toContain('data-toast-close');
  });
});

describe('Toast — fixed non-blocking position', () => {
  it('is fixed at the top-right corner above the header and FAB, with no backdrop', async () => {
    const html = stripComments(await render());
    const root = getRoot(html);
    expect(root).toMatch(/class="[^"]*\bfixed\b[^"]*"/);
    expect(root).toContain('top-6');
    expect(root).toContain('right-6');
    expect(root).toContain('z-40');
    // Non-blocking: no fullscreen overlay/backdrop displacing the page.
    expect(html).not.toContain('backdrop');
    expect(html).not.toContain('inset-0');
  });
});

describe('Toast — design tokens and flat design', () => {
  it('does not hardcode hex colors in the markup', async () => {
    const html = stripComments(await render({ variant: 'error' }));
    // The only '#' occurrences are astro-icon's internal `href="#ai:..."` refs,
    // which are not hex color literals (the run breaks at 'i').
    expect(html).not.toMatch(/#[0-9a-fA-F]{3}([^0-9a-fA-F]|$)/);
  });

  it('uses the success/error token scales for colors', async () => {
    const successHtml = await render({ variant: 'success' });
    expect(successHtml).toMatch(/bg-success-light/);
    expect(successHtml).toMatch(/text-success-dark/);
    const errorHtml = await render({ variant: 'error' });
    expect(errorHtml).toMatch(/bg-error-light/);
    expect(errorHtml).toMatch(/text-error-dark/);
  });

  it('does not use rounded or shadow classes', async () => {
    const html = stripComments(await render());
    expect(html).not.toMatch(/rounded/);
    expect(html).not.toMatch(/shadow/);
  });
});

describe('Toast — snapshot', () => {
  it('matches the snapshot', async () => {
    const html = await render();
    expect(html).toMatchSnapshot();
  });
});
