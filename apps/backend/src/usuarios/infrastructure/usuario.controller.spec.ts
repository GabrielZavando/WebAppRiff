import { UsuarioController } from './usuario.controller';
import { UsuarioService } from '../application/usuario.service';

describe('UsuarioController', () => {
  let controller: UsuarioController;
  let service: {
    findAll: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };
    controller = new UsuarioController(service as unknown as UsuarioService);
  });

  const authedReq = (role: string, uid = 'u1') => ({ user: { uid, role } }) as never;

  it('findAll delegates to service with actor role', async () => {
    service.findAll.mockResolvedValue([{ id: 'u1' }]);
    const result = await controller.findAll(authedReq('admin'));
    expect(service.findAll).toHaveBeenCalledWith('admin');
    expect(result).toEqual([{ id: 'u1' }]);
  });

  it('create merges creadoPor and delegates to service', async () => {
    const dto = { nombre: 'Ana', email: 'a@riff.cl', rol: 'editor' } as never;
    service.create.mockResolvedValue({ id: 'new' });
    const result = await controller.create(authedReq('admin', 'admin-1'), dto);
    expect(service.create).toHaveBeenCalledWith(
      { nombre: 'Ana', email: 'a@riff.cl', rol: 'editor', creadoPor: 'admin-1' },
      'admin',
    );
    expect(result).toEqual({ id: 'new' });
  });

  it('findById delegates with id and role', async () => {
    service.findById.mockResolvedValue({ id: 'x' });
    const result = await controller.findById(authedReq('admin'), 'x');
    expect(service.findById).toHaveBeenCalledWith('x', 'admin');
    expect(result).toEqual({ id: 'x' });
  });

  it('update delegates with id, dto and role', async () => {
    const dto = { nombre: 'Ana R' } as never;
    service.update.mockResolvedValue({ id: 'x', nombre: 'Ana R' });
    const result = await controller.update(authedReq('superadmin'), 'x', dto);
    expect(service.update).toHaveBeenCalledWith('x', dto, 'superadmin');
    expect(result).toEqual({ id: 'x', nombre: 'Ana R' });
  });
});
