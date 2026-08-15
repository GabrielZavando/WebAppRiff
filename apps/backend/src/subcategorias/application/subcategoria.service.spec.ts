import { ConflictException, NotFoundException } from '@nestjs/common';
import { SubcategoriaService } from './subcategoria.service';

describe('SubcategoriaService', () => {
  let service: SubcategoriaService;
  let repository: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };
  let integrity: {
    findByCategoriaAndSlug: jest.Mock;
    existsById: jest.Mock;
    belongsToCategoria: jest.Mock;
    hasAssociatedProducts: jest.Mock;
  };
  let categoriaRepository: { findById: jest.Mock };

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    integrity = {
      findByCategoriaAndSlug: jest.fn(),
      existsById: jest.fn(),
      belongsToCategoria: jest.fn(),
      hasAssociatedProducts: jest.fn(),
    };
    categoriaRepository = { findById: jest.fn() };
    service = new SubcategoriaService(
      repository as never,
      integrity as never,
      categoriaRepository as never,
    );
  });

  describe('findAll', () => {
    it('delegates the filter to the repository', async () => {
      repository.findAll.mockResolvedValue([]);
      await service.findAll({ categoriaId: 'cat-1', activa: true });
      expect(repository.findAll).toHaveBeenCalledWith({ categoriaId: 'cat-1', activa: true });
    });
  });

  describe('findById', () => {
    it('returns the subcategoria when found', async () => {
      repository.findById.mockResolvedValue({ id: 's1' });
      expect(await service.findById('s1')).toEqual({ id: 's1' });
    });

    it('throws NotFoundException when missing', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { categoriaId: 'cat-1', nombre: 'Válvulas', slug: 'valvulas' } as never;

    it('throws NotFoundException when the parent category does not exist', async () => {
      categoriaRepository.findById.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when the composite slug already exists', async () => {
      categoriaRepository.findById.mockResolvedValue({ id: 'cat-1' });
      integrity.findByCategoriaAndSlug.mockResolvedValue({ id: 'other' });
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('creates when parent exists and slug is unique', async () => {
      categoriaRepository.findById.mockResolvedValue({ id: 'cat-1' });
      integrity.findByCategoriaAndSlug.mockResolvedValue(null);
      repository.create.mockResolvedValue({ id: 's1' });
      await service.create(dto);
      expect(repository.create).toHaveBeenCalledWith({
        categoriaId: 'cat-1',
        nombre: 'Válvulas',
        slug: 'valvulas',
        orden: 0,
        activa: true,
      });
    });
  });

  describe('update', () => {
    const current = { id: 's1', categoriaId: 'cat-1', slug: 'a', nombre: 'Old' };

    it('throws NotFoundException when missing', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.update('s1', { nombre: 'X' } as never)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException on duplicate composite slug', async () => {
      repository.findById.mockResolvedValue(current);
      integrity.findByCategoriaAndSlug.mockResolvedValue({ id: 'other' });
      await expect(
        service.update('s1', { slug: 'b' } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when the changed parent category does not exist', async () => {
      repository.findById.mockResolvedValue(current);
      categoriaRepository.findById.mockResolvedValue(null);
      await expect(
        service.update('s1', { categoriaId: 'cat-2' } as never),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates when valid', async () => {
      repository.findById.mockResolvedValue(current);
      repository.update.mockResolvedValue({ ...current, nombre: 'X' });
      await service.update('s1', { nombre: 'X' } as never);
      expect(repository.update).toHaveBeenCalledWith('s1', { nombre: 'X' });
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when missing', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when it has associated products', async () => {
      repository.findById.mockResolvedValue({ id: 's1' });
      integrity.hasAssociatedProducts.mockResolvedValue(true);
      await expect(service.remove('s1')).rejects.toThrow(ConflictException);
    });

    it('removes when valid', async () => {
      repository.findById.mockResolvedValue({ id: 's1' });
      integrity.hasAssociatedProducts.mockResolvedValue(false);
      await service.remove('s1');
      expect(repository.remove).toHaveBeenCalledWith('s1');
    });
  });
});
