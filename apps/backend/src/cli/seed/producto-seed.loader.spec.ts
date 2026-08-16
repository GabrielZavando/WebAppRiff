import { loadProductoSeed } from './producto-seed.loader';
import { existsSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('loadProductoSeed', () => {
  const writeSeed = (obj: unknown): string => {
    const dir = mkdtempSync(join(tmpdir(), 'riff-prod-seed-')); // eslint-disable-line
    const filePath = join(dir, 'seed.json');
    writeFileSync(filePath, JSON.stringify(obj));
    return filePath;
  };

  it('resolves id from the dict key and keeps the explicit slug', () => {
    const filePath = writeSeed({
      productos: {
        'prod-001': {
          sku: 'SKU-1',
          titulo: 'Válvula de Control',
          slug: 'valvula-de-control',
          precio: { valor: 100, visible: true },
          categoriaId: 'cat-1',
        },
      },
    });
    const seed = loadProductoSeed(filePath);
    expect(seed.productos).toHaveLength(1);
    expect(seed.productos[0].id).toBe('prod-001');
    expect(seed.productos[0].slug).toBe('valvula-de-control');
  });

  it('derives slug from titulo when not provided', () => {
    const filePath = writeSeed({
      productos: {
        'prod-002': { sku: 'SKU-2', titulo: 'Conexión Rápida 10mm', precio: { valor: 0, visible: false } },
      },
    });
    const seed = loadProductoSeed(filePath);
    expect(seed.productos[0].slug).toBe('conexion-rapida-10mm');
  });

  it('does not persist precio.moneda', () => {
    const filePath = writeSeed({
      productos: {
        'prod-003': {
          sku: 'SKU-3',
          titulo: 'Tubo',
          precio: { valor: 10, visible: true, moneda: 'CLP' },
        },
      },
    });
    const seed = loadProductoSeed(filePath);
    expect(seed.productos[0]).not.toHaveProperty('moneda');
    expect(
      (seed.productos[0].precio as unknown as Record<string, unknown>),
    ).not.toHaveProperty('moneda');
  });

  it('defaults categoriaId to sin-categoria and galeria to empty', () => {
    const filePath = writeSeed({
      productos: {
        'prod-004': { sku: 'SKU-4', titulo: 'X', precio: { valor: 1, visible: false } },
      },
    });
    const seed = loadProductoSeed(filePath);
    expect(seed.productos[0].categoriaId).toBe('sin-categoria');
    expect(seed.productos[0].galeria).toEqual([]);
  });

  it('throws a clear error on malformed JSON', () => {
    const filePath = writeSeed({ productos: 'not-an-object' });
    expect(() => loadProductoSeed(filePath)).toThrow(/productos/);
  });

  it('throws when a required field is missing or invalid', () => {
    const filePath = writeSeed({
      productos: { 'prod-005': { titulo: 'Sin SKU', precio: { valor: 1, visible: true } } },
    });
    expect(() => loadProductoSeed(filePath)).toThrow(/sku/i);

    const filePath2 = writeSeed({
      productos: { 'prod-006': { sku: 'SKU-6', titulo: 'Sin precio' } },
    });
    expect(() => loadProductoSeed(filePath2)).toThrow(/precio/i);
  });

  it('excludes the known duplicate prod-054 and de-duplicates prod-069 slug', () => {
    const filePath = writeSeed({
      productos: {
        'prod-054': {
          sku: 'SKU-PEND-054',
          titulo: 'Sistema AMR de Lectura Remota',
          slug: 'sistema-amr-de-lectura-remota',
          precio: { valor: 1, visible: false },
          publicado: false,
        },
        'prod-068': {
          sku: 'FLO-CLT-FLA',
          titulo: 'Medidor Cuenta Litros Flowtech',
          slug: 'medidor-cuenta-litros-flowtech',
          precio: { valor: 1, visible: true },
        },
        'prod-069': {
          sku: 'FLO-CLT-HIL',
          titulo: 'Medidor Cuenta Litros Flowtech',
          slug: 'medidor-cuenta-litros-flowtech',
          precio: { valor: 1, visible: true },
        },
      },
    });
    const seed = loadProductoSeed(filePath);
    const ids = seed.productos.map((p) => p.id);
    expect(ids).toContain('prod-068');
    expect(ids).toContain('prod-069');
    expect(ids).not.toContain('prod-054');
    const p069 = seed.productos.find((p) => p.id === 'prod-069');
    expect(p069?.slug).toBe('medidor-cuenta-litros-flowtech-hil');
  });

  it('loads the real seed-productos-71.json yielding exactly 70 products (prod-054 excluded, prod-069 slug de-duplicated)', () => {
    const repoRootSeed = join(process.cwd(), '..', '..', 'seed-productos-71.json');
    if (!existsSync(repoRootSeed)) {
      throw new Error(`Seed file not found at ${repoRootSeed}`);
    }
    const seed = loadProductoSeed(repoRootSeed);
    expect(seed.productos).toHaveLength(70);
    const ids = seed.productos.map((p) => p.id);
    expect(ids).not.toContain('prod-054');
    expect(ids).toContain('prod-069');
    const p069 = seed.productos.find((p) => p.id === 'prod-069');
    expect(p069?.slug).toBe('medidor-cuenta-litros-flowtech-hil');
  });
});
