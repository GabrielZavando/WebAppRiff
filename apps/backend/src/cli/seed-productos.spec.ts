import { Test } from '@nestjs/testing';
import { SeedProductosUseCase } from './seed/seed-productos.use-case';
import { EnsureSeedSubcategorias, MEDIDORES_DE_NIVEL_ID } from './seed/ensure-seed-subcategorias';
import { ProductoConsistencyService } from '../productos/application/producto-consistency.service';
import {
  IProductIntegrityRepository,
  IProductRepository,
  I_PRODUCT_INTEGRITY_REPOSITORY,
  I_PRODUCT_REPOSITORY,
} from '../productos/domain/iproducto.repository';
import {
  ISubcategoriaRepository,
  ISubcategoriaIntegrityRepository,
  I_SUBCATEGORIA_REPOSITORY,
  I_SUBCATEGORIA_INTEGRITY_REPOSITORY,
} from '../subcategorias/domain/isubcategoria.repository';
import {
  ICategoriaRepository,
  I_CATEGORIA_REPOSITORY,
} from '../categorias/domain/icategoria.repository';
import { loadProductoSeed } from './seed/producto-seed.loader';
import { writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Verifica el "cableado" del comando CLI de seed de productos sin tocar
 * Firebase: `loadProductoSeed` + `EnsureSeedSubcategorias` + `SeedProductosUseCase`
 * resueltos en un módulo de testing con los repositorios mockeados.
 */
describe('seed:productos CLI wiring', () => {
  const productoRepo = {
    findById: jest.fn(),
    create: jest.fn(),
  };
  const integrity = {
    existsBySku: jest.fn(),
    existsBySlug: jest.fn(),
  };
  const consistency = {
    assertConsistency: jest.fn(),
  };
  const subcategoriaRepo = {
    findById: jest.fn(),
    create: jest.fn(),
  };
  const categoriaRepo = {
    findById: jest.fn(),
  };
  const subcategoriaIntegrity = {
    belongsToCategoria: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    productoRepo.findById.mockResolvedValue(null);
    integrity.existsBySku.mockResolvedValue(false);
    integrity.existsBySlug.mockResolvedValue(false);
    consistency.assertConsistency.mockResolvedValue('cat-1');
    subcategoriaRepo.findById.mockResolvedValue(null);
    categoriaRepo.findById.mockResolvedValue({ id: 'cat-1' });
    subcategoriaIntegrity.belongsToCategoria.mockResolvedValue(true);
  });

  it('loads the seed and creates the expected entities via the use cases', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SeedProductosUseCase,
        EnsureSeedSubcategorias,
        ProductoConsistencyService,
        { provide: I_PRODUCT_REPOSITORY, useValue: productoRepo },
        { provide: I_PRODUCT_INTEGRITY_REPOSITORY, useValue: integrity },
        { provide: I_SUBCATEGORIA_REPOSITORY, useValue: subcategoriaRepo },
        { provide: I_CATEGORIA_REPOSITORY, useValue: categoriaRepo },
        { provide: I_SUBCATEGORIA_INTEGRITY_REPOSITORY, useValue: subcategoriaIntegrity },
      ],
    }).compile();

    const dir = mkdtempSync(join(tmpdir(), 'riff-seed-')); // eslint-disable-line
    const filePath = join(dir, 'seed.json');
    writeFileSync(
      filePath,
      JSON.stringify({
        productos: {
          'prod-001': {
            sku: 'SKU-1',
            titulo: 'Válvula',
            slug: 'valvula',
            precio: { valor: 100, visible: true },
            categoriaId: 'cat-1',
          },
        },
      }),
    );

    const seed = loadProductoSeed(filePath);
    const ensure = moduleRef.get(EnsureSeedSubcategorias);
    await ensure.ensureMedidoresDeNivel();
    const useCase = moduleRef.get(SeedProductosUseCase);
    const result = await useCase.execute(seed);

    expect(result.productosCreados).toBe(1);
    expect(productoRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'prod-001', sku: 'SKU-1' }),
    );
    expect(subcategoriaRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: MEDIDORES_DE_NIVEL_ID }),
    );
  });

  it('fails fast when the seed file is malformed', () => {
    const dir = mkdtempSync(join(tmpdir(), 'riff-seed-')); // eslint-disable-line
    const filePath = join(dir, 'bad.json');
    writeFileSync(filePath, '{ not valid json');
    expect(() => loadProductoSeed(filePath)).toThrow(/valid JSON/i);
  });
});
