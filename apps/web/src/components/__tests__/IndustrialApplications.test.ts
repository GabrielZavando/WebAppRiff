import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import IndustrialApplications from '@/components/IndustrialApplications.astro';

const industrialApplications = [
  {
    title: 'Minería',
    description: 'Medición de pulpas, lodos y relaves mineros altamente abrasivos sin desgaste del sensor.',
    icon: 'factory',
  },
  {
    title: 'Tratamiento de Aguas',
    description: 'Control de lodos activados, aguas residuales crudas y efluentes industriales complejos.',
    icon: 'water_ec',
  },
  {
    title: 'Química y Celulosa',
    description: 'Monitoreo de pastas, suspensiones químicas y líquidos corrosivos en tuberías cerradas.',
    icon: 'science',
  },
];

async function render() {
  const container = await AstroContainer.create();
  return container.renderToString(IndustrialApplications);
}

describe('IndustrialApplications', () => {
  it('renders the "Aplicaciones Industriales" heading', async () => {
    const html = await render();
    expect(html).toContain('Aplicaciones Industriales');
  });

  it('renders 3 industrial application cards', async () => {
    const html = await render();
    expect(html).toContain('Minería');
    expect(html).toContain('Tratamiento de Aguas');
    expect(html).toContain('Química y Celulosa');
  });

  it('renders lucide icons via astro-icon (no obsolete sets)', async () => {
    const html = await render();
    expect(html).toContain('lucide:');
    expect(html).not.toContain('material-symbols');
  });

  it('renders correct background and border tokens', async () => {
    const html = await render();
    expect(html).toContain('bg-bg');
    expect(html).toContain('border-border');
  });

  it('renders correct title and paragraph styles', async () => {
    const html = await render();
    expect(html).toContain('text-3xl');
    expect(html).toContain('text-text');
    expect(html).toContain('text-base');
    expect(html).toContain('text-text-2');
  });
});