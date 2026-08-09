import { describe, it, expect } from 'vitest';
import {
  SOLUTION_SECTION_CONTENT,
  SOLUTIONS_DATA,
} from '@/lib/config/solution-section';
import type { SolutionIconName } from '@/lib/types/solution-section';

describe('SOLUTION_SECTION_CONTENT', () => {
  it('solutions has length exactly 4 (task 1.3)', () => {
    expect(SOLUTION_SECTION_CONTENT.solutions).toHaveLength(4);
  });

  it('eyebrow === "PORTAFOLIO", headline === "Nuestras Soluciones", description is non-empty (task 1.4)', () => {
    expect(SOLUTION_SECTION_CONTENT.eyebrow).toBe('PORTAFOLIO');
    expect(SOLUTION_SECTION_CONTENT.headline).toBe('Nuestras Soluciones');
    expect(typeof SOLUTION_SECTION_CONTENT.description).toBe('string');
    expect(SOLUTION_SECTION_CONTENT.description.length).toBeGreaterThan(0);
  });

  it('titles in render order are exactly the 4 portfolio entries (task 1.5)', () => {
    const titles = SOLUTIONS_DATA.map((s) => s.title);
    expect(titles).toEqual([
      'Medición de Fluidos',
      'Tratamiento de Agua',
      'Productos Químicos',
      'Control y Accesorios',
    ]);
  });

  it('every solution href equals "/soluciones" (task 1.6)', () => {
    for (const solution of SOLUTIONS_DATA) {
      expect(solution.href).toBe('/soluciones');
    }
  });

  it('icons in render order are exactly gauge, droplet, flask-conical, settings-2 (task 1.7)', () => {
    const icons = SOLUTIONS_DATA.map((s) => s.icon);
    expect(icons).toEqual(['gauge', 'droplet', 'flask-conical', 'settings-2']);
    // Each icon belongs to the closed union type.
    const allowed: readonly SolutionIconName[] = [
      'gauge',
      'droplet',
      'flask-conical',
      'settings-2',
    ];
    for (const icon of icons) {
      expect(allowed).toContain(icon);
    }
  });

  it('every imageAlt is non-empty and different from the title (task 1.8)', () => {
    for (const solution of SOLUTIONS_DATA) {
      expect(typeof solution.imageAlt).toBe('string');
      expect(solution.imageAlt.length).toBeGreaterThan(0);
      expect(solution.imageAlt).not.toBe(solution.title);
    }
  });

  it('every image is an ImageMetadata-like object with src property (task 1.9)', () => {
    for (const solution of SOLUTIONS_DATA) {
      expect(typeof solution.image).toBe('object');
      expect(solution.image).not.toBeNull();
      expect(typeof (solution.image as { src?: unknown }).src).toBe('string');
      expect((solution.image as { src: string }).src.length).toBeGreaterThan(0);
    }
  });

  it('every slug matches /^[a-z0-9-]+$/ kebab-case (task 1.10)', () => {
    const regex = /^[a-z0-9-]+$/;
    for (const solution of SOLUTIONS_DATA) {
      expect(solution.slug).toMatch(regex);
    }
  });

  it('each card consumes the real-catalog photo matching its slug by filename (post-apply task 3.4)', () => {
    // POST-APPLY UPDATE: the client delivered real photos on 2026-08-09 named
    // after each card. Asserting the filename not only documents the mapping
    // but also guards against accidentally swapping an image into the wrong card
    // and against regressing back to the generated placeholders (solucion-*.webp).
    const expectedBySlug: Record<string, string> = {
      'medicion-de-fluidos': 'medicion-fluidos.webp',
      'tratamiento-de-agua': 'tratamiento-agua.webp',
      'productos-quimicos': 'productos-quimicos.webp',
      'control-y-accesorios': 'control-accesorios.webp',
    };
    for (const solution of SOLUTIONS_DATA) {
      const expectedFilename = expectedBySlug[solution.slug];
      expect(expectedFilename).toBeDefined();
      const src = solution.image.src;
      expect(typeof src).toBe('string');
      expect(src).toContain(expectedFilename);
      // The generated placeholders used to be 800x600; the real photos are
      // 1920x1080 — assert the native metadata so a regression is caught.
      expect(solution.image.format).toBe('webp');
      expect(solution.image.width).toBe(1920);
      expect(solution.image.height).toBe(1080);
    }
  });
});