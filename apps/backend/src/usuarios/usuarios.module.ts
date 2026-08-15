import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FirebaseModule } from '../infrastructure/firebase/firebase.module';
import { UsuarioController } from './infrastructure/usuario.controller';
import { AuthController } from './infrastructure/auth.controller';
import { UsuarioService } from './application/usuario.service';
import { BootstrapSuperadminUseCase } from './application/bootstrap-superadmin.use-case';
import { UsuarioRepository } from './infrastructure/usuario.repository';
import { I_USUARIO_REPOSITORY } from './domain/iusuario.repository';

@Module({
  imports: [AuthModule, FirebaseModule],
  controllers: [UsuarioController, AuthController],
  providers: [
    UsuarioService,
    BootstrapSuperadminUseCase,
    { provide: I_USUARIO_REPOSITORY, useClass: UsuarioRepository },
  ],
  exports: [UsuarioService],
})
export class UsuariosModule {}
