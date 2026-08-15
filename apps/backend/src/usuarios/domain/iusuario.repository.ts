import { Usuario, UsuarioRol } from './usuario.entity';

export interface CreateUsuarioInput {
  nombre: string;
  email: string;
  rol: UsuarioRol;
  password?: string;
  creadoPor: string;
}

export interface UpdateUsuarioInput {
  nombre?: string;
  email?: string;
  rol?: UsuarioRol;
  activo?: boolean;
}

export const I_USUARIO_REPOSITORY = 'IUsuarioRepository';

/**
 * Puerto de persistencia para usuarios (Firestore + Firebase Auth).
 * No debe exceder 5 métodos (ISP). El service usa `findAll` para validar la
 * regla de "nunca sin superadmin activo" sin necesitar una query extra.
 */
export interface IUsuarioRepository {
  create(input: CreateUsuarioInput): Promise<Usuario>;
  findAll(): Promise<Usuario[]>;
  findById(id: string): Promise<Usuario | null>;
  update(id: string, input: UpdateUsuarioInput): Promise<Usuario>;
  setRoleClaim(uid: string, rol: UsuarioRol): Promise<void>;
}
