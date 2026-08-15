import { loadBootstrapConfig } from './bootstrap-config';

describe('loadBootstrapConfig', () => {
  it('returns the config for valid input', () => {
    const config = loadBootstrapConfig({
      BOOTSTRAP_SUPERADMIN_EMAIL: 'admin@riff.cl',
      BOOTSTRAP_SUPERADMIN_PASSWORD: 'secret123',
      BOOTSTRAP_SUPERADMIN_NAME: 'Admin',
    });

    expect(config).toEqual({
      email: 'admin@riff.cl',
      password: 'secret123',
      nombre: 'Admin',
    });
  });

  it('defaults nombre to the email local-part when name is absent', () => {
    const config = loadBootstrapConfig({
      BOOTSTRAP_SUPERADMIN_EMAIL: 'admin@riff.cl',
      BOOTSTRAP_SUPERADMIN_PASSWORD: 'secret123',
    });

    expect(config.nombre).toBe('admin');
  });

  it('throws a descriptive error when the email is missing', () => {
    expect(() =>
      loadBootstrapConfig({ BOOTSTRAP_SUPERADMIN_PASSWORD: 'secret123' }),
    ).toThrow(/BOOTSTRAP_SUPERADMIN_EMAIL/);
  });

  it('throws a descriptive error when the password is missing', () => {
    expect(() =>
      loadBootstrapConfig({ BOOTSTRAP_SUPERADMIN_EMAIL: 'admin@riff.cl' }),
    ).toThrow(/BOOTSTRAP_SUPERADMIN_PASSWORD/);
  });

  it('throws a descriptive error when the password is shorter than 6 characters', () => {
    expect(() =>
      loadBootstrapConfig({
        BOOTSTRAP_SUPERADMIN_EMAIL: 'admin@riff.cl',
        BOOTSTRAP_SUPERADMIN_PASSWORD: '123',
      }),
    ).toThrow(/at least 6/);
  });
});
