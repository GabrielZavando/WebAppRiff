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
    it('forces publicado=true for anonymous callers', async () => {
      queryRepository.findAll.mockResolvedValue([published]);
      await service.findAll({ categoriaId: 'cat-1' }, false);
      expect(queryRepository.findAll).toHaveBeenCalledWith({
        categoriaId: 'cat-1',
        publicado: true,
      });
    });

    it('passes the filter as-is for authenticated callers', async () => {
      queryRepository.findAll.mockResolvedValue([draft]);
      const filter = { categoriaId: 'cat-1', publicado: false };
      await service.findAll(filter, true);
      expect(queryRepository.findAll).toHaveBeenCalledWith(filter);
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
