import { writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadCatalogSeed, type CatalogSeed } from './catalog-seed.loader';

describe('CatalogSeedLoader', () => {
  let dir: string;

  const writeSeed = (name: string, content: unknown) => {
    const filePath = join(dir, name);
    writeFileSync(filePath, typeof content === 'string' ? content : JSON.stringify(content), 'utf-8');
    return filePath;
  };

  const validSeed = () => ({
    _readme: 'test',
    categorias: {
      'medicion-de-fluidos': { nombre: 'Medición de Fluidos', slug: 'medicion-de-fluidos', esDefault: false },
      'sin-categoria': { nombre: 'Sin categoría', slug: 'sin-categoria', esDefault: true },
    },
    subcategorias: {
      'medicion-de-fluidos--medidores-electromagneticos': {
        categoriaId: 'medicion-de-fluidos',
        nombre: 'Medidores Electromagnéticos',
        slug: 'medidores-electromagneticos',
      },
    },
  });

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'riff-seed-'));
  });

  it('resolves category id === slug and subcategoria id === `${categoriaId}--${slug}`', () => {
    const seed = loadCatalogSeed(writeSeed('seed.json', validSeed())) as CatalogSeed;
    expect(seed.categorias[0].id).toBe('medicion-de-fluidos');
    expect(seed.categorias[0].slug).toBe('medicion-de-fluidos');
    expect(seed.subcategorias[0].id).toBe('medicion-de-fluidos--medidores-electromagneticos');
    expect(seed.subcategorias[0].categoriaId).toBe('medicion-de-fluidos');
    expect(seed.subcategorias[0].slug).toBe('medidores-electromagneticos');
  });

  it('keeps esDefault true for sin-categoria and false by default', () => {
    const seed = loadCatalogSeed(writeSeed('seed.json', validSeed())) as CatalogSeed;
    const sinCat = seed.categorias.find((c) => c.id === 'sin-categoria');
    expect(sinCat?.esDefault).toBe(true);
    const flujos = seed.categorias.find((c) => c.id === 'medicion-de-fluidos');
    expect(flujos?.esDefault).toBe(false);
  });

  it('derives slug from nombre when slug is absent', () => {
    const seedData = {
      categorias: {
        flujos: { nombre: 'Medición de Fluidos' },
      },
      subcategorias: {
        'medicion-de-fluidos--medidores-electromagneticos': {
          categoriaId: 'medicion-de-fluidos',
          nombre: 'Medidores Electromagnéticos',
        },
      },
    };
    const seed = loadCatalogSeed(writeSeed('seed.json', seedData)) as CatalogSeed;
    expect(seed.categorias[0].slug).toBe('medicion-de-fluidos');
    expect(seed.categorias[0].id).toBe('medicion-de-fluidos');
    expect(seed.subcategorias[0].slug).toBe('medidores-electromagneticos');
    expect(seed.subcategorias[0].id).toBe('medicion-de-fluidos--medidores-electromagneticos');
  });

  it('throws a clear error when the file is not valid JSON', () => {
    const filePath = writeSeed('bad.json', '{ not json');
    expect(() => loadCatalogSeed(filePath)).toThrow(/valid JSON/i);
  });

  it('throws a clear error when categorias is not an object', () => {
    const filePath = writeSeed('bad.json', { categorias: 'nope', subcategorias: {} });
    expect(() => loadCatalogSeed(filePath)).toThrow(/categorias/i);
  });

  it('throws a clear error when a category is missing nombre', () => {
    const filePath = writeSeed('bad.json', { categorias: { x: { slug: 'x' } }, subcategorias: {} });
    expect(() => loadCatalogSeed(filePath)).toThrow(/nombre/i);
  });

  it('throws a clear error when a subcategoria references a non-existent categoriaId', () => {
    const seedData = {
      categorias: { flujos: { nombre: 'Flujos' } },
      subcategorias: { 'flujos--y': { categoriaId: 'inexistente', nombre: 'Y' } },
    };
    const filePath = writeSeed('bad.json', seedData);
    expect(() => loadCatalogSeed(filePath)).toThrow(/does not match any category/i);
  });

  it('loads the real seed file from the repo root with 5 categories and 23 subcategorias', () => {
    // Resolves the default file (seed-categorias-subcategorias.json) by walking up from cwd.
    const seed = loadCatalogSeed() as CatalogSeed;
    expect(seed.categorias).toHaveLength(5);
    expect(seed.subcategorias).toHaveLength(23);
    const sinCat = seed.categorias.find((c) => c.id === 'sin-categoria');
    expect(sinCat?.esDefault).toBe(true);
    expect(
      seed.subcategorias.some(
        (s) => s.id === 'medicion-de-fluidos--medidores-electromagneticos' && s.categoriaId === 'medicion-de-fluidos',
      ),
    ).toBe(true);
  });
});
