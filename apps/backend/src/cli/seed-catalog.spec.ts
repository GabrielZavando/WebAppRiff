import { Test } from '@nestjs/testing';
import { SeedCatalogUseCase } from './seed/seed-catalog.use-case';
import { ICategoriaRepository, I_CATEGORIA_REPOSITORY } from '../categorias/domain/icategoria.repository';
import {
  ISubcategoriaRepository,
  I_SUBCATEGORIA_REPOSITORY,
} from '../subcategorias/domain/isubcategoria.repository';
import { loadCatalogSeed } from './seed/catalog-seed.loader';
import { writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Verifica el "cableado" del comando CLI de seed sin tocar Firebase:
 * `loadCatalogSeed` + `SeedCatalogUseCase` resueltos en un módulo de testing
 * con los repositorios mockeados.
 */
describe('seed:catalog CLI wiring', () => {
  const categoriaRepo = {
    findById: jest.fn(),
    create: jest.fn(),
  };
  const subcategoriaRepo = {
    findById: jest.fn(),
    create: jest.fn(),
  };

  it('loads the seed and creates the expected entities via the use case', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SeedCatalogUseCase,
        { provide: I_CATEGORIA_REPOSITORY, useValue: categoriaRepo },
        { provide: I_SUBCATEGORIA_REPOSITORY, useValue: subcategoriaRepo },
      ],
    }).compile();
    const useCase = moduleRef.get(SeedCatalogUseCase);

    const dir = mkdtempSync(join(tmpdir(), 'riff-seed-')); // eslint-disable-line
    const filePath = join(dir, 'seed.json');
    writeFileSync(
      filePath,
      JSON.stringify({
        categorias: { flujos: { nombre: 'Flujos' }, 'sin-categoria': { nombre: 'Sin categoría', esDefault: true } },
        subcategorias: {
          'flujos--y': { categoriaId: 'flujos', nombre: 'Y' },
        },
      }),
    );
    categoriaRepo.findById.mockResolvedValue(null);
    subcategoriaRepo.findById.mockResolvedValue(null);

    const seed = loadCatalogSeed(filePath);
    const result = await useCase.execute(seed);

    expect(result.categoriasCreadas).toBe(2);
    expect(result.subcategoriasCreadas).toBe(1);
    expect(categoriaRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'flujos', esDefault: false }),
    );
    expect(categoriaRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sin-categoria', esDefault: true }),
    );
    expect(subcategoriaRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'flujos--y', categoriaId: 'flujos' }),
    );
  });

  it('fails fast when the seed file is malformed', () => {
    const dir = mkdtempSync(join(tmpdir(), 'riff-seed-')); // eslint-disable-line
    const filePath = join(dir, 'bad.json');
    writeFileSync(filePath, '{ not valid json');
    expect(() => loadCatalogSeed(filePath)).toThrow(/valid JSON/i);
  });

  // Silencia la advertencia de variables no usadas cuando los mocks no se invocan.
  it('exposes the repository tokens used for DI', () => {
    expect(I_CATEGORIA_REPOSITORY).toBeDefined();
    expect(I_SUBCATEGORIA_REPOSITORY).toBeDefined();
  });
});
