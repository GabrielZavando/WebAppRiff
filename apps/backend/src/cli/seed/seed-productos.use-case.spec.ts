import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { SeedProductosUseCase } from './seed-productos.use-case';
import {
  IProductIntegrityRepository,
  IProductRepository,
  I_PRODUCT_INTEGRITY_REPOSITORY,
  I_PRODUCT_REPOSITORY,
} from '@/productos/domain/iproducto.repository';
import { ProductoConsistencyService } from '@/productos/application/producto-consistency.service';
import { ProductoSeed } from './producto-seed.loader';

describe('SeedProductosUseCase', () => {
  const repository = {
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

  const seed: ProductoSeed = {
    productos: [
      {
        id: 'prod-001',
        sku: 'SKU-1',
        titulo: 'Válvula',
        slug: 'valvula',
        categoriaId: 'cat-1',
        subcategoriaId: null,
        idExterno: null,
        descripcionBreve: '',
        descripcionLarga: '',
        atributos: [],
        precio: { valor: 100, visible: true },
        stock: { disponible: true, cantidad: null },
        galeria: [],
        fichaTecnica: null,
        destacado: false,
        publicado: true,
      },
      {
        id: 'prod-002',
        sku: 'SKU-2',
        titulo: 'Tubo',
        slug: 'tubo',
        categoriaId: 'cat-1',
        subcategoriaId: null,
        idExterno: null,
        descripcionBreve: '',
        descripcionLarga: '',
        atributos: [],
        precio: { valor: 10, visible: false },
        stock: { disponible: true, cantidad: null },
        galeria: [],
        fichaTecnica: null,
        destacado: false,
        publicado: false,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findById.mockResolvedValue(null);
    integrity.existsBySku.mockResolvedValue(false);
    integrity.existsBySlug.mockResolvedValue(false);
    consistency.assertConsistency.mockResolvedValue('cat-1');
  });

  const compile = async () =>
    Test.createTestingModule({
      providers: [
        SeedProductosUseCase,
        { provide: I_PRODUCT_REPOSITORY, useValue: repository },
        { provide: I_PRODUCT_INTEGRITY_REPOSITORY, useValue: integrity },
        { provide: ProductoConsistencyService, useValue: consistency },
      ],
    }).compile();

  it('creates each product with its deterministic id and reports counts', async () => {
    const useCase = (await compile()).get(SeedProductosUseCase);
    const result = await useCase.execute(seed);
    expect(result.productosCreados).toBe(2);
    expect(result.productosOmitidos).toBe(0);
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ id: 'prod-001' }));
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ id: 'prod-002' }));
  });

  it('reuses domain integrity rules before creating', async () => {
    const useCase = (await compile()).get(SeedProductosUseCase);
    await useCase.execute(seed);
    expect(consistency.assertConsistency).toHaveBeenCalledWith('cat-1', null);
    expect(integrity.existsBySku).toHaveBeenCalledWith('SKU-1');
    expect(integrity.existsBySlug).toHaveBeenCalledWith('valvula');
  });

  it('skips existing documents (idempotent)', async () => {
    repository.findById.mockImplementation(async (id: string) =>
      id === 'prod-001' ? ({} as never) : null,
    );
    const useCase = (await compile()).get(SeedProductosUseCase);
    const result = await useCase.execute(seed);
    expect(result.productosCreados).toBe(1);
    expect(result.productosOmitidos).toBe(1);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ id: 'prod-002' }));
  });

  it('rejects a duplicate SKU with a conflict error', async () => {
    integrity.existsBySku.mockImplementation(async (sku: string) => sku === 'SKU-1');
    const useCase = (await compile()).get(SeedProductosUseCase);
    await expect(useCase.execute(seed)).rejects.toBeInstanceOf(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('fails fast when the category is missing', async () => {
    consistency.assertConsistency.mockRejectedValue(new Error('Category not found'));
    const useCase = (await compile()).get(SeedProductosUseCase);
    await expect(useCase.execute(seed)).rejects.toThrow(/Category not found/i);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
