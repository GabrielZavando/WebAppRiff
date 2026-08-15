import { SubcategoriaController } from './subcategoria.controller';
import { SubcategoriaService } from '../application/subcategoria.service';

describe('SubcategoriaController', () => {
  let controller: SubcategoriaController;
  let service: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    controller = new SubcategoriaController(service as unknown as SubcategoriaService);
  });

  it('findAll delegates with parsed categoriaId and activa filters', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll(undefined, undefined);
    expect(service.findAll).toHaveBeenCalledWith({});
    await controller.findAll('cat-1', 'true');
    expect(service.findAll).toHaveBeenCalledWith({ categoriaId: 'cat-1', activa: true });
    await controller.findAll(undefined, 'false');
    expect(service.findAll).toHaveBeenCalledWith({ activa: false });
  });

  it('findById delegates', async () => {
    service.findById.mockResolvedValue({ id: 's1' });
    const result = await controller.findById('s1');
    expect(service.findById).toHaveBeenCalledWith('s1');
    expect(result).toEqual({ id: 's1' });
  });

  it('create delegates', async () => {
    const dto = { categoriaId: 'cat-1', nombre: 'X', slug: 'x' } as never;
    service.create.mockResolvedValue({ id: 's1' });
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('update delegates', async () => {
    const dto = { nombre: 'X' } as never;
    service.update.mockResolvedValue({ id: 's1' });
    await controller.update('s1', dto);
    expect(service.update).toHaveBeenCalledWith('s1', dto);
  });

  it('remove delegates', async () => {
    service.remove.mockResolvedValue(undefined);
    await controller.remove('s1');
    expect(service.remove).toHaveBeenCalledWith('s1');
  });

  it('applies differentiated @Roles: editor can edit but not create/delete', () => {
    expect(Reflect.getMetadata('roles', SubcategoriaController.prototype.create)).toEqual([
      'superadmin',
      'admin',
    ]);
    expect(Reflect.getMetadata('roles', SubcategoriaController.prototype.update)).toEqual([
      'superadmin',
      'admin',
      'editor',
    ]);
    expect(Reflect.getMetadata('roles', SubcategoriaController.prototype.remove)).toEqual([
      'superadmin',
      'admin',
    ]);
  });
});
