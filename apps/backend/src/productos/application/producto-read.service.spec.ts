import { NotFoundException } from '@nestjs/common';
import { ProductoReadService } from './producto-read.service';
import { Producto } from '../domain/producto.entity';

describe('ProductoReadService', () => {
  const published: Producto = { id: 'p1', publicado: true } as Producto;
  const draft: Producto = { id: 'p2', publicado: false } as Producto;
  const queryRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
  };

  const service = new ProductoReadService(queryRepository as never);

  beforeEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('forces publicado=true and projection=card for anonymous callers', async () => {
      queryRepository.findAll.mockResolvedValue({ items: [published], total: 1 });
      await service.findAll({ categoriaId: 'cat-1' }, false);
      expect(queryRepository.findAll).toHaveBeenCalledWith({
        categoriaId: 'cat-1',
        publicado: true,
        projection: 'card',
      });
    });

    it('passes the filter as-is with projection=full for authenticated callers', async () => {
      queryRepository.findAll.mockResolvedValue({ items: [draft], total: 1 });
      const filter = { categoriaId: 'cat-1', publicado: false };
      await service.findAll(filter, true);
      expect(queryRepository.findAll).toHaveBeenCalledWith({
        categoriaId: 'cat-1',
        publicado: false,
        projection: 'full',
      });
    });

    it('returns the repository result as-is without additional transformation', async () => {
      const repoResult = { items: [published], total: 1 };
      queryRepository.findAll.mockResolvedValue(repoResult);
      const result = await service.findAll({}, true);
      expect(result).toBe(repoResult);
    });

    it('propagates page and limit from filter to repository', async () => {
      queryRepository.findAll.mockResolvedValue({ items: [], total: 0 });
      const filter = { page: 3, limit: 10 };
      await service.findAll(filter, false);
      expect(queryRepository.findAll).toHaveBeenCalledWith({
        page: 3,
        limit: 10,
        publicado: true,
        projection: 'card',
      });
    });
  });

  describe('findById', () => {
    it('returns the product when found', async () => {
      queryRepository.findById.mockResolvedValue(published);
      expect(await service.findById('p1', true)).toBe(published);
    });

    it('throws NotFoundException when missing', async () => {
      queryRepository.findById.mockResolvedValue(null);
      await expect(service.findById('x', true)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException for an unpublished product when anonymous', async () => {
      queryRepository.findById.mockResolvedValue(draft);
      await expect(service.findById('p2', false)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns an unpublished product for authenticated callers', async () => {
      queryRepository.findById.mockResolvedValue(draft);
      expect(await service.findById('p2', true)).toBe(draft);
    });
  });

  describe('findBySlug', () => {
    it('returns the product when found', async () => {
      queryRepository.findBySlug.mockResolvedValue(published);
      expect(await service.findBySlug('slug-1', true)).toBe(published);
    });

    it('throws NotFoundException for a missing slug', async () => {
      queryRepository.findBySlug.mockResolvedValue(null);
      await expect(service.findBySlug('x', true)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException for an unpublished product when anonymous', async () => {
      queryRepository.findBySlug.mockResolvedValue(draft);
      await expect(service.findBySlug('slug-2', false)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
