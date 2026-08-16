import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeedProductosModule } from './seed-productos.module';
import { SeedProductosUseCase } from './seed/seed-productos.use-case';
import { EnsureSeedSubcategorias, MEDIDORES_DE_NIVEL_ID } from './seed/ensure-seed-subcategorias';
import { loadProductoSeed } from './seed/producto-seed.loader';

/**
 * Comando operativo idempotente para poblar la colección `productos` desde el
 * archivo seed (por defecto en la raíz del monorepo).
 *
 * Uso:
 *   npm run seed:productos
 *   SEED_FILE_PATH=/ruta/seed.json npm run seed:productos
 *
 * Idempotente: si un documento ya existe (por su id determinista `prod-001`..)
 * se omite, nunca se sobrescribe ni se duplica. Como paso previo, asegura la
 * existencia de la subcategoría `Medidores de Nivel`.
 */
async function seed(): Promise<void> {
  // Cargar y validar el seed antes de arrancar Nest para fallar rápido si el
  // archivo está mal formado, sin inicializar Firebase innecesariamente.
  const productoSeed = loadProductoSeed(process.env.SEED_FILE_PATH);
  const app = await NestFactory.createApplicationContext(SeedProductosModule);

  try {
    const ensure = app.get(EnsureSeedSubcategorias);
    await ensure.ensureMedidoresDeNivel();

    const useCase = app.get(SeedProductosUseCase);
    const result = await useCase.execute(productoSeed);
    Logger.log(
      `Products seeded: ${result.productosCreados} created, ` +
        `${result.productosOmitidos} omitted. ` +
        `Ensured subcategory "${MEDIDORES_DE_NIVEL_ID}".`,
      'SeedProductos',
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
