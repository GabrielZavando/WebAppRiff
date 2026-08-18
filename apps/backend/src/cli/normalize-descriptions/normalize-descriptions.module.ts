import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from '@/infrastructure/firebase/firebase.module';
import { FirestoreModule } from '@/infrastructure/firebase/firestore.module';
import { ProductosModule } from '@/productos/productos.module';
import { NormalizeDescriptionsUseCase } from './normalize-descriptions.use-case';

/**
 * Módulo de contexto para el comando CLI de normalización de descripciones.
 * Reutiliza los proveedores exportados por `ProductosModule` (repositorios de
 * lectura/escritura y el sanitizador de HTML) sin levantar HTTP. `FirebaseModule`
 * y `FirestoreModule` son `@Global` pero deben importarse al menos una vez para
 * registrarse en el contexto del CLI (igual que `SeedProductosModule`).
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FirebaseModule,
    FirestoreModule,
    ProductosModule,
  ],
  providers: [NormalizeDescriptionsUseCase],
  exports: [NormalizeDescriptionsUseCase],
})
export class NormalizeDescriptionsModule {}
