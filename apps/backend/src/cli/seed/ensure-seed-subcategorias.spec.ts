import { Test } from '@nestjs/testing';
import { EnsureSeedSubcategorias, MEDIDORES_DE_NIVEL_ID } from './ensure-seed-subcategorias';
import {
  ISubcategoriaRepository,
  I_SUBCATEGORIA_REPOSITORY,
} from '@/subcategorias/domain/isubcategoria.repository';

describe('EnsureSeedSubcategorias', () => {
  const subcategoriaRepo = {
    findById: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    subcategoriaRepo.findById.mockResolvedValue(null);
  });

  const compile = async () =>
    Test.createTestingModule({
      providers: [
        EnsureSeedSubcategorias,
        { provide: I_SUBCATEGORIA_REPOSITORY, useValue: subcategoriaRepo },
      ],
    }).compile();

  it('creates the Medidores de Nivel subcategory with the composite id when missing', async () => {
    const useCase = (await compile()).get(EnsureSeedSubcategorias);
    await useCase.ensureMedidoresDeNivel();
    expect(subcategoriaRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: MEDIDORES_DE_NIVEL_ID,
        categoriaId: 'medicion-de-fluidos',
        nombre: 'Medidores de Nivel',
        slug: 'medidores-de-nivel',
        activa: true,
        orden: 99,
      }),
    );
  });

  it('does not create when the subcategory already exists (idempotent)', async () => {
    subcategoriaRepo.findById.mockResolvedValue({ id: MEDIDORES_DE_NIVEL_ID } as never);
    const useCase = (await compile()).get(EnsureSeedSubcategorias);
    await useCase.ensureMedidoresDeNivel();
    expect(subcategoriaRepo.create).not.toHaveBeenCalled();
  });
});
