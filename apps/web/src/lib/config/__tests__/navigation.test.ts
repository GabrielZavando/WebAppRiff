import { describe, it, expect, afterEach } from 'vitest';
import { NAVIGATION_ITEMS, isActive, getCtaConfig } from '@/lib/config/navigation';

const ENV_KEYS = ['CTA_LABEL', 'CTA_HREF'] as const;

function clearEnv(): void {
  for (const key of ENV_KEYS) {
    delete import.meta.env[key];
  }
}

afterEach(() => {
  clearEnv();
});

describe('NAVIGATION_ITEMS', () => {
  it('contains the 5 menu items in the declared order', () => {
    expect(NAVIGATION_ITEMS.map(item => item.label)).toEqual([
      'Inicio',
      'Productos',
      'Servicios',
      'Marcas',
      'Contacto',
    ]);
  });

  it('declares the expected hrefs', () => {
    expect(NAVIGATION_ITEMS.map(item => item.href)).toEqual([
      '/',
      '/productos',
      '/servicios',
      '/marcas',
      '/contacto',
    ]);
  });
});

describe('isActive', () => {
  it('marks "/" as active at the root path', () => {
    expect(isActive('/', '/')).toBe(true);
  });

  it('does not mark "/" active on other paths', () => {
    expect(isActive('/', '/nosotros')).toBe(false);
  });

  it('marks a section active on exact match', () => {
    expect(isActive('/productos', '/productos')).toBe(true);
  });

  it('marks a section active on nested child paths', () => {
    expect(isActive('/productos', '/productos/categoria')).toBe(true);
  });

  it('does not match a partial prefix', () => {
    expect(isActive('/productos', '/producto')).toBe(false);
  });
});

describe('getCtaConfig', () => {
  it('returns defaults when env vars are missing', () => {
    clearEnv();

    expect(getCtaConfig()).toEqual({
      label: 'SOLICITAR COTIZACIÓN',
      href: '/cotizacion',
    });
  });

  it('returns env var values when set', () => {
    import.meta.env.CTA_LABEL = 'Cotiza aquí';
    import.meta.env.CTA_HREF = '/cotizacion?promo=1';

    expect(getCtaConfig()).toEqual({
      label: 'Cotiza aquí',
      href: '/cotizacion?promo=1',
    });
  });
});
