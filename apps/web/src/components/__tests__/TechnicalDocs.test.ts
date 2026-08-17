import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import TechnicalDocs from '@/components/TechnicalDocs.astro';
import type { FichaTecnicaApi } from '@/lib/types/products-page';

const FICHA: FichaTecnicaApi = {
  url: 'https://cdn.example.com/catalogo.pdf',
  storagePath: 'productos/p1/catalogo.pdf',
  nombreArchivo: 'catalogo-tecnico.pdf',
};

async function render(fichaTecnica: FichaTecnicaApi | null) {
  const container = await AstroContainer.create();
  return container.renderToString(TechnicalDocs, { props: { fichaTecnica } });
}

describe('TechnicalDocs', () => {
  it('renders the "Documentación Técnica" heading', async () => {
    expect(await render(FICHA)).toContain('Documentación Técnica');
    expect(await render(null)).toContain('Documentación Técnica');
  });

  it('renders a download link with the filename when fichaTecnica is present', async () => {
    const html = await render(FICHA);
    expect(html).toContain('lucide:file-text');
    expect(html).toContain('lucide:download');
    expect(html).toContain('Catálogo Técnico');
    expect(html).toContain('catalogo-tecnico.pdf');
    expect(html).toContain('href="https://cdn.example.com/catalogo.pdf"');
  });

  it('renders the "Solicitar ficha técnica" CTA to /contacto when fichaTecnica is null', async () => {
    const html = await render(null);
    expect(html).toContain('Solicitar ficha técnica');
    expect(html).toContain('href="/contacto"');
    expect(html).not.toContain('Catálogo Técnico');
    expect(html).not.toContain('lucide:download');
    expect(html).not.toContain('catalogo-tecnico.pdf');
  });

  it('renders lucide icons and no obsolete sets (both states)', async () => {
    const withDoc = await render(FICHA);
    const without = await render(null);
    for (const html of [withDoc, without]) {
      expect(html).toContain('lucide:');
      expect(html).not.toContain('material-symbols');
    }
  });

  it('uses the primary-deep brand background token (per design)', async () => {
    expect(await render(FICHA)).toContain('bg-primary-deep');
    expect(await render(null)).toContain('bg-primary-deep');
  });

  it('does not emit raw hex literals', async () => {
    expect(await render(FICHA)).not.toMatch(/#[0-9A-Fa-f]{6}/);
    expect(await render(null)).not.toMatch(/#[0-9A-Fa-f]{6}/);
  });
});