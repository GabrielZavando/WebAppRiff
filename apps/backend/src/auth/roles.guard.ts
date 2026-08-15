import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

interface RoleRequest {
  user?: { role?: string };
}

/**
 * Autorización por roles leyendo el custom claim `role` del `request.user`
 * (poblado por `FirebaseAuthGuard`). 403 si el rol no está entre los permitidos.
 * Se ejecuta DESPUÉS del auth guard. Si no hay metadata de roles, no restringe
 * (ruta pública protegida solo por auth).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RoleRequest>();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Insufficient role');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
