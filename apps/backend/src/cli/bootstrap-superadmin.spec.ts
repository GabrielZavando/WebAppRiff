import { Test } from '@nestjs/testing';
import { BootstrapSuperadminUseCase } from '../usuarios/application/bootstrap-superadmin.use-case';
import { IUsuarioRepository, I_USUARIO_REPOSITORY } from '../usuarios/domain/iusuario.repository';
import { FIREBASE_AUTH } from '../infrastructure/firebase/firebase.tokens';
import { loadBootstrapConfig } from '../usuarios/application/bootstrap-config';
import { Usuario } from '../usuarios/domain/usuario.entity';

const makeUsuario = (over: Partial<Usuario> = {}): Usuario => ({
  id: 'cli-uid',
  nombre: 'Cli',
  email: 'cli@riff.cl',
  rol: 'superadmin',
  activo: true,
  creadoPor: 'system',
  creadoEn: new Date(),
  actualizadoEn: new Date(),
  ...over,
});

/**
 * Verifica el "cableado" del comando CLI sin tocar Firebase: loadBootstrapConfig
 * + BootstrapSuperadminUseCase resueltos en un módulo de testing con el
 * repositorio mockeado.
 */
describe('bootstrap superadmin CLI wiring', () => {
  it('loads config from env and creates the superadmin via the use case', async () => {
    const repository = {
      findAll: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      setRoleClaim: jest.fn(),
    };
    const auth = { getUserByEmail: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BootstrapSuperadminUseCase,
        { provide: I_USUARIO_REPOSITORY, useValue: repository },
        { provide: FIREBASE_AUTH, useValue: auth },
      ],
    }).compile();
    const useCase = moduleRef.get(BootstrapSuperadminUseCase);

    const config = loadBootstrapConfig({
      BOOTSTRAP_SUPERADMIN_EMAIL: 'cli@riff.cl',
      BOOTSTRAP_SUPERADMIN_PASSWORD: 'secret123',
    });
    repository.create.mockResolvedValue(makeUsuario());

    const user = await useCase.execute(config);

    expect(user.id).toBe('cli-uid');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'cli@riff.cl', rol: 'superadmin', creadoPor: 'system' }),
    );
  });

  it('fails fast when required env vars are missing', () => {
    expect(() => loadBootstrapConfig({})).toThrow(/BOOTSTRAP_SUPERADMIN_EMAIL/);
  });
});
