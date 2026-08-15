import { Inject, Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FIRESTORE, FIREBASE_APP } from '../../infrastructure/firebase/firebase.tokens';
import {
  CreateUsuarioInput,
  IUsuarioRepository,
  UpdateUsuarioInput,
} from '../domain/iusuario.repository';
import { Usuario, UsuarioRol } from '../domain/usuario.entity';

/**
 * Persistencia de usuarios: Firebase Auth (identidad + custom claim `rol`) como
 * fuente de verdad de auth, y Firestore (`usuarios`) como store de atributos de
 * negocio. El id del documento es el Firebase UID (inmutable, técnico).
 */
@Injectable()
export class UsuarioRepository implements IUsuarioRepository {
  private readonly collection = 'usuarios';

  constructor(
    @Inject(FIRESTORE) private readonly firestore: Firestore,
    @Inject(FIREBASE_APP) private readonly app: App,
  ) {}

  async create(input: CreateUsuarioInput): Promise<Usuario> {
    const auth = getAuth(this.app);
    const createParams: { email: string; disabled: boolean; password?: string } = {
      email: input.email,
      disabled: false,
    };
    if (input.password) {
      createParams.password = input.password;
    }

    const userRecord = await auth.createUser(createParams);
    await auth.setCustomUserClaims(userRecord.uid, { rol: input.rol });

    const now = new Date();
    const doc: Omit<Usuario, 'id'> = {
      nombre: input.nombre,
      email: input.email,
      rol: input.rol,
      activo: true,
      creadoPor: input.creadoPor,
      creadoEn: now,
      actualizadoEn: now,
    };
    await this.firestore
      .collection(this.collection)
      .doc(userRecord.uid)
      .set(doc);

    return { id: userRecord.uid, ...doc };
  }

  async findAll(): Promise<Usuario[]> {
    const snapshot = await this.firestore.collection(this.collection).get();
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Usuario, 'id'>) }));
  }

  async findById(id: string): Promise<Usuario | null> {
    const snap = await this.firestore.collection(this.collection).doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...(snap.data() as Omit<Usuario, 'id'>) };
  }

  async update(id: string, input: UpdateUsuarioInput): Promise<Usuario> {
    const updateData: Record<string, unknown> = {
      actualizadoEn: new Date(),
    };
    if (input.nombre !== undefined) updateData.nombre = input.nombre;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.rol !== undefined) updateData.rol = input.rol;
    if (input.activo !== undefined) updateData.activo = input.activo;

    await this.firestore
      .collection(this.collection)
      .doc(id)
      .update(updateData);

    if (input.activo !== undefined) {
      await getAuth(this.app).updateUser(id, { disabled: input.activo === false });
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('User not found after update');
    }
    return updated;
  }

  async setRoleClaim(id: string, rol: UsuarioRol): Promise<void> {
    await getAuth(this.app).setCustomUserClaims(id, { rol });
  }
}
