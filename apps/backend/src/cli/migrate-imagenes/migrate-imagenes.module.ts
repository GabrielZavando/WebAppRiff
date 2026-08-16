import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FirebaseModule } from '../../infrastructure/firebase/firebase.module';
import { FirestoreModule } from '../../infrastructure/firebase/firestore.module';
import { FIREBASE_APP } from '../../infrastructure/firebase/firebase.tokens';
import { App } from 'firebase-admin/app';
import { ProductosModule } from '../../productos/productos.module';
import {
  IMAGE_SOURCE_PORT,
  IMAGE_STORAGE_PORT,
  SEED_IMAGE_MAP_LOADER,
} from './ports';
import { WordPressImageSource } from './wordpress-image-source.adapter';
import { FirebaseStorageUploader } from './firebase-storage-uploader.adapter';
import { SeedImageMapLoaderImpl } from './seed-image-map.loader';
import { MigrateProductosImagenesUseCase } from './migrate-imagenes.use-case';

/**
 * Resuelve el `FirebaseStorageUploader` a partir de la app de Firebase y el
 * nombre de bucket explícito. Fail-fast si `FIREBASE_STORAGE_BUCKET` no está
 * configurado: el admin app no tiene bucket por defecto, así que `bucket()` sin
 * argumento lanza "Bucket name not specified".
 */
export function resolveImageStorageUploader(app: App, config: ConfigService): FirebaseStorageUploader {
  const bucketName = config.get<string>('FIREBASE_STORAGE_BUCKET');
  if (!bucketName) {
    throw new Error('Missing required environment variable: FIREBASE_STORAGE_BUCKET');
  }
  return FirebaseStorageUploader.fromApp(app, bucketName);
}

/**
 * Módulo de contexto para el comando CLI de migración de imágenes. Reúne la
 * configuración y los módulos de Firebase con `ProductosModule` (que exporta
 * `I_PRODUCT_REPOSITORY`) y provee los puertos de migración detrás de tokens
 * (DIP). El caso de uso orquesta la lógica; la escritura de `galeria` reusa el
 * repositorio de dominio, sin escrituras crudas a Firestore.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), FirebaseModule, FirestoreModule, ProductosModule],
  providers: [
    { provide: IMAGE_SOURCE_PORT, useClass: WordPressImageSource },
    {
      provide: IMAGE_STORAGE_PORT,
      inject: [FIREBASE_APP, ConfigService],
      useFactory: (app: App, config: ConfigService) => resolveImageStorageUploader(app, config),
    },
    { provide: SEED_IMAGE_MAP_LOADER, useClass: SeedImageMapLoaderImpl },
    MigrateProductosImagenesUseCase,
  ],
  exports: [MigrateProductosImagenesUseCase],
})
export class MigrateImagenesModule {}
