import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from '../infrastructure/firebase/firebase.module';
import { FirestoreModule } from '../infrastructure/firebase/firestore.module';
import { CategoriasModule } from '../categorias/categorias.module';
import { SubcategoriasModule } from '../subcategorias/subcategorias.module';
import { SeedCatalogUseCase } from './seed/seed-catalog.use-case';

/**
 * Módulo de contexto para el comando CLI de seed del catálogo. Reúne la
 * configuración y los módulos globales de Firebase con `CategoriasModule` y
 * `SubcategoriasModule` para resolver `SeedCatalogUseCase` sin levantar HTTP.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FirebaseModule,
    FirestoreModule,
    CategoriasModule,
    SubcategoriasModule,
  ],
  providers: [SeedCatalogUseCase],
  exports: [SeedCatalogUseCase],
})
export class SeedCatalogModule {}
