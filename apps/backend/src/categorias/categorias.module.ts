import { Module, OnModuleInit } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FirebaseModule } from '../infrastructure/firebase/firebase.module';
import { CategoriaController } from './infrastructure/categoria.controller';
import { CategoriaService } from './application/categoria.service';
import { CategoriaRepository } from './infrastructure/categoria.repository';
import {
  I_CATEGORIA_INTEGRITY_REPOSITORY,
  I_CATEGORIA_REPOSITORY,
} from './domain/icategoria.repository';
import { I_CATEGORY_CHANGE_NOTIFIER } from './domain/icategory-change-notifier';
import { WebhookCategoryChangeNotifier } from './infrastructure/webhook-category-change-notifier';

@Module({
  imports: [AuthModule, FirebaseModule],
  controllers: [CategoriaController],
  providers: [
    CategoriaService,
    { provide: I_CATEGORIA_REPOSITORY, useClass: CategoriaRepository },
    { provide: I_CATEGORIA_INTEGRITY_REPOSITORY, useClass: CategoriaRepository },
    { provide: I_CATEGORY_CHANGE_NOTIFIER, useClass: WebhookCategoryChangeNotifier },
  ],
  exports: [I_CATEGORIA_REPOSITORY, I_CATEGORIA_INTEGRITY_REPOSITORY],
})
export class CategoriasModule implements OnModuleInit {
  constructor(private readonly service: CategoriaService) {}

  async onModuleInit(): Promise<void> {
    await this.service.ensureDefault();
  }
}
