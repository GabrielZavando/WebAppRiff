import { getAuth } from 'firebase-admin/auth';
jest.mock('firebase-admin/auth');
import { UsuarioRepository } from './usuario.repository';
import { CreateUsuarioInput, UpdateUsuarioInput } from '../domain/iusuario.repository';

const fakeApp = {} as never;

const store = new Map<string, Record<string, unknown>>();

const makeDoc = (id: string) => ({
  id,
  set: jest.fn(async (data: Record<string, unknown>) => {
    store.set(id, data);
  }),
  get: jest.fn(async () => {
    const data = store.get(id);
    return { exists: data !== undefined, id, data: () => data };
  }),
  update: jest.fn(async (data: Record<string, unknown>) => {
    store.set(id, { ...(store.get(id) ?? {}), ...data });
  }),
});

const fakeCollection = {
  doc: jest.fn((id: string) => makeDoc(id)),
  get: jest.fn(async () => ({
    docs: Array.from(store.entries()).map(([id, data]) => ({ id, data: () => data })),
  })),
};

const fakeFirestore = { collection: jest.fn(() => fakeCollection) } as never;

const fakeAuth = {
  createUser: jest.fn(),
  updateUser: jest.fn(),
  setCustomUserClaims: jest.fn(),
};

describe('UsuarioRepository', () => {
  let repo: UsuarioRepository;

  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
    (getAuth as jest.Mock).mockReturnValue(fakeAuth);
    fakeAuth.createUser.mockResolvedValue({ uid: 'uid-1' });
    fakeAuth.updateUser.mockResolvedValue({});
    fakeAuth.setCustomUserClaims.mockResolvedValue({});
    repo = new UsuarioRepository(fakeFirestore, fakeApp);
  });

  describe('create', () => {
    it('creates the auth user, sets the role claim and persists the doc', async () => {
      const input: CreateUsuarioInput = {
        nombre: 'Ana',
        email: 'ana@riff.cl',
        rol: 'editor',
        creadoPor: 'sa-1',
      };

      const result = await repo.create(input);

      expect(fakeAuth.createUser).toHaveBeenCalledWith({
        email: 'ana@riff.cl',
        disabled: false,
      });
      expect(fakeAuth.setCustomUserClaims).toHaveBeenCalledWith('uid-1', { rol: 'editor' });
      expect(result.id).toBe('uid-1');
      expect(result.rol).toBe('editor');
      expect(store.get('uid-1')).toMatchObject({
        nombre: 'Ana',
        email: 'ana@riff.cl',
        rol: 'editor',
        activo: true,
        creadoPor: 'sa-1',
      });
    });

    it('forwards an optional password and creates an active user', async () => {
      const input: CreateUsuarioInput = {
        nombre: 'Ana',
        email: 'ana@riff.cl',
        rol: 'editor',
        creadoPor: 'sa-1',
        password: 'secret1',
      };
      await repo.create(input);
      expect(fakeAuth.createUser).toHaveBeenCalledWith({
        email: 'ana@riff.cl',
        disabled: false,
        password: 'secret1',
      });
    });
  });

  describe('findById', () => {
    it('returns the user when it exists', async () => {
      store.set('u1', {
        nombre: 'Ana',
        email: 'ana@riff.cl',
        rol: 'editor',
        activo: true,
        creadoPor: 'sa-1',
        creadoEn: '2026-01-01T00:00:00.000Z',
        actualizadoEn: '2026-01-01T00:00:00.000Z',
      });
      const user = await repo.findById('u1');
      expect(user).not.toBeNull();
      expect(user?.id).toBe('u1');
      expect(user?.email).toBe('ana@riff.cl');
    });

    it('returns null when it does not exist', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findAll', () => {
    it('maps every stored doc with its id', async () => {
      store.set('u1', {
        nombre: 'Ana',
        email: 'ana@riff.cl',
        rol: 'editor',
        activo: true,
        creadoPor: 'sa-1',
        creadoEn: 't',
        actualizadoEn: 't',
      });
      store.set('u2', {
        nombre: 'Bob',
        email: 'bob@riff.cl',
        rol: 'admin',
        activo: true,
        creadoPor: 'sa-1',
        creadoEn: 't',
        actualizadoEn: 't',
      });
      const all = await repo.findAll();
      expect(all).toHaveLength(2);
      expect(all.map((u) => u.id)).toEqual(['u1', 'u2']);
    });
  });

  describe('update', () => {
    it('updates the doc and the auth disabled state, and returns the merged user', async () => {
      store.set('u1', {
        nombre: 'Ana',
        email: 'ana@riff.cl',
        rol: 'editor',
        activo: true,
        creadoPor: 'sa-1',
        creadoEn: 't',
        actualizadoEn: 't',
      });
      const input: UpdateUsuarioInput = { nombre: 'Ana R', activo: false };
      const updated = await repo.update('u1', input);
      expect(store.get('u1')?.nombre).toBe('Ana R');
      expect(store.get('u1')?.activo).toBe(false);
      expect(fakeAuth.updateUser).toHaveBeenCalledWith('u1', { disabled: true });
      expect(updated.nombre).toBe('Ana R');
      expect(updated.activo).toBe(false);
    });

    it('does not call auth.updateUser when activo is not provided', async () => {
      store.set('u1', {
        nombre: 'Ana',
        email: 'ana@riff.cl',
        rol: 'editor',
        activo: true,
        creadoPor: 'sa-1',
        creadoEn: 't',
        actualizadoEn: 't',
      });
      await repo.update('u1', { nombre: 'Ana R' });
      expect(fakeAuth.updateUser).not.toHaveBeenCalled();
    });

    it('updates email and rol when provided', async () => {
      store.set('u1', {
        nombre: 'Ana',
        email: 'ana@riff.cl',
        rol: 'editor',
        activo: true,
        creadoPor: 'sa-1',
        creadoEn: 't',
        actualizadoEn: 't',
      });
      await repo.update('u1', { email: 'nueva@riff.cl', rol: 'admin' });
      expect(store.get('u1')?.email).toBe('nueva@riff.cl');
      expect(store.get('u1')?.rol).toBe('admin');
    });

    it('throws when the user disappears after the update', async () => {
      store.set('u1', {
        nombre: 'Ana',
        email: 'ana@riff.cl',
        rol: 'editor',
        activo: true,
        creadoPor: 'sa-1',
        creadoEn: 't',
        actualizadoEn: 't',
      });
      jest.spyOn(repo, 'findById').mockResolvedValue(null);
      await expect(repo.update('u1', { nombre: 'Ana R' })).rejects.toThrow(
        'User not found after update',
      );
    });
  });

  describe('setRoleClaim', () => {
    it('delegates to auth.setCustomUserClaims', async () => {
      await repo.setRoleClaim('u1', 'admin');
      expect(fakeAuth.setCustomUserClaims).toHaveBeenCalledWith('u1', { rol: 'admin' });
    });
  });
});
