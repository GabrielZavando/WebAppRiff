import { SeedCatalogUseCase } from './seed-catalog.use-case';

describe('SeedCatalogUseCase', () => {
  const mockCategoriaRepo = {
    findById: jest.fn(),
    create: jest.fn(),
  };
  const mockSubcategoriaRepo = {
    findById: jest.fn(),
    create: jest.fn(),
  };
  let useCase: SeedCatalogUseCase;

  const seed = {
    categorias: [
      {
        id: 'medicion-de-fluidos',
        nombre: 'Medición de Fluidos',
        slug: 'medicion-de-fluidos',
        orden: 0,
        activa: true,
        esDefault: false,
      },
      {
        id: 'sin-categoria',
        nombre: 'Sin categoría',
        slug: 'sin-categoria',
        orden: 0,
        activa: true,
        esDefault: true,
      },
    ],
    subcategorias: [
      {
        id: 'medicion-de-fluidos--y',
        categoriaId: 'medicion-de-fluidos',
        nombre: 'Y',
        slug: 'y',
        orden: 0,
        activa: true,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoriaRepo.create.mockImplementation(async () => ({ id: 'x' }));
    mockSubcategoriaRepo.create.mockImplementation(async () => ({ id: 'x' }));
    useCase = new SeedCatalogUseCase(mockCategoriaRepo as never, mockSubcategoriaRepo as never);
  });

  it('creates each category with the correct id and esDefault', async () => {
    mockCategoriaRepo.findById.mockResolvedValue(null);
    const result = await useCase.execute(seed as never);
    expect(mockCategoriaRepo.create).toHaveBeenCalledTimes(2);
    expect(mockCategoriaRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'medicion-de-fluidos', esDefault: false }),
    );
    expect(mockCategoriaRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sin-categoria', esDefault: true }),
    );
    expect(result.categoriasCreadas).toBe(2);
    expect(result.categoriasOmitidas).toBe(0);
  });

  it('creates each subcategoria with composite id and resolved categoriaId', async () => {
    mockCategoriaRepo.findById.mockResolvedValue(null);
    mockSubcategoriaRepo.findById.mockResolvedValue(null);
    await useCase.execute(seed as never);
    expect(mockSubcategoriaRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'medicion-de-fluidos--y', categoriaId: 'medicion-de-fluidos' }),
    );
  });

  it('is idempotent: skips existing docs and never calls create a second time', async () => {
    mockCategoriaRepo.findById.mockResolvedValue({ id: 'x' });
    mockSubcategoriaRepo.findById.mockResolvedValue({ id: 'x' });
    const result = await useCase.execute(seed as never);
    expect(mockCategoriaRepo.create).not.toHaveBeenCalled();
    expect(mockSubcategoriaRepo.create).not.toHaveBeenCalled();
    expect(result.categoriasOmitidas).toBe(2);
    expect(result.subcategoriasOmitidas).toBe(1);
  });

  it('creates categories before subcategorias', async () => {
    mockCategoriaRepo.findById.mockResolvedValue(null);
    mockSubcategoriaRepo.findById.mockResolvedValue(null);
    const order: string[] = [];
    mockCategoriaRepo.create.mockImplementation(async () => {
      order.push('cat');
      return { id: 'x' };
    });
    mockSubcategoriaRepo.create.mockImplementation(async () => {
      order.push('sub');
      return { id: 'x' };
    });
    await useCase.execute(seed as never);
    expect(order[0]).toBe('cat');
    expect(order).toContain('sub');
  });
});
