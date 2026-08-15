export interface BootstrapSuperadminConfig {
  email: string;
  password: string;
  nombre: string;
}

type EnvSource = Record<string, string | undefined>;

const MIN_PASSWORD_LENGTH = 6;

/**
 * Lee y valida la configuración del superadmin inicial desde las variables de
 * entorno. Es una función pura y testeable, separada del wiring de Nest para
 * poder cubrirla sin levantar Firebase. El bootstrap es operativo: la password
 * vive en el entorno del deploy y nunca se loguea.
 */
export function loadBootstrapConfig(env: EnvSource): BootstrapSuperadminConfig {
  const email = env['BOOTSTRAP_SUPERADMIN_EMAIL'];
  const password = env['BOOTSTRAP_SUPERADMIN_PASSWORD'];
  const name = env['BOOTSTRAP_SUPERADMIN_NAME'];

  if (!email || email.trim() === '') {
    throw new Error(
      'BOOTSTRAP_SUPERADMIN_EMAIL is required to bootstrap the first superadmin',
    );
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      'BOOTSTRAP_SUPERADMIN_PASSWORD is required and must be at least 6 characters',
    );
  }

  const nombre = (name && name.trim()) || email.split('@')[0];

  return { email: email.trim(), password, nombre };
}
