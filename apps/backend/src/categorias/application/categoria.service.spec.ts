import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import {
  ICategoriaRepository,
  ICategoriaIntegrityRepository,
  I_CATEGORIA_REPOSITORY,
  I_CATEGORIA_INTEGRITY_REPOSITORY,
} from '../domain/icategoria.repository';
import { Categoria } from '../domain/categoria.entity';
import { CategoriaCreateDto } from '../infrastructure/categoria-create.dto';
import { CategoriaUpdateDto } from '../infrastructure/categoria-update.dto';

const makeCategoria = (overrides: Partial<Categoria> = {}): Categoria => ({
  id: 'c1',
  nombre: 'Válvulas',
  slug: 'valvulas',
  orden: 1,
  activa: true,
  esDefault: false,
  creadoEn: new Date(),
  actualizadoEn: new Date(),
  ...overrides,
});

describe('CategoriaService', () => {
  let service: CategoriaService;
  let repository: {
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };
  let integrity: {
    findBySlug: jest.Mock;
    hasAssociatedProducts: jest.Mock;
    ensureDefault: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    integrity = {
      findBySlug: jest.fn(),
      hasAssociatedProducts: jest.fn(),
      ensureDefault: jest.fn(),
    };
    service = new CategoriaService(
      repository as unknown as ICategoriaRepository,
      integrity as unknown as ICategoriaIntegrityRepository,
    );
  });

  describe('findAll', () => {
    it('delegates to repository with the filter', async () => {
      repository.findAll.mockResolvedValue([makeCategoria()]);
      const result = await service.findAll({ activa: true });
      expect(repository.findAll).toHaveBeenCalledWith({ activa: true });
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('returns the category when it exists', async () => {
      repository.findById.mockResolvedValue(makeCategoria());
      const result = await service.findById('c1');
      expect(result.id).toBe('c1');
    });

    it('throws NotFoundException when missing', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates with default orden and activa when not provided', async () => {
      const dto: CategoriaCreateDto = { nombre: 'Válvulas', slug: 'valvulas' };
      integrity.findBySlug.mockResolvedValue(null);
      repository.create.mockResolvedValue(makeCategoria());
      await service.create(dto);
      expect(repository.create).toHaveBeenCalledWith({
        nombre: 'Válvulas',
        slug: 'valvulas',
        orden: 0,
        activa: true,
      });
    });

    it('rejects a duplicate slug with ConflictException', async () => {
      const dto: CategoriaCreateDto = { nombre: 'Válvulas', slug: 'valvulas' };
      integrity.findBySlug.mockResolvedValue(makeCategoria({ slug: 'valvulas' }));
      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('derives slug from nombre when slug is omitted', async () => {
      const dto: CategoriaCreateDto = { nombre: 'Medición de Fluidos' };
      integrity.findBySlug.mockResolvedValue(null);
      repository.create.mockResolvedValue(makeCategoria({ slug: 'medicion-de-fluidos' }));
      await service.create(dto);
      expect(integrity.findBySlug).toHaveBeenCalledWith('medicion-de-fluidos');
      expect(repository.create).toHaveBeenCalledWith({
        nombre: 'Medición de Fluidos',
        slug: 'medicion-de-fluidos',
        orden: 0,
        activa: true,
      });
    });

    it('uses the explicit slug when provided', async () => {
      const dto: CategoriaCreateDto = {
        nombre: 'Medición de Fluidos',
        slug: 'categoria-explicita',
      };
      integrity.findBySlug.mockResolvedValue(null);
      repository.create.mockResolvedValue(makeCategoria({ slug: 'categoria-explicita' }));
      await service.create(dto);
      expect(repository.create).toHaveBeenCalledWith({
        nombre: 'Medición de Fluidos',
        slug: 'categoria-explicita',
        orden: 0,
        activa: true,
      });
    });

    it('rejects a duplicate derived slug with ConflictException', async () => {
      const dto: CategoriaCreateDto = { nombre: 'Medición de Fluidos' };
      integrity.findBySlug.mockResolvedValue(makeCategoria({ slug: 'medicion-de-fluidos' }));
      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the category is missing', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.update('missing', { nombre: 'X' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('allows keeping the same slug', async () => {
      repository.findById.mockResolvedValue(makeCategoria({ slug: 'valvulas' }));
      integrity.findBySlug.mockResolvedValue(makeCategoria({ slug: 'valvulas' }));
      repository.update.mockResolvedValue(makeCategoria({ slug: 'valvulas', nombre: 'X' }));
      const dto: CategoriaUpdateDto = { slug: 'valvulas', nombre: 'X' };
      await service.update('c1', dto);
      expect(repository.update).toHaveBeenCalledWith('c1', dto);
    });

    it('rejects a slug already used by another category', async () => {
      repository.findById.mockResolvedValue(makeCategoria({ slug: 'valvulas' }));
      integrity.findBySlug.mockResolvedValue(makeCategoria({ id: 'other', slug: 'nuevo' }));
      const dto: CategoriaUpdateDto = { slug: 'nuevo' };
      await expect(service.update('c1', dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('updates when the new slug is free', async () => {
      repository.findById.mockResolvedValue(makeCategoria({ slug: 'valvulas' }));
      integrity.findBySlug.mockResolvedValue(null);
      repository.update.mockResolvedValue(makeCategoria({ slug: 'nuevo' }));
      await service.update('c1', { slug: 'nuevo' });
      expect(repository.update).toHaveBeenCalledWith('c1', { slug: 'nuevo' });
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when missing', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects removing the default category with ConflictException', async () => {
      repository.findById.mockResolvedValue(makeCategoria({ esDefault: true }));
      await expect(service.remove('sin-categoria')).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects removing a category with associated products', async () => {
      repository.findById.mockResolvedValue(makeCategoria());
      integrity.hasAssociatedProducts.mockResolvedValue(true);
      await expect(service.remove('c1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('removes a deletable category', async () => {
      repository.findById.mockResolvedValue(makeCategoria());
      integrity.hasAssociatedProducts.mockResolvedValue(false);
      repository.remove.mockResolvedValue(undefined);
      await service.remove('c1');
      expect(repository.remove).toHaveBeenCalledWith('c1');
    });
  });

  describe('ensureDefault', () => {
    it('delegates to the integrity repository', async () => {
      integrity.ensureDefault.mockResolvedValue(undefined);
      await service.ensureDefault();
      expect(integrity.ensureDefault).toHaveBeenCalled();
    });
  });
});
