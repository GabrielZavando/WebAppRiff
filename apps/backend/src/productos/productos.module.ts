import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FirebaseModule } from '../infrastructure/firebase/firebase.module';
import { CategoriasModule } from '../categorias/categorias.module';
import { SubcategoriasModule } from '../subcategorias/subcategorias.module';
import { ProductoController } from './infrastructure/producto.controller';
import { ProductoConsistencyService } from './application/producto-consistency.service';
import { ProductoReadService } from './application/producto-read.service';
import { ProductoWriteService } from './application/producto-write.service';
import { ProductoRepository } from './infrastructure/producto.repository';
import { ProductoIntegrityRepository } from './infrastructure/producto-integrity.repository';
import {
  I_PRODUCT_INTEGRITY_REPOSITORY,
  I_PRODUCT_QUERY_REPOSITORY,
  I_PRODUCT_REPOSITORY,
} from './domain/iproducto.repository';

@Module({
  imports: [AuthModule, FirebaseModule, CategoriasModule, SubcategoriasModule],
  controllers: [ProductoController],
  providers: [
    ProductoConsistencyService,
    ProductoReadService,
    ProductoWriteService,
    { provide: I_PRODUCT_REPOSITORY, useClass: ProductoRepository },
    { provide: I_PRODUCT_QUERY_REPOSITORY, useClass: ProductoRepository },
    { provide: I_PRODUCT_INTEGRITY_REPOSITORY, useClass: ProductoIntegrityRepository },
  ],
  exports: [
    I_PRODUCT_REPOSITORY,
    I_PRODUCT_QUERY_REPOSITORY,
    I_PRODUCT_INTEGRITY_REPOSITORY,
  ],
})
export class ProductosModule {}
