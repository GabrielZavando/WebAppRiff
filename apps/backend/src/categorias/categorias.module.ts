import { Module, OnModuleInit } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { AuthModule } from '../auth/auth.module';
import { FirebaseModule } from '../infrastructure/firebase/firebase.module';
import { CategoriaController } from './infrastructure/categoria.controller';
import { CategoriaService } from './application/categoria.service';
import { CategoriaRepository } from './infrastructure/categoria.repository';
import {
  I_CATEGORIA_INTEGRITY_REPOSITORY,
  I_CATEGORIA_REPOSITORY,
} from './domain/icategoria.repository';
import { I_CATALOG_CHANGE_NOTIFIER } from '../catalog/domain/icatalog-change-notifier';
import { I_CATALOG_REBUILD_STATE_STORE } from '../catalog/domain/icatalog-rebuild-state-store';
import { I_CATALOG_REBUILD_WEBHOOK_CLIENT } from '../catalog/domain/icatalog-rebuild-webhook-client';
import {
  buildCatalogRebuildConfig,
  CATALOG_REBUILD_CONFIG,
} from '../catalog/application/catalog-rebuild.config';
import { CatalogRebuildFlushService } from '../catalog/application/catalog-rebuild-flush.service';
import { FirestoreBufferedCatalogChangeNotifier } from '../catalog/infrastructure/firestore-buffered-catalog-change-notifier';
import { FirestoreRebuildStateStore } from '../catalog/infrastructure/firestore-rebuild-state.store';
import { CoolifyRebuildWebhookClient } from '../catalog/infrastructure/coolify-rebuild-webhook.client';
import {
  GOOGLE_OAUTH2_CLIENT,
  SchedulerOidcGuard,
} from '../catalog/infrastructure/scheduler-oidc.guard';
import { CatalogRebuildFlushController } from '../catalog/infrastructure/catalog-rebuild-flush.controller';

@Module({
  imports: [AuthModule, FirebaseModule],
  controllers: [CategoriaController, CatalogRebuildFlushController],
  providers: [
    CategoriaService,
    { provide: I_CATEGORIA_REPOSITORY, useClass: CategoriaRepository },
    { provide: I_CATEGORIA_INTEGRITY_REPOSITORY, useClass: CategoriaRepository },
    { provide: I_CATALOG_CHANGE_NOTIFIER, useClass: FirestoreBufferedCatalogChangeNotifier },
    { provide: I_CATALOG_REBUILD_STATE_STORE, useClass: FirestoreRebuildStateStore },
    { provide: I_CATALOG_REBUILD_WEBHOOK_CLIENT, useClass: CoolifyRebuildWebhookClient },
    {
      provide: CATALOG_REBUILD_CONFIG,
      useFactory: () => buildCatalogRebuildConfig(process.env),
    },
    { provide: GOOGLE_OAUTH2_CLIENT, useFactory: () => new OAuth2Client() },
    CatalogRebuildFlushService,
    SchedulerOidcGuard,
  ],
  exports: [
    I_CATEGORIA_REPOSITORY,
    I_CATEGORIA_INTEGRITY_REPOSITORY,
    I_CATALOG_CHANGE_NOTIFIER,
  ],
})
export class CategoriasModule implements OnModuleInit {
  constructor(private readonly service: CategoriaService) {}

  async onModuleInit(): Promise<void> {
    await this.service.ensureDefault();
  }
}
