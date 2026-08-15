import { Test } from '@nestjs/testing';
import { BootstrapSuperadminUseCase } from './bootstrap-superadmin.use-case';
import { IUsuarioRepository, I_USUARIO_REPOSITORY } from '../domain/iusuario.repository';
import { FIREBASE_AUTH } from '../../infrastructure/firebase/firebase.tokens';
import { Usuario, UsuarioRol } from '../domain/usuario.entity';

const makeUsuario = (over: Partial<Usuario> = {}): Usuario => ({
  id: 'uid-1',
  nombre: 'Admin',
  email: 'admin@riff.cl',
  rol: 'superadmin' as UsuarioRol,
  activo: true,
  creadoPor: 'system',
  creadoEn: new Date(),
  actualizadoEn: new Date(),
  ...over,
});

describe('BootstrapSuperadminUseCase', () => {
  let useCase: BootstrapSuperadminUseCase;
  const repository = {
    findAll: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    setRoleClaim: jest.fn(),
  };
  const auth = { getUserByEmail: jest.fn() };

  const input = { email: 'admin@riff.cl', password: 'secret123', nombre: 'Admin' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        BootstrapSuperadminUseCase,
        { provide: I_USUARIO_REPOSITORY, useValue: repository },
        { provide: FIREBASE_AUTH, useValue: auth },
      ],
    }).compile();
    useCase = moduleRef.get(BootstrapSuperadminUseCase);
  });

  it('creates a superadmin with creadoPor "system" when no users exist', async () => {
    repository.findAll.mockResolvedValue([]);
    repository.create.mockResolvedValue(makeUsuario());

    const result = await useCase.execute(input);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Admin',
        email: 'admin@riff.cl',
        rol: 'superadmin',
        password: 'secret123',
        creadoPor: 'system',
      }),
    );
    expect(result.rol).toBe('superadmin');
    expect(result.creadoPor).toBe('system');
  });

  it('is idempotent: returns the existing user without calling create again', async () => {
    repository.findAll.mockResolvedValue([makeUsuario()]);

    const result = await useCase.execute(input);

    expect(repository.create).not.toHaveBeenCalled();
    expect(result.id).toBe('uid-1');
  });

  it('repairs the claim and doc when the auth email already exists', async () => {
    repository.findAll.mockResolvedValue([]);
    repository.create.mockRejectedValue({ code: 'auth/email-already-exists' });
    auth.getUserByEmail.mockResolvedValue({ uid: 'uid-2' });
    repository.setRoleClaim.mockResolvedValue(undefined);
    repository.update.mockResolvedValue(makeUsuario({ id: 'uid-2' }));

    const result = await useCase.execute(input);

    expect(auth.getUserByEmail).toHaveBeenCalledWith('admin@riff.cl');
    expect(repository.setRoleClaim).toHaveBeenCalledWith('uid-2', 'superadmin');
    expect(repository.update).toHaveBeenCalledWith(
      'uid-2',
      expect.objectContaining({ rol: 'superadmin', activo: true }),
    );
    expect(result.id).toBe('uid-2');
  });
});
