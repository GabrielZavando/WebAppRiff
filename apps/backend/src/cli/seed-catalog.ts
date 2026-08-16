import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeedCatalogModule } from './seed-catalog.module';
import { SeedCatalogUseCase } from './seed/seed-catalog.use-case';
import { loadCatalogSeed } from './seed/catalog-seed.loader';

/**
 * Comando operativo idempotente para poblar las colecciones `categorias` y
 * `subcategorias` desde el archivo seed (por defecto en la raíz del monorepo).
 *
 * Uso:
 *   npm run seed:catalog
 *   SEED_FILE_PATH=/ruta/seed.json npm run seed:catalog
 *
 * Idempotente: si un documento ya existe (por su id determinista) se omite,
 * nunca se sobrescribe ni se duplica.
 */
async function seed(): Promise<void> {
  // Cargar y validar el seed antes de arrancar Nest para fallar rápido si el
  // archivo está mal formado, sin inicializar Firebase innecesariamente.
  const catalogSeed = loadCatalogSeed(process.env.SEED_FILE_PATH);
  const app = await NestFactory.createApplicationContext(SeedCatalogModule);

  try {
    const useCase = app.get(SeedCatalogUseCase);
    const result = await useCase.execute(catalogSeed);
    Logger.log(
      `Catalog seeded: ${result.categoriasCreadas} categories created, ` +
        `${result.categoriasOmitidas} omitted; ` +
        `${result.subcategoriasCreadas} subcategories created, ` +
        `${result.subcategoriasOmitidas} omitted.`,
      'SeedCatalog',
    );
  } finally {
    await app.close();
  }
}

seed().catch((error: unknown) => {
  // No exponer secrets (credenciales Firebase) en el log.
  // eslint-disable-next-line no-console
  console.error('Seed failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
