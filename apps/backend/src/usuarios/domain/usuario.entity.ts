export type UsuarioRol = 'superadmin' | 'admin' | 'editor';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: UsuarioRol;
  activo: boolean;
  creadoPor: string;
  creadoEn: Date;
  actualizadoEn: Date;
}
