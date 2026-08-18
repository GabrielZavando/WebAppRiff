import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ContactoPage from '@/pages/contacto.astro';

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

async function render(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ContactoPage, {});
}

describe('Contact page composition', () => {
  it('renders the contact hero headline', async () => {
    const html = await render();
    const clean = stripComments(html);
    expect(clean).toContain('Conecte con la');
    expect(clean).toContain('Ingeniería de Precisión');
  });

  it('renders the contact form with POST method', async () => {
    const html = await render();
    const clean = stripComments(html);
    expect(clean).toMatch(/<form[^>]*method="post"[\s\S]*?<\/form>/);
    expect(clean).toContain('action="/api/v1/contacts"');
  });

  it('renders the contact bar with the phone anchor', async () => {
    const html = await render();
    const clean = stripComments(html);
    expect(clean).toContain('href="tel:+56229079067"');
    expect(clean).toContain('contacto@riff.cl');
  });

  it('does not introduce a second header landmark', async () => {
    const html = await render();
    const clean = stripComments(html);
    // Layout renders exactly one <header> (site-header); the contact page must
    // not add another.
    const headerCount = (clean.match(/<header/g) ?? []).length;
    expect(headerCount).toBe(1);
  });

  it('renders a solid deep-teal (#006874, bg-primary-deep) background and no hero image', async () => {
    const html = await render();
    const clean = stripComments(html);
    // Solid blue background wrapper (correction: fondo #006874 = bg-primary-deep)
    expect(clean).toContain('bg-primary-deep');
    // The banner_home.webp hero image must NOT be rendered on this page
    expect(clean).not.toContain('banner_home');
  });

  it('renders the contact bar below the form, on the same background, aligned to the form width', async () => {
    const html = await render();
    const clean = stripComments(html);
    const formEnd = clean.indexOf('</form>');
    const barStart = clean.indexOf('tel:+56229079067');
    // Bar must appear AFTER the form in DOM order
    expect(barStart).toBeGreaterThan(formEnd);
    // The bar must NOT be a distinct dark footer strip
    // The bar section uses the same background and is constrained to the form width
    const sectionStart = clean.lastIndexOf('<section', barStart);
    const sectionEnd = clean.indexOf('</section>', barStart);
    const barSection = clean.slice(sectionStart, sectionEnd);
    expect(barSection).toContain('bg-primary-deep');
    // The contact bar must NOT be a distinct dark footer strip (bg-secondary-dark);
    // note: the global Footer uses bg-secondary-dark, but the contact bar must not.
    expect(barSection).not.toContain('bg-secondary-dark');
    // The bar aligns to the full page content width (same container as the header/form)
    expect(barSection).toContain('container mx-auto');
    expect(barSection).not.toContain('max-w-3xl');
  });

  it('hides the global search form on the contact page', async () => {
    const html = await render();
    const clean = stripComments(html);
    // No global search landmark and no search submit button
    expect(clean).not.toContain('role="search"');
    expect(clean).not.toContain('BUSCAR');
  });

  it('separates the hero from the form by a small 16/32px gap', async () => {
    const html = await render();
    const clean = stripComments(html);
    const h1 = clean.indexOf('<h1');
    const form = clean.indexOf('<form method="post"');
    const spacer = clean.indexOf('h-4 sm:h-8');
    // Spacer must exist and sit between the hero headline and the form
    expect(spacer, 'spacer h-4 sm:h-8').toBeGreaterThanOrEqual(0);
    expect(spacer).toBeGreaterThan(h1);
    expect(spacer).toBeLessThan(form);
    // The hero must not contribute a large bottom padding (the gap is the spacer)
    const heroSection = clean.slice(clean.lastIndexOf('<section', h1), clean.indexOf('</section>', h1));
    expect(heroSection).toContain('pb-0');
    // The form wrapper must not contribute a large top padding
    expect(clean).not.toContain('pt-12');
    expect(clean).not.toContain('pt-16');
  });
});
