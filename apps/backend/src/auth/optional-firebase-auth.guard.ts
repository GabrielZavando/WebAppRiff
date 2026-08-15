import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Auth, DecodedIdToken } from 'firebase-admin/auth';
import { FIREBASE_AUTH } from '../infrastructure/firebase/firebase.tokens';

interface AuthRequest {
  headers?: { authorization?: string };
  user?: DecodedIdToken;
}

/**
 * Guard opcional: si hay un Bearer token válido, lo verifica y puebla
 * `request.user` (como `FirebaseAuthGuard`); si no hay token o es inválido,
 * simplemente permite el acceso como anónimo (NO lanza 401). Se usa en los
 * endpoints públicos de lectura de productos para que un usuario autenticado
 * pueda ver también los no publicados.
 */
@Injectable()
export class OptionalFirebaseAuthGuard implements CanActivate {
  constructor(@Inject(FIREBASE_AUTH) private readonly auth: Auth) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const header = request.headers?.authorization;
    if (!header) {
      return true;
    }
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return true;
    }
    try {
      const decoded = await this.auth.verifyIdToken(token);
      request.user = decoded;
    } catch {
      // invalid token -> treat as anonymous
    }
    return true;
  }
}
