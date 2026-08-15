import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Declara los roles permitidos en un handler/controller. El `RolesGuard` lee este
 * metadata con `Reflector` y compara con el claim `role` del token verificado.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
