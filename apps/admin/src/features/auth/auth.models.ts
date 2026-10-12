/** Roles supported by the backend RBAC (see `backend-usuarios` spec). */
export type UsuarioRol = 'editor' | 'admin' | 'superadmin';

/** Admin user profile as returned by `GET /api/v1/auth/me`. */
export interface AdminUserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: UsuarioRol;
  activo: boolean;
}
