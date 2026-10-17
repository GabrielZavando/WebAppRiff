import { UsuarioRol } from '../auth/auth.models';

/**
 * Type mirrors of the backend usuarios entities (task 4.1 / design D3, D8).
 * Deliberate per-workspace duplication (same practice as
 * `features/catalog/models`): the shapes are pinned by `models.test.ts` and
 * `npm run typecheck`, so a backend drift breaks here first.
 *
 * `estado` is derived server-side from Firebase Auth `lastSignInTime`
 * ('invitado' until the first sign-in) — see change admin-panel-operations,
 * design D8. There is no password field anywhere: users are created through
 * the invitation flow and define their own password from the email Firebase
 * sends (design D3).
 */
export type UsuarioEstado = 'invitado' | 'activo';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: UsuarioRol;
  activo: boolean;
  estado: UsuarioEstado;
  creadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface UsuarioCreatePayload {
  nombre: string;
  email: string;
  rol: Extract<UsuarioRol, 'admin' | 'editor'>;
}

export interface UsuarioUpdatePayload {
  nombre?: string;
  email?: string;
  rol?: UsuarioRol;
  activo?: boolean;
}
