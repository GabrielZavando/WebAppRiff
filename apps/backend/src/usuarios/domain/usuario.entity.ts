export type UsuarioRol = 'superadmin' | 'admin' | 'editor';

/**
 * Derived account state (never persisted in Firestore): 'invitado' until the
 * user signs in for the first time (Firebase Auth `lastSignInTime` is null),
 * 'activo' afterwards. Computed by the repository when reading users.
 */
export type UsuarioEstado = 'invitado' | 'activo';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: UsuarioRol;
  activo: boolean;
  creadoPor: string;
  creadoEn: Date;
  actualizadoEn: Date;
  estado?: UsuarioEstado;
}
