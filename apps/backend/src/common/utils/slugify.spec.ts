import { slugify } from '@/common/utils/slugify';

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Válvula de Control')).toBe('valvula-de-control');
  });

  it('removes accents', () => {
    expect(slugify('Conexión Rápida 10mm')).toBe('conexion-rapida-10mm');
  });

  it('collapses a run of non-alphanumeric characters into a single hyphen', () => {
    expect(slugify('Producto (Edición Especial)')).toBe('producto-edicion-especial');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  --Tubo  -- ')).toBe('tubo');
  });

  it('keeps numbers and lowercase letters', () => {
    expect(slugify('Tubo PVC 110')).toBe('tubo-pvc-110');
  });
});
