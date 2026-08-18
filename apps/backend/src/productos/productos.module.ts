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
import { HtmlSanitizerService } from './infrastructure/html-sanitizer.service';
import {
  I_PRODUCT_INTEGRITY_REPOSITORY,
  I_PRODUCT_QUERY_REPOSITORY,
  I_PRODUCT_REPOSITORY,
} from './domain/iproducto.repository';
import { I_HTML_SANITIZER } from './domain/ihtml-sanitizer';

@Module({
  imports: [AuthModule, FirebaseModule, CategoriasModule, SubcategoriasModule],
  controllers: [ProductoController],
  providers: [
    ProductoConsistencyService,
    ProductoReadService,
    ProductoWriteService,
    HtmlSanitizerService,
    { provide: I_PRODUCT_REPOSITORY, useClass: ProductoRepository },
    { provide: I_PRODUCT_QUERY_REPOSITORY, useClass: ProductoRepository },
    { provide: I_PRODUCT_INTEGRITY_REPOSITORY, useClass: ProductoIntegrityRepository },
    { provide: I_HTML_SANITIZER, useClass: HtmlSanitizerService },
  ],
  exports: [
    I_PRODUCT_REPOSITORY,
    I_PRODUCT_QUERY_REPOSITORY,
    I_PRODUCT_INTEGRITY_REPOSITORY,
    I_HTML_SANITIZER,
  ],
})
export class ProductosModule {}
