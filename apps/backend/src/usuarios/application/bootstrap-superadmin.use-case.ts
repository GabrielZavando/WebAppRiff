import { Inject, Injectable } from '@nestjs/common';
import type { Auth } from 'firebase-admin/auth';
import { IUsuarioRepository, I_USUARIO_REPOSITORY } from '../domain/iusuario.repository';
import { Usuario } from '../domain/usuario.entity';
import { FIREBASE_AUTH } from '../../infrastructure/firebase/firebase.tokens';

export interface BootstrapSuperadminInput {
  email: string;
  password: string;
  nombre: string;
}

const SYSTEM_CREATOR = 'system';
const EMAIL_ALREADY_EXISTS = 'auth/email-already-exists';

/**
 * Crea el primer `superadmin` sin actor autenticado (no existe ninguno todavía,
 * por lo que no puede pasar por `UsuarioService`). Reusa `IUsuarioRepository.create`
 * (Firebase Auth + custom claim `role` + Firestore) y es idempotente: si ya existe
 * un usuario con ese email, lo devuelve sin recrearlo; si el Auth user existe pero
 * el doc no (estado partido), repara el claim y el documento.
 */
@Injectable()
export class BootstrapSuperadminUseCase {
  constructor(
    @Inject(I_USUARIO_REPOSITORY) private readonly repository: IUsuarioRepository,
    @Inject(FIREBASE_AUTH) private readonly auth: Auth,
  ) {}

  async execute(input: BootstrapSuperadminInput): Promise<Usuario> {
    const existing = await this.findExistingByEmail(input.email);
    if (existing) {
      return existing;
    }

    try {
      return await this.repository.create({
        nombre: input.nombre,
        email: input.email,
        rol: 'superadmin',
        password: input.password,
        creadoPor: SYSTEM_CREATOR,
      });
    } catch (error) {
      if (this.isEmailAlreadyExists(error)) {
        return this.repairExisting(input.email);
      }
      throw error;
    }
  }

  private async findExistingByEmail(email: string): Promise<Usuario | null> {
    const all = await this.repository.findAll();
    const normalized = email.trim().toLowerCase();
    return (
      all.find((u) => u.email.trim().toLowerCase() === normalized) ?? null
    );
  }

  private isEmailAlreadyExists(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === EMAIL_ALREADY_EXISTS
    );
  }

  private async repairExisting(email: string): Promise<Usuario> {
    const userRecord = await this.auth.getUserByEmail(email);
    await this.repository.setRoleClaim(userRecord.uid, 'superadmin');
    return this.repository.update(userRecord.uid, {
      nombre: email.split('@')[0],
      email,
      rol: 'superadmin',
      activo: true,
    });
  }
}
