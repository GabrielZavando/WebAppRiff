import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductoConsistencyService } from './producto-consistency.service';
import { DEFAULT_CATEGORIA_ID } from './producto-consistency.service';

describe('ProductoConsistencyService', () => {
  const categoriaRepository = { findById: jest.fn() };
  const subcategoriaIntegrity = { belongsToCategoria: jest.fn() };

  const service = new ProductoConsistencyService(
    categoriaRepository as never,
    subcategoriaIntegrity as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('defaults to sin-categoria when categoriaId is omitted and no subcategoria', async () => {
    categoriaRepository.findById.mockResolvedValue({ id: DEFAULT_CATEGORIA_ID });
    const result = await service.assertConsistency(undefined, null);
    expect(result).toBe(DEFAULT_CATEGORIA_ID);
    expect(categoriaRepository.findById).toHaveBeenCalledWith(DEFAULT_CATEGORIA_ID);
  });

  it('returns the provided categoriaId when it exists and there is no subcategoria', async () => {
    categoriaRepository.findById.mockResolvedValue({ id: 'cat-1' });
    const result = await service.assertConsistency('cat-1', null);
    expect(result).toBe('cat-1');
  });

  it('throws NotFoundException when the category does not exist', async () => {
    categoriaRepository.findById.mockResolvedValue(null);
    await expect(service.assertConsistency('missing', null)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns the categoriaId when the subcategoria belongs to it', async () => {
    subcategoriaIntegrity.belongsToCategoria.mockResolvedValue(true);
    const result = await service.assertConsistency('cat-1', 'sub-1');
    expect(result).toBe('cat-1');
    expect(subcategoriaIntegrity.belongsToCategoria).toHaveBeenCalledWith('sub-1', 'cat-1');
  });

  it('throws ConflictException when the subcategoria does not belong to the category', async () => {
    subcategoriaIntegrity.belongsToCategoria.mockResolvedValue(false);
    await expect(service.assertConsistency('cat-1', 'sub-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('applies the default category when subcategoriaId is provided without categoriaId', async () => {
    subcategoriaIntegrity.belongsToCategoria.mockResolvedValue(true);
    const result = await service.assertConsistency(undefined, 'sub-1');
    expect(result).toBe(DEFAULT_CATEGORIA_ID);
    expect(subcategoriaIntegrity.belongsToCategoria).toHaveBeenCalledWith(
      'sub-1',
      DEFAULT_CATEGORIA_ID,
    );
  });
});
