import { describe, it, expect } from 'vitest';
import { REPRESENTACIONES_PAGE_CONTENT } from '@/lib/config/representaciones-page';

/**
 * Shape/content contract for the `/representaciones` page config
 * (design.md § D3). Mirrors the pattern of `services-page.test.ts`: the page
 * module is a dumb composition of typed content.
 */
describe('REPRESENTACIONES_PAGE_CONTENT', () => {
  const content = REPRESENTACIONES_PAGE_CONTENT;

  it('declares the SEO title and description', () => {
    expect(content.title).toContain('Representaciones');
    expect(content.title).toContain('Riff');
    expect(content.description.length).toBeGreaterThan(0);
  });

  it('hero exposes eyebrow, highlighted headline, intro and exactly 3 metrics', () => {
    expect(content.hero.eyebrow).toBe('ALIANZAS GLOBALES DE ALTA PRECISIÓN');
    expect(content.hero.headline).toContain('Representación Exclusiva');
    expect(content.hero.highlightedWord).toBe('Representación Exclusiva');
    expect(content.hero.intro.length).toBeGreaterThan(0);
    expect(content.hero.metrics).toHaveLength(3);
    expect(content.hero.metrics.map((metric) => metric.value)).toEqual([
      '05',
      '02',
      '100%',
    ]);
    for (const metric of content.hero.metrics) {
      expect(metric.label.length).toBeGreaterThan(0);
      expect(metric.caption.length).toBeGreaterThan(0);
    }
  });

  it('brands section exposes eyebrow, headline and exactly 5 brands in order', () => {
    expect(content.brandsSection.eyebrow).toBe('CATÁLOGO OFICIAL DE FABRICANTES');
    expect(content.brandsSection.headline).toBe(
      'Marcas de Representación Exclusiva',
    );
    expect(content.brandsSection.brands.map((brand) => brand.title)).toEqual([
      'Apator Powogaz',
      'RIFF Flow Metering',
      'Nitto Seiko',
      'GL Sanitaria',
      'ILMAP',
    ]);
    for (const brand of content.brandsSection.brands) {
      expect(brand.wordmark.length).toBeGreaterThan(0);
      expect(brand.chip.length).toBeGreaterThan(0);
      expect(brand.category.length).toBeGreaterThan(0);
      expect(brand.description.length).toBeGreaterThan(0);
    }
  });

  it('distributors section exposes eyebrow, headline, intro and 2 distributors with 3 bullets + guarantee', () => {
    expect(content.distributorsSection.eyebrow).toBe(
      'CANAL DE DISTRIBUCIÓN CALIFICADO',
    );
    expect(content.distributorsSection.headline).toBe(
      'Somos Distribuidores Autorizados de:',
    );
    expect(content.distributorsSection.intro.length).toBeGreaterThan(0);
    expect(
      content.distributorsSection.distributors.map(
        (distributor) => distributor.wordmark,
      ),
    ).toEqual(['PIUSI', 'SENSUS']);
    for (const distributor of content.distributorsSection.distributors) {
      expect(distributor.badge.length).toBeGreaterThan(0);
      expect(distributor.icon).toMatch(/^lucide:/);
      expect(distributor.bullets).toHaveLength(3);
      expect(distributor.guarantee.length).toBeGreaterThan(0);
    }
  });

  it('value props section exposes eyebrow, headline, intro and exactly 4 pillars', () => {
    expect(content.valuePropsSection.eyebrow).toBe(
      'GARANTÍA CORPORATIVA RIFF SPA',
    );
    expect(content.valuePropsSection.headline).toBe(
      '¿Por qué adquirir a través del representante oficial en Chile?',
    );
    expect(content.valuePropsSection.intro.length).toBeGreaterThan(0);
    expect(content.valuePropsSection.valueProps).toHaveLength(4);
    expect(
      content.valuePropsSection.valueProps.map((pillar) => pillar.indexLabel),
    ).toEqual([
      '01 / Respaldo Técnico',
      '02 / Marco Normativo',
      '03 / Logística & Repuestos',
      '04 / Certificación',
    ]);
    for (const pillar of content.valuePropsSection.valueProps) {
      expect(pillar.icon).toMatch(/^lucide:/);
      expect(pillar.title.length).toBeGreaterThan(0);
      expect(pillar.description.length).toBeGreaterThan(0);
    }
  });
});
