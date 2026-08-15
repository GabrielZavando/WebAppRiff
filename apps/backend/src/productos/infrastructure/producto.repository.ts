import { Inject, Injectable } from '@nestjs/common';
import { Firestore, Query } from 'firebase-admin/firestore';
import { FIRESTORE } from '../../infrastructure/firebase/firebase.tokens';
import { IProductQueryRepository, IProductRepository } from '../domain/iproducto.repository';
import {
  Producto,
  ProductoFilter,
  ProductoInput,
  ProductoSortField,
  ProductoUpdateInput,
} from '../domain/producto.entity';

const COLLECTION = 'productos';

/**
 * Implementación Firestore de los puertos de productos. La búsqueda de texto
 * (`search`) y el orden (`sortBy`/`sortDir`) se resuelven en memoria tras la
 * consulta por campos exactos, evitando índices compuestos en un catálogo
 * pequeño. Los timestamps Firestore se normalizan a `Date` al leer.
 */
@Injectable()
export class ProductoRepository implements IProductRepository, IProductQueryRepository {
  constructor(@Inject(FIRESTORE) private readonly firestore: Firestore) {}

  async create(input: ProductoInput): Promise<Producto> {
    const id = this.firestore.collection(COLLECTION).doc().id;
    const now = new Date();
    const { idExterno, subcategoriaId, ...rest } = input;
    const doc: Omit<Producto, 'id'> = {
      ...rest,
      idExterno: idExterno ?? null,
      subcategoriaId: subcategoriaId ?? null,
      creadoEn: now,
      actualizadoEn: now,
    };
    await this.firestore.collection(COLLECTION).doc(id).set(doc);
    return { id, ...doc };
  }

  async findById(id: string): Promise<Producto | null> {
    const snap = await this.firestore.collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    return toEntity(id, snap.data() as Omit<Producto, 'id'>);
  }

  async findBySlug(slug: string): Promise<Producto | null> {
    const snapshot = await this.firestore
      .collection(COLLECTION)
      .where('slug', '==', slug)
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return toEntity(doc.id, doc.data() as Omit<Producto, 'id'>);
  }

  async findAll(filter: ProductoFilter): Promise<Producto[]> {
    let query: Query = this.firestore.collection(COLLECTION);
    if (filter.categoriaId !== undefined) {
      query = query.where('categoriaId', '==', filter.categoriaId);
    }
    if (filter.subcategoriaId !== undefined) {
      query = query.where('subcategoriaId', '==', filter.subcategoriaId);
    }
    if (filter.destacado !== undefined) {
      query = query.where('destacado', '==', filter.destacado);
    }
    if (filter.publicado !== undefined) {
      query = query.where('publicado', '==', filter.publicado);
    }

    const snapshot = await query.get();
    let items = snapshot.docs.map((d) => toEntity(d.id, d.data() as Omit<Producto, 'id'>));

    if (filter.search) {
      const term = filter.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.titulo.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          (p.descripcionBreve ?? '').toLowerCase().includes(term),
      );
    }

    if (filter.sortBy) {
      const dir = filter.sortDir === 'desc' ? -1 : 1;
      const key = filter.sortBy as ProductoSortField;
      items.sort((a, b) => {
        const av = sortValue(a, key);
        const bv = sortValue(b, key);
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
    }

    return items;
  }

  async update(id: string, input: ProductoUpdateInput): Promise<Producto> {
    await this.firestore
      .collection(COLLECTION)
      .doc(id)
      .update({ ...input, actualizadoEn: new Date() });
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Producto not found after update');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.firestore.collection(COLLECTION).doc(id).delete();
  }
}

function sortValue(p: Producto, key: ProductoSortField): number | string {
  switch (key) {
    case 'creadoEn':
    case 'actualizadoEn':
      return p[key]?.getTime() ?? 0;
    case 'titulo':
      return p.titulo.toLowerCase();
    case 'precio.valor':
      return p.precio.valor;
    default:
      return 0;
  }
}

const ENTITY_OPTIONAL_DEFAULTS: Record<string, unknown> = {
  idExterno: null,
  descripcionBreve: '',
  descripcionLarga: '',
  subcategoriaId: null,
  atributos: [],
  galeria: [],
  fichaTecnica: null,
  destacado: false,
  publicado: false,
};

function toEntity(id: string, data: Omit<Producto, 'id'>): Producto {
  const entity = {
    id,
    sku: data.sku,
    titulo: data.titulo,
    slug: data.slug,
    categoriaId: data.categoriaId,
    precio: data.precio ?? { valor: 0, visible: false },
    stock: data.stock ?? { disponible: true, cantidad: null },
    creadoEn: toDate(data.creadoEn),
    actualizadoEn: toDate(data.actualizadoEn),
  } as Producto;
  applyEntityDefaults(entity, data);
  return entity;
}

function applyEntityDefaults(entity: Producto, data: Omit<Producto, 'id'>): void {
  for (const key of Object.keys(ENTITY_OPTIONAL_DEFAULTS)) {
    const value = (data as Record<string, unknown>)[key];
    (entity as unknown as Record<string, unknown>)[key] =
      value === undefined ? ENTITY_OPTIONAL_DEFAULTS[key] : value;
  }
}

function toDate(value: unknown): Date {
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  return value as Date;
}
