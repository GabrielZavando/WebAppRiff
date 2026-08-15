import { Controller, Get, NotFoundException, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { IUsuarioRepository, I_USUARIO_REPOSITORY } from '../domain/iusuario.repository';
import { Usuario } from '../domain/usuario.entity';
import { Inject } from '@nestjs/common';

interface AuthedRequest {
  user?: { uid?: string };
}

/**
 * Perfil del usuario autenticado. Solo FirebaseAuthGuard (cualquier rol autenticado);
 * lee el `uid` del token verificado y devuelve el documento `usuarios/{uid}`.
 * El interceptor global envuelve la respuesta en `{ data, error, meta }`.
 */
@Controller('auth')
@UseGuards(FirebaseAuthGuard)
export class AuthController {
  constructor(
    @Inject(I_USUARIO_REPOSITORY) private readonly repository: IUsuarioRepository,
  ) {}

  @Get('me')
  async me(@Req() req: AuthedRequest): Promise<Usuario> {
    const uid = req.user?.uid;
    if (!uid) {
      throw new UnauthorizedException('Missing user in request');
    }

    const user = await this.repository.findById(uid);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    return user;
  }
}
