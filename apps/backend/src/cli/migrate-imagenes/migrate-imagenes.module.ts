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
  REBUILD_NOTIFIER_PORT,
  SEED_IMAGE_MAP_LOADER,
  URL_ACCESSIBILITY_PORT,
} from './ports';
import { WordPressImageSource } from './wordpress-image-source.adapter';
import { FirebaseStorageUploader } from './firebase-storage-uploader.adapter';
import { UrlAccessibilityHttpAdapter } from './url-accessibility.adapter';
import { RebuildNotifierHttpAdapter } from './rebuild-notifier.adapter';
import { SeedImageMapLoaderImpl } from './seed-image-map.loader';
import { MigrateProductosImagenesUseCase } from './migrate-imagenes.use-case';

/**
 * Variables requeridas por el comando de migración de imágenes (R5 / SC-006).
 * Se validan en el bootstrap, antes de cualquier escritura a Firestore/Storage.
 * Las credenciales Firebase se resuelven vía Application Default Credentials
 * (ADC: service account de runtime en Cloud Run, o `gcloud`/GOOGLE_APPLICATION
 * _CREDENTIALS en local), por lo que no se validan como variables discretas.
 * `CATALOG_REBUILD_WEBHOOK_URL` es best-effort (R4): un hueco no aborta, se
 * reporta como rebuild manual, así que NO pertenece a esta lista.
 */
export const REQUIRED_MIGRATION_CONFIG: ReadonlyArray<string> = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
];

/**
 * Fail-fast de configuración (R5 / SC-006): verifica que toda la configuración
 * requerida esté presente y aborta con un único mensaje explícito enumerando
 * las variables faltantes (sin secretos). Debe ejecutarse antes de que el caso
 * de uso pueda escribir: como `resolveImageStorageUploader` es el factory que
 * construye el puerto de Storage en el bootstrap, lanzar aquí impide cualquier
 * subida/escritura posterior.
 */
export function assertRequiredConfig(config: ConfigService): void {
  const missing = REQUIRED_MIGRATION_CONFIG.filter((key) => !config.get<string>(key));
  if (missing.length === 0) {
    return;
  }
  throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
}

/**
 * Resuelve el `FirebaseStorageUploader` a partir de la app de Firebase y el
 * nombre de bucket explícito. Fail-fast si falta cualquier configuración
 * requerida (R5): valida el conjunto completo antes de tocar Storage. El admin
 * app no tiene bucket por defecto, así que `bucket()` sin argumento lanzaría
 * "Bucket name not specified"; aquí se previene con un mensaje explícito.
 */
export function resolveImageStorageUploader(app: App, config: ConfigService): FirebaseStorageUploader {
  assertRequiredConfig(config);
  // `assertRequiredConfig` ya ha garantizado que el bucket está presente.
  const bucketName = config.get<string>('FIREBASE_STORAGE_BUCKET')!;
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
    { provide: URL_ACCESSIBILITY_PORT, useClass: UrlAccessibilityHttpAdapter },
    { provide: REBUILD_NOTIFIER_PORT, useClass: RebuildNotifierHttpAdapter },
    MigrateProductosImagenesUseCase,
  ],
  exports: [MigrateProductosImagenesUseCase],
})
export class MigrateImagenesModule {}
