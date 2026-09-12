import { Inject, Injectable } from '@nestjs/common';
import { Firestore, Query } from 'firebase-admin/firestore';
import { FIRESTORE } from '../../infrastructure/firebase/firebase.tokens';
import { IProductQueryRepository, IProductRepository } from '../domain/iproducto.repository';
import {
  Producto,
  ProductoCard,
  ProductoFilter,
  ProductoInput,
  ProductoListResult,
  ProductoSortField,
  ProductoUpdateInput,
} from '../domain/producto.entity';

const COLLECTION = 'productos';

/** Fields selected for the lean card projection. */
export const CARD_FIELDS: Array<keyof ProductoCard> = [
  'id',
  'sku',
  'titulo',
  'slug',
  'descripcionBreve',
  'categoriaId',
  'subcategoriaId',
  'precio',
  'destacado',
  'publicado',
  'creadoEn',
  'galeria',
];

const DEFAULT_LIMIT = 24;

/**
 * Fields that force the in-memory path when used as sortBy.
 * Native Firestore only supports orderBy on `creadoEn` (default).
 */
const MEMORY_SORT_FIELDS: readonly string[] = ['titulo', 'precio.valor', 'actualizadoEn'];

type WhereClause = { field: string; op: string; value: unknown };

function buildWhereClauses(filter: ProductoFilter): WhereClause[] {
  const clauses: WhereClause[] = [];
  if (filter.categoriaId !== undefined) clauses.push({ field: 'categoriaId', op: '==', value: filter.categoriaId });
  if (filter.subcategoriaId !== undefined) clauses.push({ field: 'subcategoriaId', op: '==', value: filter.subcategoriaId });
  if (filter.destacado !== undefined) clauses.push({ field: 'destacado', op: '==', value: filter.destacado });
  if (filter.publicado !== undefined) clauses.push({ field: 'publicado', op: '==', value: filter.publicado });
  return clauses;
}

function applyWhereClauses(query: Query, clauses: WhereClause[]): Query {
  let q = query;
  for (const c of clauses) {
    q = q.where(c.field, c.op as FirebaseFirestore.WhereFilterOp, c.value);
  }
  return q;
}

/**
 * Implementación Firestore de los puertos de productos.
 *
 * Dual path:
 * - **Native**: when no search and sortBy is not in MEMORY_SORT_FIELDS →
 *   uses Firestore `.where()`, `.orderBy()`, `.select()`, `.offset()`, `.limit()`.
 * - **In-memory**: otherwise → fetches all docs matching `where` filters,
 *   then applies search/sort/pagination in JS.
 *
 * Timestamps Firestore se normalizan a `Date` al leer.
 */
@Injectable()
export class ProductoRepository implements IProductRepository, IProductQueryRepository {
  constructor(@Inject(FIRESTORE) private readonly firestore: Firestore) {}

  async create(input: ProductoInput): Promise<Producto> {
    const id = input.id ?? this.firestore.collection(COLLECTION).doc().id;
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

  async findAll(filter: ProductoFilter): Promise<ProductoListResult> {
    const page = Math.max(1, filter.page ?? 1);
    const effectiveLimit = Math.max(1, filter.limit ?? DEFAULT_LIMIT);
    const useNativePath =
      !filter.search && (!filter.sortBy || !MEMORY_SORT_FIELDS.includes(filter.sortBy));

    if (useNativePath) {
      return this.findAllNative(filter, page, effectiveLimit);
    }
    return this.findAllMemory(filter, page, effectiveLimit);
  }

  /** Native Firestore path: where + orderBy + select + offset + limit + count. */
  private async findAllNative(
    filter: ProductoFilter,
    page: number,
    effectiveLimit: number,
  ): Promise<ProductoListResult> {
    const whereClauses = buildWhereClauses(filter);
    let query = applyWhereClauses(this.firestore.collection(COLLECTION), whereClauses);

    const sortDir = filter.sortDir === 'asc' ? 'asc' : 'desc';
    query = query.orderBy('creadoEn', sortDir);

    if (filter.projection === 'card') {
      query = query.select(...CARD_FIELDS.filter((f) => f !== 'id'));
    }

    // Count aggregation — same where filters, no orderBy/limit
    const countQuery = applyWhereClauses(this.firestore.collection(COLLECTION), whereClauses);
    const countSnap = await countQuery.count().get();
    const total = countSnap.data().count as number;

    // Pagination
    const totalPages = Math.ceil(total / effectiveLimit);
    const effectivePage = Math.max(1, Math.min(page, totalPages || 1));
    const offset = (effectivePage - 1) * effectiveLimit;

    query = query.offset(offset).limit(effectiveLimit);

    const snapshot = await query.get();
    const items =
      filter.projection === 'card'
        ? snapshot.docs.map((d) => toProductoCard(d.id, d.data() as Record<string, unknown>))
        : snapshot.docs.map((d) => toEntity(d.id, d.data() as Omit<Producto, 'id'>));

    return { items, total };
  }

  /** In-memory path: fetch all, filter, sort, paginate. */
  private async findAllMemory(
    filter: ProductoFilter,
    page: number,
    effectiveLimit: number,
  ): Promise<ProductoListResult> {
    const whereClauses = buildWhereClauses(filter);
    const query = applyWhereClauses(this.firestore.collection(COLLECTION), whereClauses);

    const snapshot = await query.get();
    let items = snapshot.docs.map((d) => {
      const data = d.data() as Omit<Producto, 'id'>;
      if (filter.projection === 'card') {
        return toProductoCard(d.id, data as Record<string, unknown>);
      }
      return toEntity(d.id, data);
    });

    // In-memory search
    if (filter.search) {
      const term = filter.search.toLowerCase();
      items = items.filter((p) => {
        const card = p as ProductoCard;
        return (
          card.titulo.toLowerCase().includes(term) ||
          card.sku.toLowerCase().includes(term) ||
          (card.descripcionBreve ?? '').toLowerCase().includes(term)
        );
      });
    }

    // In-memory sort
    if (filter.sortBy) {
      const dir = filter.sortDir === 'desc' ? -1 : 1;
      const key = filter.sortBy as ProductoSortField;
      items.sort((a, b) => {
        const av = sortValue(a as Producto, key);
        const bv = sortValue(b as Producto, key);
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
    }

    // Paginated slice
    const total = items.length;
    const totalPages = Math.ceil(total / effectiveLimit);
    const effectivePage = Math.max(1, Math.min(page, totalPages || 1));
    const start = (effectivePage - 1) * effectiveLimit;
    const paginatedItems = items.slice(start, start + effectiveLimit);

    return { items: paginatedItems, total };
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

/**
 * Maps a raw Firestore document (or partial) to a lean `ProductoCard`.
 * Missing optional fields are filled with sensible defaults.
 */
export function toProductoCard(id: string, data: Record<string, unknown>): ProductoCard {
  return {
    id,
    sku: data.sku as string,
    titulo: data.titulo as string,
    slug: data.slug as string,
    descripcionBreve: (data.descripcionBreve as string) ?? '',
    categoriaId: data.categoriaId as string,
    subcategoriaId: (data.subcategoriaId as string | null) ?? null,
    precio: (data.precio as ProductoCard['precio']) ?? { valor: 0, visible: false },
    destacado: (data.destacado as boolean) ?? false,
    publicado: (data.publicado as boolean) ?? false,
    creadoEn: toDate(data.creadoEn) ?? new Date(),
    galeria: (data.galeria as ProductoCard['galeria']) ?? [],
  };
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

function toDate(value: unknown): Date | undefined {
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  return value as Date | undefined;
}
