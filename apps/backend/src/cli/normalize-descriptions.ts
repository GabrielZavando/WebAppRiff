import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { NormalizeDescriptionsModule } from './normalize-descriptions/normalize-descriptions.module';
import { NormalizeDescriptionsUseCase } from './normalize-descriptions/normalize-descriptions.use-case';

/**
 * Comando operativo para normalizar las descripciones de productos ya
 * persistidas en Firestore (HTML doblemente escapado o con tags sobrantes).
 *
 * Uso:
 *   npm run migrate:descriptions            # escribe los cambios
 *   npm run migrate:descriptions -- --dry-run  # solo reporta, no escribe
 */
async function normalize(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const app = await NestFactory.createApplicationContext(NormalizeDescriptionsModule);

  try {
    const useCase = app.get(NormalizeDescriptionsUseCase);
    const result = await useCase.execute(dryRun);
    Logger.log(
      `Descriptions normalized: ${result.escaneados} scanned, ` +
        `${result.modificados} to change, ${result.escritos} written.` +
        (dryRun ? ' [DRY RUN — no writes performed]' : ''),
      'NormalizeDescriptions',
    );
  } finally {
    await app.close();
  }
}

normalize().catch((error: unknown) => {
  // No exponer secrets (credenciales Firebase) en el log.
  // eslint-disable-next-line no-console
  console.error('Normalize failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
