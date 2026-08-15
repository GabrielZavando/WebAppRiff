import { CategoriaController } from './categoria.controller';
import { CategoriaService } from '../application/categoria.service';

describe('CategoriaController', () => {
  let controller: CategoriaController;
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
    controller = new CategoriaController(service as unknown as CategoriaService);
  });

  it('findAll delegates with parsed activa filter', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll('true');
    expect(service.findAll).toHaveBeenCalledWith({ activa: true });
    await controller.findAll(undefined);
    expect(service.findAll).toHaveBeenCalledWith(undefined);
    await controller.findAll('false');
    expect(service.findAll).toHaveBeenCalledWith({ activa: false });
  });

  it('findById delegates', async () => {
    service.findById.mockResolvedValue({ id: 'c1' });
    const result = await controller.findById('c1');
    expect(service.findById).toHaveBeenCalledWith('c1');
    expect(result).toEqual({ id: 'c1' });
  });

  it('create delegates', async () => {
    const dto = { nombre: 'X', slug: 'x' } as never;
    service.create.mockResolvedValue({ id: 'c1' });
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('update delegates', async () => {
    const dto = { nombre: 'X' } as never;
    service.update.mockResolvedValue({ id: 'c1' });
    await controller.update('c1', dto);
    expect(service.update).toHaveBeenCalledWith('c1', dto);
  });

  it('remove delegates', async () => {
    service.remove.mockResolvedValue(undefined);
    await controller.remove('c1');
    expect(service.remove).toHaveBeenCalledWith('c1');
  });

  it('applies differentiated @Roles: editor can edit but not create/delete', () => {
    expect(Reflect.getMetadata('roles', CategoriaController.prototype.create)).toEqual([
      'superadmin',
      'admin',
    ]);
    expect(Reflect.getMetadata('roles', CategoriaController.prototype.update)).toEqual([
      'superadmin',
      'admin',
      'editor',
    ]);
    expect(Reflect.getMetadata('roles', CategoriaController.prototype.remove)).toEqual([
      'superadmin',
      'admin',
    ]);
  });
});
