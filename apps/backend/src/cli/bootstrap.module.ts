import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from '../infrastructure/firebase/firebase.module';
import { FirestoreModule } from '../infrastructure/firebase/firestore.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

/**
 * Módulo de contexto para el comando CLI de bootstrap. Reúne la configuración y
 * los módulos globales de Firebase con `UsuariosModule` para poder resolver
 * `BootstrapSuperadminUseCase` sin levantar el servidor HTTP.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FirebaseModule,
    FirestoreModule,
    UsuariosModule,
  ],
})
export class BootstrapModule {}
