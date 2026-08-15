import { Inject, Injectable } from '@nestjs/common';
import { Firestore, Query } from 'firebase-admin/firestore';
import { FIRESTORE } from '../../infrastructure/firebase/firebase.tokens';
import {
  ISubcategoriaIntegrityRepository,
  ISubcategoriaRepository,
  SubcategoriaFilter,
  SubcategoriaInput,
} from '../domain/isubcategoria.repository';
import { Subcategoria } from '../domain/subcategoria.entity';

const COLLECTION = 'subcategorias';
const PRODUCTS_COLLECTION = 'productos';

@Injectable()
export class SubcategoriaRepository
  implements ISubcategoriaRepository, ISubcategoriaIntegrityRepository
{
  constructor(@Inject(FIRESTORE) private readonly firestore: Firestore) {}

  async create(input: SubcategoriaInput): Promise<Subcategoria> {
    const id = this.firestore.collection(COLLECTION).doc().id;
    const now = new Date();
    const doc: Omit<Subcategoria, 'id'> = {
      categoriaId: input.categoriaId,
      nombre: input.nombre,
      slug: input.slug,
      orden: input.orden,
      activa: input.activa,
      creadoEn: now,
      actualizadoEn: now,
    };
    await this.firestore.collection(COLLECTION).doc(id).set(doc);
    return { id, ...doc };
  }

  async findAll(filter?: SubcategoriaFilter): Promise<Subcategoria[]> {
    let query: Query = this.firestore.collection(COLLECTION);
    if (filter?.categoriaId !== undefined) {
      query = query.where('categoriaId', '==', filter.categoriaId);
    }
    if (filter?.activa !== undefined) {
      query = query.where('activa', '==', filter.activa);
    }
    const snapshot = await query.get();
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Subcategoria, 'id'>) }));
  }

  async findById(id: string): Promise<Subcategoria | null> {
    const snap = await this.firestore.collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...(snap.data() as Omit<Subcategoria, 'id'>) };
  }

  async findByCategoriaAndSlug(categoriaId: string, slug: string): Promise<Subcategoria | null> {
    const snapshot = await this.firestore
      .collection(COLLECTION)
      .where('categoriaId', '==', categoriaId)
      .where('slug', '==', slug)
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...(doc.data() as Omit<Subcategoria, 'id'>) };
  }

  async update(id: string, input: Partial<SubcategoriaInput>): Promise<Subcategoria> {
    await this.firestore
      .collection(COLLECTION)
      .doc(id)
      .update({ ...input, actualizadoEn: new Date() });
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Subcategoria not found after update');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.firestore.collection(COLLECTION).doc(id).delete();
  }

  async existsById(id: string): Promise<boolean> {
    const snap = await this.firestore.collection(COLLECTION).doc(id).get();
    return snap.exists;
  }

  async belongsToCategoria(subcategoriaId: string, categoriaId: string): Promise<boolean> {
    const snap = await this.firestore.collection(COLLECTION).doc(subcategoriaId).get();
    if (!snap.exists) return false;
    return (snap.data() as Subcategoria).categoriaId === categoriaId;
  }

  async hasAssociatedProducts(id: string): Promise<boolean> {
    const snapshot = await this.firestore
      .collection(PRODUCTS_COLLECTION)
      .where('subcategoriaId', '==', id)
      .limit(1)
      .get();
    return !snapshot.empty;
  }
}
