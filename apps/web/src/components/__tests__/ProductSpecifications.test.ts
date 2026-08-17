import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ProductSpecifications from '@/components/ProductSpecifications.astro';
import type { AtributoApi } from '@/lib/types/products-page';

function makeAtributos(n: number): AtributoApi[] {
  return Array.from({ length: n }, (_, i) => ({
    nombre: `Campo ${i}`,
    valor: `Valor ${i}`,
  }));
}

async function render(atributos: AtributoApi[]) {
  const container = await AstroContainer.create();
  return container.renderToString(ProductSpecifications, { props: { atributos } });
}

describe('ProductSpecifications', () => {
  it('renders the "ESPECIFICACIONES CLAVE" heading', async () => {
    const html = await render(makeAtributos(2));
    expect(html).toContain('ESPECIFICACIONES CLAVE');
  });

  it('renders each attribute as "nombre: valor"', async () => {
    const html = await render([
      { nombre: 'Precisión', valor: '±2% de la lectura' },
      { nombre: 'Rango', valor: '0.1 a 9 m/s' },
    ]);
    expect(html).toContain('Precisión');
    expect(html).toContain('±2% de la lectura');
    expect(html).toContain('Rango');
    expect(html).toContain('0.1 a 9 m/s');
  });

  it('renders a lucide icon per attribute (no obsolete sets)', async () => {
    const html = await render(makeAtributos(2));
    expect(html).toContain('lucide:');
    expect(html).not.toContain('material-symbols:');
    expect(html).not.toContain('logos:');
  });

  it('is hidden (renders nothing) when atributos is empty', async () => {
    const html = await render([]);
    expect(html).not.toContain('ESPECIFICACIONES CLAVE');
    expect(html).not.toContain('Campo 0');
  });

  it('uses flat-design tokens and no rounded* utility', async () => {
    const html = await render(makeAtributos(2));
    expect(html).toContain('border-border');
    expect(html).not.toMatch(/rounded(?:-(?:sm|md|lg|xl|2xl|3xl|full|none|t|b|l|r|tl|tr|bl|br))?/);
  });

  it('does not emit raw hex literals', async () => {
    const html = await render(makeAtributos(2));
    expect(html).not.toMatch(/#[0-9A-Fa-f]{6}/);
  });
});
