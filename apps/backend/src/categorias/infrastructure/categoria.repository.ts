import { Inject, Injectable } from '@nestjs/common';
import { Firestore, Query } from 'firebase-admin/firestore';
import { FIRESTORE } from '../../infrastructure/firebase/firebase.tokens';
import {
  CategoriaFilter,
  CategoriaInput,
  ICategoriaIntegrityRepository,
  ICategoriaRepository,
} from '../domain/icategoria.repository';
import { Categoria } from '../domain/categoria.entity';

const COLLECTION = 'categorias';
const PRODUCTS_COLLECTION = 'productos';
const DEFAULT_ID = 'sin-categoria';

@Injectable()
export class CategoriaRepository
  implements ICategoriaRepository, ICategoriaIntegrityRepository
{
  constructor(@Inject(FIRESTORE) private readonly firestore: Firestore) {}

  async create(input: CategoriaInput): Promise<Categoria> {
    const id = input.id ?? this.firestore.collection(COLLECTION).doc().id;
    const now = new Date();
    const doc: Omit<Categoria, 'id'> = {
      nombre: input.nombre,
      slug: input.slug,
      orden: input.orden,
      activa: input.activa,
      esDefault: input.esDefault ?? false,
      creadoEn: now,
      actualizadoEn: now,
    };
    await this.firestore.collection(COLLECTION).doc(id).set(doc);
    return { id, ...doc };
  }

  async findAll(filter?: CategoriaFilter): Promise<Categoria[]> {
    let query: Query = this.firestore.collection(COLLECTION);
    if (filter?.activa !== undefined) {
      query = query.where('activa', '==', filter.activa);
    }
    const snapshot = await query.get();
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Categoria, 'id'>) }));
  }

  async findById(id: string): Promise<Categoria | null> {
    const snap = await this.firestore.collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...(snap.data() as Omit<Categoria, 'id'>) };
  }

  async findBySlug(slug: string): Promise<Categoria | null> {
    const snapshot = await this.firestore
      .collection(COLLECTION)
      .where('slug', '==', slug)
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...(doc.data() as Omit<Categoria, 'id'>) };
  }

  async update(id: string, input: Partial<CategoriaInput>): Promise<Categoria> {
    await this.firestore
      .collection(COLLECTION)
      .doc(id)
      .update({ ...input, actualizadoEn: new Date() });
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Category not found after update');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.firestore.collection(COLLECTION).doc(id).delete();
  }

  async hasAssociatedProducts(id: string): Promise<boolean> {
    const snapshot = await this.firestore
      .collection(PRODUCTS_COLLECTION)
      .where('categoriaId', '==', id)
      .limit(1)
      .get();
    return !snapshot.empty;
  }

  async ensureDefault(): Promise<void> {
    const ref = this.firestore.collection(COLLECTION).doc(DEFAULT_ID);
    const snap = await ref.get();
    if (snap.exists) return;
    const now = new Date();
    await ref.set({
      nombre: 'Sin categoría',
      slug: 'sin-categoria',
      orden: 0,
      activa: true,
      esDefault: true,
      creadoEn: now,
      actualizadoEn: now,
    });
  }
}
