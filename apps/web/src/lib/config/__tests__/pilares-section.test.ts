import { describe, it, expect } from 'vitest';
import {
  PILARES_SECTION_CONTENT,
  PILARES,
} from '@/lib/config/pilares-section';

describe('PILARES_SECTION_CONTENT', () => {
  it('pillars has length exactly 4', () => {
    expect(PILARES_SECTION_CONTENT.pillars).toHaveLength(4);
  });

  it('left column copy: eyebrow, headline, description and CTA (client-specified)', () => {
    expect(PILARES_SECTION_CONTENT.eyebrow).toBe('Sostenibilidad y Eficiencia');
    expect(PILARES_SECTION_CONTENT.headline).toBe(
      'Comprometidos con la Optimización de Recursos',
    );
    expect(PILARES_SECTION_CONTENT.description.length).toBeGreaterThan(0);
    expect(PILARES_SECTION_CONTENT.cta.label).toBe('HABLEMOS DE TU PROYECTO');
    expect(PILARES_SECTION_CONTENT.cta.href).toBe('/contacto');
  });

  it('right column copy: rightEyebrow, rightHeadline and rightDescription (client-specified)', () => {
    expect(PILARES_SECTION_CONTENT.rightEyebrow).toBe('Estándares de Calidad');
    expect(PILARES_SECTION_CONTENT.rightHeadline).toBe(
      'Nuestros Pilares de Excelencia',
    );
    expect(PILARES_SECTION_CONTENT.rightDescription.length).toBeGreaterThan(0);
  });

  it('pillar labels in render order are exactly the 4 pillars (client-specified)', () => {
    const labels = PILARES.map((p) => p.label);
    expect(labels).toEqual([
      'Sostenibilidad',
      'Proyectos a tiempo',
      'Tecnología de Vanguardia',
      'Soporte Técnico Especializado',
    ]);
  });

  it('pillar icons in render order are recycle, clock, monitor, headphones', () => {
    const icons = PILARES.map((p) => p.icon);
    expect(icons).toEqual(['recycle', 'clock', 'monitor', 'headphones']);
  });

  it('every pillar exposes a non-empty label and a PilarIconName member icon', () => {
    const validIcons = ['recycle', 'clock', 'monitor', 'headphones'];
    for (const pillar of PILARES) {
      expect(typeof pillar.label).toBe('string');
      expect(pillar.label.length).toBeGreaterThan(0);
      expect(validIcons).toContain(pillar.icon);
    }
  });

  it('left background image imports the client-delivered asset (right column has NO image — POST-APPLY FIX #2)', () => {
    // File delivered by the client on 2026-08-09. The exact dimensions are
    // reported by sharp via astro:assets (ImageMetadata). POST-APPLY FIX #2:
    // `planta-tratamiento-ecologica.webp` is no longer referenced — the right
    // column is a solid `bg-primary-deep` background (client feedback).
    const left = PILARES_SECTION_CONTENT.leftImage;

    expect(typeof left.src).toBe('string');
    expect(left.src).toContain('sostenibilidad-edificios.jpg');
    expect(left.format).toBe('jpg');
    expect(left.width).toBe(1600);
    expect(left.height).toBe(1067);

    expect(PILARES_SECTION_CONTENT).not.toHaveProperty('rightImage');
    expect(PILARES_SECTION_CONTENT).not.toHaveProperty('rightImageAlt');
  });

  it('leftImageAlt is non-empty and different from the left headline', () => {
    expect(typeof PILARES_SECTION_CONTENT.leftImageAlt).toBe('string');
    expect(PILARES_SECTION_CONTENT.leftImageAlt.length).toBeGreaterThan(0);
    expect(PILARES_SECTION_CONTENT.leftImageAlt).not.toBe(
      PILARES_SECTION_CONTENT.headline,
    );
  });

  it('no field exposes a price property (the section has no prices)', () => {
    expect(PILARES_SECTION_CONTENT).not.toHaveProperty('precio');
    expect(PILARES_SECTION_CONTENT).not.toHaveProperty('price');
    expect(PILARES).not.toHaveProperty('precio');
  });
});