import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FirebaseModule } from '../infrastructure/firebase/firebase.module';
import { CategoriasModule } from '../categorias/categorias.module';
import { SubcategoriaController } from './infrastructure/subcategoria.controller';
import { SubcategoriaService } from './application/subcategoria.service';
import { SubcategoriaRepository } from './infrastructure/subcategoria.repository';
import {
  I_SUBCATEGORIA_INTEGRITY_REPOSITORY,
  I_SUBCATEGORIA_REPOSITORY,
} from './domain/isubcategoria.repository';

@Module({
  imports: [AuthModule, FirebaseModule, CategoriasModule],
  controllers: [SubcategoriaController],
  providers: [
    SubcategoriaService,
    { provide: I_SUBCATEGORIA_REPOSITORY, useClass: SubcategoriaRepository },
    { provide: I_SUBCATEGORIA_INTEGRITY_REPOSITORY, useClass: SubcategoriaRepository },
  ],
  exports: [I_SUBCATEGORIA_REPOSITORY, I_SUBCATEGORIA_INTEGRITY_REPOSITORY],
})
export class SubcategoriasModule {}
