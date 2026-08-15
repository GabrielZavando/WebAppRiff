import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { IUsuarioRepository } from '../domain/iusuario.repository';
import { Usuario, UsuarioRol } from '../domain/usuario.entity';

function makeUsuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: 'u1',
    nombre: 'Ana',
    email: 'ana@riff.cl',
    rol: 'admin',
    activo: true,
    creadoPor: 'x',
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    ...overrides,
  };
}

describe('UsuarioService', () => {
  let repo: jest.Mocked<IUsuarioRepository>;
  let service: UsuarioService;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      setRoleClaim: jest.fn(),
    } as jest.Mocked<IUsuarioRepository>;
    service = new UsuarioService(repo as never);
  });

  describe('create', () => {
    it('allows an admin to create an editor', async () => {
      repo.create.mockResolvedValue(makeUsuario({ rol: 'editor' }));
      const result = await service.create(
        { nombre: 'Ana', email: 'ana@riff.cl', rol: 'editor', creadoPor: 'admin1' },
        'admin',
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ rol: 'editor', creadoPor: 'admin1' }),
      );
      expect(result.rol).toBe('editor');
    });

    it('forbids an admin from creating an admin', async () => {
      await expect(
        service.create(
          { nombre: 'Ana', email: 'ana@riff.cl', rol: 'admin', creadoPor: 'admin1' },
          'admin',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows a superadmin to create an admin', async () => {
      repo.create.mockResolvedValue(makeUsuario({ rol: 'admin' }));
      const result = await service.create(
        { nombre: 'Ana', email: 'ana@riff.cl', rol: 'admin', creadoPor: 'sa1' },
        'superadmin',
      );
      expect(result.rol).toBe('admin');
    });
  });

  describe('read', () => {
    it('forbids an editor from listing users', async () => {
      await expect(service.findAll('editor')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('forbids an editor from reading a user', async () => {
      await expect(service.findById('u1', 'editor')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFoundException when the user is missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('missing', 'admin')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('allows an admin to list users', async () => {
      repo.findAll.mockResolvedValue([makeUsuario()]);
      const result = await service.findAll('admin');
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('forbids an admin from deactivating another admin', async () => {
      repo.findById.mockResolvedValue(makeUsuario({ id: 'u2', rol: 'admin' }));
      await expect(
        service.update('u2', { activo: false }, 'admin'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows a superadmin to deactivate another admin', async () => {
      repo.findById.mockResolvedValue(makeUsuario({ id: 'u2', rol: 'admin' }));
      repo.update.mockResolvedValue(makeUsuario({ id: 'u2', rol: 'admin', activo: false }));
      const result = await service.update('u2', { activo: false }, 'superadmin');
      expect(repo.update).toHaveBeenCalledWith('u2', { activo: false });
      expect(result.activo).toBe(false);
    });

    it('forbids an editor from updating users', async () => {
      await expect(
        service.update('u2', { nombre: 'x' }, 'editor'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('forbids an admin from changing roles', async () => {
      repo.findById.mockResolvedValue(makeUsuario({ id: 'u2', rol: 'editor' }));
      await expect(
        service.update('u2', { rol: 'admin' }, 'admin'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('updates the custom claim when the role changes', async () => {
      repo.findById.mockResolvedValue(makeUsuario({ id: 'u2', rol: 'editor' }));
      repo.update.mockResolvedValue(makeUsuario({ id: 'u2', rol: 'admin' }));
      await service.update('u2', { rol: 'admin' }, 'superadmin');
      expect(repo.setRoleClaim).toHaveBeenCalledWith('u2', 'admin');
    });

    it('does not update the custom claim when the role is unchanged', async () => {
      repo.findById.mockResolvedValue(makeUsuario({ id: 'u2', rol: 'admin' }));
      repo.update.mockResolvedValue(makeUsuario({ id: 'u2', rol: 'admin' }));
      await service.update('u2', { nombre: 'Nuevo' }, 'superadmin');
      expect(repo.setRoleClaim).not.toHaveBeenCalled();
    });

    it('returns 404 when the target user does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.update('missing', undefined as never, 'superadmin'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids demoting the last active superadmin (conflict)', async () => {
      repo.findById.mockResolvedValue(makeUsuario({ id: 'only', rol: 'superadmin', activo: true }));
      repo.findAll.mockResolvedValue([
        makeUsuario({ id: 'only', rol: 'superadmin', activo: true }),
      ]);
      await expect(
        service.update('only', { rol: 'admin' }, 'superadmin'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('allows demoting a superadmin when another active superadmin exists', async () => {
      repo.findById.mockResolvedValue(makeUsuario({ id: 'target', rol: 'superadmin', activo: true }));
      repo.findAll.mockResolvedValue([
        makeUsuario({ id: 'target', rol: 'superadmin', activo: true }),
        makeUsuario({ id: 'other', rol: 'superadmin', activo: true }),
      ]);
      repo.update.mockResolvedValue(makeUsuario({ id: 'target', rol: 'admin' }));
      const result = await service.update('target', { rol: 'admin' }, 'superadmin');
      expect(result.rol).toBe('admin');
    });
  });
});
