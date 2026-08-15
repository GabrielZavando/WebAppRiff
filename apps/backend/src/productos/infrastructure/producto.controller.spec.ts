import { ProductoController } from './producto.controller';
import { ProductoReadService } from '../application/producto-read.service';
import { ProductoWriteService } from '../application/producto-write.service';
import { ProductoCreateDto } from './producto-create.dto';
import { ProductoUpdateDto } from './producto-update.dto';
import { ROLES_KEY } from '../../auth/roles.decorator';

describe('ProductoController', () => {
  const readService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
  };
  const writeService = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const controller = new ProductoController(readService as never, writeService as never);

  beforeEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('builds the filter and forces anonymous callers to not-authenticated', async () => {
      readService.findAll.mockResolvedValue([]);
      await controller.findAll(
        { user: undefined } as never,
        'cat-1',
        'sub-1',
        'true',
        'true',
        'val',
        'titulo',
        'desc',
      );
      expect(readService.findAll).toHaveBeenCalledWith(
        {
          categoriaId: 'cat-1',
          subcategoriaId: 'sub-1',
          destacado: true,
          publicado: true,
          search: 'val',
          sortBy: 'titulo',
          sortDir: 'desc',
        },
        false,
      );
    });

    it('treats an authenticated caller as authenticated (sees all)', async () => {
      readService.findAll.mockResolvedValue([]);
      await controller.findAll(
        { user: { role: 'admin' } } as never,
        undefined,
        undefined,
        undefined,
        'false',
        undefined,
        undefined,
        undefined,
      );
      expect(readService.findAll).toHaveBeenCalledWith({ publicado: false }, true);
    });

    it('omits an invalid sortBy', async () => {
      readService.findAll.mockResolvedValue([]);
      await controller.findAll(
        { user: undefined } as never,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'invalid',
        'asc',
      );
      const [, isAuth] = readService.findAll.mock.calls[0];
      const filter = readService.findAll.mock.calls[0][0];
      expect(filter.sortBy).toBeUndefined();
      expect(isAuth).toBe(false);
    });
  });

  describe('by slug and id', () => {
    it('findBySlug delegates with authentication state', async () => {
      readService.findBySlug.mockResolvedValue({} as never);
      await controller.findBySlug({ user: undefined } as never, 'slug-1');
      expect(readService.findBySlug).toHaveBeenCalledWith('slug-1', false);
    });

    it('findById delegates with authentication state', async () => {
      readService.findById.mockResolvedValue({} as never);
      await controller.findById({ user: { role: 'editor' } } as never, 'p1');
      expect(readService.findById).toHaveBeenCalledWith('p1', true);
    });
  });

  describe('write endpoints', () => {
    it('create delegates to writeService', async () => {
      const dto = { sku: 'S' } as ProductoCreateDto;
      await controller.create(dto);
      expect(writeService.create).toHaveBeenCalledWith(dto);
    });

    it('update delegates to writeService', async () => {
      const dto = { publicado: false } as ProductoUpdateDto;
      await controller.update('p1', dto);
      expect(writeService.update).toHaveBeenCalledWith('p1', dto);
    });

    it('remove delegates to writeService', async () => {
      await controller.remove('p1');
      expect(writeService.remove).toHaveBeenCalledWith('p1');
    });
  });

  describe('role metadata', () => {
    it('restricts create to superadmin/admin', () => {
      expect(Reflect.getMetadata(ROLES_KEY, ProductoController.prototype.create)).toEqual([
        'superadmin',
        'admin',
      ]);
    });

    it('allows editor on update', () => {
      expect(Reflect.getMetadata(ROLES_KEY, ProductoController.prototype.update)).toEqual([
        'superadmin',
        'admin',
        'editor',
      ]);
    });

    it('restricts remove to superadmin/admin (no editor)', () => {
      expect(Reflect.getMetadata(ROLES_KEY, ProductoController.prototype.remove)).toEqual([
        'superadmin',
        'admin',
      ]);
    });
  });
});
