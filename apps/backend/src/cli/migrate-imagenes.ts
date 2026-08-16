import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { MigrateImagenesModule } from './migrate-imagenes/migrate-imagenes.module';
import { MigrationReport, MigrateProductosImagenesUseCase } from './migrate-imagenes/migrate-imagenes.use-case';

const REPORT_PATH = process.env.MIGRACION_REPORTE_PATH
  ? resolve(process.env.MIGRACION_REPORTE_PATH)
  : resolve(process.cwd(), 'migracion-imagenes-reporte.json');

/**
 * Comando operativo para migrar las imágenes de producto desde el hosting
 * WordPress antiguo hacia Firebase Storage y poblar `galeria`, vinculándolas al
 * producto correspondiente. Uso:
 *   npm run migrate:productos:imagenes
 *   npm run migrate:productos:imagenes -- --dry-run
 *   SEED_FILE_PATH=/ruta/seed.json npm run migrate:productos:imagenes
 *
 * Idempotente y tolerante a fallos: omite productos ya migrados, continúa ante
 * errores por imagen/producto y escribe un reporte JSON. No expone credenciales.
 */
async function migrate(): Promise<void> {
  const app = await NestFactory.createApplicationContext(MigrateImagenesModule);
  try {
    const useCase = app.get(MigrateProductosImagenesUseCase);
    const dryRun = process.argv.includes('--dry-run');
    const report: MigrationReport = await useCase.execute(process.env.SEED_FILE_PATH, { dryRun });

    writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
    Logger.log(
      `Migración de imágenes: ${report.exitosos.length} exitosos, ` +
        `${report.fallidos.length} fallidos, ${report.omitidos.length} omitidos.` +
        (dryRun ? ' (dry-run: sin escrituras)' : ''),
      'MigrateImagenes',
    );
  } finally {
    await app.close();
  }
}

migrate().catch((error: unknown) => {
  // No exponer secretos (credenciales Firebase) en el log.
  // eslint-disable-next-line no-console
  console.error('Migration failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
