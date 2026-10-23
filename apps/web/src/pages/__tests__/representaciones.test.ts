import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import RepresentacionesPage from '@/pages/representaciones.astro';

async function render(): Promise<string> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(RepresentacionesPage, {});
  // Strip comments and <style>/<script> so class/attribute counts are not
  // polluted by documentation or scoped-style blocks.
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '');
}

describe('Representaciones page composition', () => {
  it('renders inside the existing Layout chrome (one header, a footer and the WhatsApp float)', async () => {
    const html = await render();
    const headerCount = (html.match(/<header[\s>]/g) ?? []).length;
    expect(headerCount).toBe(1);
    expect(html).toContain('<footer');
    expect(html).toContain('href="https://wa.me/56937526162"');
  });

  it('omits the catalog search (showSearch={false})', async () => {
    const html = await render();
    expect(html).not.toContain('role="search"');
  });

  it('does not use the hero image shell (no banner_home / tratamiento-agua)', async () => {
    const html = await render();
    expect(html).not.toContain('banner_home');
    expect(html).not.toContain('tratamiento-agua');
  });

  it('renders the four sections with 5 brands, 2 distributors and 4 pillars', async () => {
    const html = await render();
    expect((html.match(/data-brand-card/g) ?? []).length).toBe(5);
    expect((html.match(/data-distributor-card/g) ?? []).length).toBe(2);
    expect((html.match(/data-value-prop/g) ?? []).length).toBe(4);
    // Section headlines.
    expect(html).toContain('Marcas de Representación Exclusiva');
    expect(html).toContain('Somos Distribuidores Autorizados de:');
    expect(html).toContain(
      '¿Por qué adquirir a través del representante oficial en Chile?',
    );
  });

  it('renders the seven real brand logos and the Lucide icons mapped from the mockup', async () => {
    const html = await render();
    for (const alt of [
      'Apator Powogaz',
      'RIFF Flow Metering',
      'Nitto Seiko',
      'GL Sanitaria',
      'ILMAP',
      'PIUSI',
      'SENSUS',
    ]) {
      expect(html).toMatch(new RegExp(`<img[^>]*alt="${alt}"`));
    }
    for (const icon of [
      'lucide:fuel',
      'lucide:radio-tower',
      'lucide:wrench',
      'lucide:clipboard-check',
      'lucide:package',
      'lucide:shield-check',
    ]) {
      expect(html).toContain(`data-icon="${icon}"`);
    }
  });

  it('uses the canonical container so the content aligns with the Header', async () => {
    const html = await render();
    expect(html).not.toContain('max-w-[1280px]');
    expect(html).toContain('container relative');
    expect(html).toContain('container flex flex-col gap-12');
    expect(html).toContain('container flex flex-col gap-10');
    expect((html.match(/class="[^"]*\bcontainer\b/g) ?? []).length).toBeGreaterThanOrEqual(5);
  });

  it('uses bg-surface-muted for page-level sections', async () => {
    const html = await render();
    const mutedSections =
      html.match(/<section[^>]*class="[^"]*bg-surface-muted[^"]*"/g) ?? [];
    expect(mutedSections).toHaveLength(2);
    expect(html).not.toMatch(/<section[^>]*class="[^"]*bg-bg/);
  });

  it('uses only Riff design tokens (no brand-* classes, no hex in classes)', async () => {
    const html = await render();
    expect(html).not.toMatch(/\b(bg|text|from|to|via|border)-brand-/);
    expect(html).not.toMatch(/class="[^"]*#[0-9a-fA-F]{3}/);
  });
});
