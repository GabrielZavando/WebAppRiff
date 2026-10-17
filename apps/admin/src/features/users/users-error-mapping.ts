import { ApiError } from '../../shared/api/api-client.service';

/**
 * Backend → UI error mapping for the users domain (design D11). Backend
 * messages are stable (NestJS `usuario.service.ts` + guards); they are
 * translated to Spanish copy. Unknown 403s fall back to a generic permission
 * banner so raw English never leaks to the UI.
 */

/** Shown when an action fails without a specific mapping. */
export const genericErrorMessage = 'No se pudo completar la operación. Inténtalo nuevamente.';

/** Shown when the users list fails to load. */
export const userListLoadErrorMessage = 'No se pudo cargar el listado de usuarios.';

/** Maps an update/deactivation failure to a Spanish banner message. */
export function userActionErrorMessage(error: ApiError): string {
  switch (error.message) {
    case 'Cannot leave the system without an active superadmin':
      return 'No se puede dejar el sistema sin un superadmin activo.';
    case 'Only superadmin can change roles':
      return 'Solo un superadmin puede cambiar roles.';
    case 'Admin cannot deactivate an admin':
      return 'No puedes desactivar a un administrador.';
    case 'Insufficient role':
    case 'Insufficient permissions to update users':
    case 'Insufficient permissions to read users':
    case 'Insufficient permissions to create this role':
      return 'No tienes permisos para esta acción.';
    default:
      if (error.status === 403) {
        return 'No tienes permisos para esta acción.';
      }
      return error.message !== '' ? error.message : genericErrorMessage;
  }
}
