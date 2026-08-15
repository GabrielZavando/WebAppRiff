import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Auth, DecodedIdToken } from 'firebase-admin/auth';
import { FIREBASE_AUTH } from '../infrastructure/firebase/firebase.tokens';

interface AuthRequest {
  headers?: { authorization?: string };
  user?: DecodedIdToken;
}

/**
 * Verifica el Firebase ID token en las rutas protegidas. No usa Passport: llama
 * directo a `getAuth().verifyIdToken` (inyectado vía FIREBASE_AUTH) y puebla
 * `request.user` con el token decodificado (incluye el custom claim `role`).
 * 401 si falta el header o el token es inválido/expirado.
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(@Inject(FIREBASE_AUTH) private readonly auth: Auth) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const header = request.headers?.authorization;

    if (!header) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    try {
      const decoded = await this.auth.verifyIdToken(token);
      request.user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
