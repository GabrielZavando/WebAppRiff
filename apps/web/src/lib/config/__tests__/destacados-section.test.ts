import { describe, it, expect } from 'vitest';
import {
  DESTACADOS_SECTION_CONTENT,
  FEATURED_PRODUCTS,
} from '@/lib/config/destacados-section';

describe('DESTACADOS_SECTION_CONTENT', () => {
  it('products has length exactly 4', () => {
    expect(DESTACADOS_SECTION_CONTENT.products).toHaveLength(4);
  });

  it('headline === "Soluciones Destacadas", ctaText === "EXPLORAR CATÁLOGO COMPLETO", ctaHref === "/productos"', () => {
    expect(DESTACADOS_SECTION_CONTENT.headline).toBe('Soluciones Destacadas');
    expect(DESTACADOS_SECTION_CONTENT.ctaText).toBe(
      'EXPLORAR CATÁLOGO COMPLETO',
    );
    expect(DESTACADOS_SECTION_CONTENT.ctaHref).toBe('/productos');
  });

  it('titles in render order are exactly the 4 featured products (client-specified)', () => {
    const titles = FEATURED_PRODUCTS.map((p) => p.titulo);
    expect(titles).toEqual([
      'Antiincrustante Bimaks 420 para Ósmosis Inversa (Agua Salobre)',
      'Flujómetro Universal',
      'Medidor Ultrasónico Doppler Portátil Fullsonic (No Invasivo)',
      'MWN – MEDIDOR INDUSTRIAL PARA AGUA FRÍA LIMPIA – MEDIDOR TIPO WOLTMAN',
    ]);
  });

  it('every imageAlt is non-empty and different from the title', () => {
    for (const product of FEATURED_PRODUCTS) {
      expect(typeof product.imagenAlt).toBe('string');
      expect(product.imagenAlt.length).toBeGreaterThan(0);
      expect(product.imagenAlt).not.toBe(product.titulo);
    }
  });

  it('every image is an ImageMetadata-like object with src property', () => {
    for (const product of FEATURED_PRODUCTS) {
      expect(typeof product.imagen).toBe('object');
      expect(product.imagen).not.toBeNull();
      expect(typeof (product.imagen as { src?: unknown }).src).toBe('string');
      expect((product.imagen as { src: string }).src.length).toBeGreaterThan(0);
    }
  });

  it('every slug matches /^[a-z0-9-]+$/ kebab-case', () => {
    const regex = /^[a-z0-9-]+$/;
    for (const product of FEATURED_PRODUCTS) {
      expect(product.slug).toMatch(regex);
    }
  });

  it('every product carries an id equal to its slug (stable technical identifier)', () => {
    for (const product of FEATURED_PRODUCTS) {
      expect(product.id).toBe(product.slug);
    }
  });

  it('each card consumes the client-delivered asset matching its slug by filename', () => {
    // Guards against swapping an image into the wrong card and against
    // regressing to placeholders. Files delivered by the client on 2026-08-09:
    // antiincrustante-Bimaks.png (400x400), the three .webp expose 300x300
    // via astro:assets (sharp reads 300x300 even though the raw VP8X header
    // says 299x299 — the metadata assertions below use the sharp-reported
    // values, which is what ImageMetadata actually carries).
    const expectedBySlug: Record<string, { filename: string; format: string; width: number; height: number }> = {
      'antiincrustante-bimaks-420': {
        filename: 'antiincrustante-Bimaks.png',
        format: 'png',
        width: 400,
        height: 400,
      },
      'flujometro-universal': {
        filename: 'flujometro-multiproposito.webp',
        format: 'webp',
        width: 300,
        height: 300,
      },
      'medidor-ultrasonico-doppler-fullsonic': {
        filename: 'FULLSONIC-DOPPLER-CONTABLE.webp',
        format: 'webp',
        width: 300,
        height: 300,
      },
      'mwn-medidor-woltman-agua-fria': {
        filename: 'MWN-DN50.webp',
        format: 'webp',
        width: 300,
        height: 300,
      },
    };
    for (const product of FEATURED_PRODUCTS) {
      const expected = expectedBySlug[product.slug];
      if (!expected) {
        throw new Error(
          `no expected image mapping for slug "${product.slug}" — image swapped or asset renamed`,
        );
      }
      const src = product.imagen.src;
      expect(typeof src).toBe('string');
      expect(src).toContain(expected.filename);
      expect(product.imagen.format).toBe(expected.format);
      expect(product.imagen.width).toBe(expected.width);
      expect(product.imagen.height).toBe(expected.height);
    }
  });

  it('no product exposes a price field (design.md Decision 3)', () => {
    for (const product of FEATURED_PRODUCTS) {
      expect(product).not.toHaveProperty('precio');
      expect(product).not.toHaveProperty('precioVisible');
      expect(product).not.toHaveProperty('price');
    }
  });
});