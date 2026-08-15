import { NotFoundException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { IUsuarioRepository, I_USUARIO_REPOSITORY } from '../domain/iusuario.repository';
import { Usuario } from '../domain/usuario.entity';

const makeUsuario = (): Usuario => ({
  id: 'uid-1',
  nombre: 'Admin',
  email: 'admin@riff.cl',
  rol: 'superadmin',
  activo: true,
  creadoPor: 'system',
  creadoEn: new Date(),
  actualizadoEn: new Date(),
});

describe('AuthController', () => {
  let controller: AuthController;
  const repository = { findById: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(repository as unknown as IUsuarioRepository);
  });

  it('returns the Usuario profile for the verified token uid', async () => {
    repository.findById.mockResolvedValue(makeUsuario());

    const result = await controller.me({ user: { uid: 'uid-1' } } as never);

    expect(repository.findById).toHaveBeenCalledWith('uid-1');
    expect(result.email).toBe('admin@riff.cl');
    expect(result.rol).toBe('superadmin');
  });

  it('throws 404 when no Firestore profile exists for the token uid', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      controller.me({ user: { uid: 'uid-1' } } as never),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
