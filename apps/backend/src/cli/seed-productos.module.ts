import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from '../infrastructure/firebase/firebase.module';
import { FirestoreModule } from '../infrastructure/firebase/firestore.module';
import { CategoriasModule } from '../categorias/categorias.module';
import { SubcategoriasModule } from '../subcategorias/subcategorias.module';
import { ProductosModule } from '../productos/productos.module';
import { ProductoConsistencyService } from '../productos/application/producto-consistency.service';
import { SeedProductosUseCase } from './seed/seed-productos.use-case';
import { EnsureSeedSubcategorias } from './seed/ensure-seed-subcategorias';

/**
 * Módulo de contexto para el comando CLI de seed de productos. Reúne la
 * configuración y los módulos globales de Firebase con `ProductosModule`,
 * `CategoriasModule` y `SubcategoriasModule` para resolver `SeedProductosUseCase`
 * y `EnsureSeedSubcategorias` sin levantar HTTP.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FirebaseModule,
    FirestoreModule,
    CategoriasModule,
    SubcategoriasModule,
    ProductosModule,
  ],
  providers: [SeedProductosUseCase, EnsureSeedSubcategorias, ProductoConsistencyService],
  exports: [SeedProductosUseCase, EnsureSeedSubcategorias],
})
export class SeedProductosModule {}
