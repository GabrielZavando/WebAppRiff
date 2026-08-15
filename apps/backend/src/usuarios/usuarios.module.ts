import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FirebaseModule } from '../infrastructure/firebase/firebase.module';
import { UsuarioController } from './infrastructure/usuario.controller';
import { UsuarioService } from './application/usuario.service';
import { UsuarioRepository } from './infrastructure/usuario.repository';
import { I_USUARIO_REPOSITORY } from './domain/iusuario.repository';

@Module({
  imports: [AuthModule, FirebaseModule],
  controllers: [UsuarioController],
  providers: [UsuarioService, { provide: I_USUARIO_REPOSITORY, useClass: UsuarioRepository }],
  exports: [UsuarioService],
})
export class UsuariosModule {}
