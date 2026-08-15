import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { BootstrapModule } from './bootstrap.module';
import { BootstrapSuperadminUseCase } from '../usuarios/application/bootstrap-superadmin.use-case';
import { loadBootstrapConfig } from '../usuarios/application/bootstrap-config';

/**
 * Comando operativo para crear el primer `superadmin` (problema del huevo y la
 * gallina: no existe ninguno que se autentique para usar POST /users).
 *
 * Uso:
 *   BOOTSTRAP_SUPERADMIN_EMAIL=admin@riff.cl \
 *   BOOTSTRAP_SUPERADMIN_PASSWORD='secret123' \
 *   npm run bootstrap:superadmin
 *
 * Es idempotente: re-ejecutarlo con el mismo email no crea duplicados.
 */
async function bootstrap(): Promise<void> {
  const config = loadBootstrapConfig(process.env);
  const app = await NestFactory.createApplicationContext(BootstrapModule);

  try {
    const useCase = app.get(BootstrapSuperadminUseCase);
    const user = await useCase.execute(config);
    Logger.log(
      `Superadmin bootstrapped: ${user.email} (uid=${user.id}, rol=${user.rol})`,
      'Bootstrap',
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((error: unknown) => {
  // La password no se loguea nunca.
  // eslint-disable-next-line no-console
  console.error('Bootstrap failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
