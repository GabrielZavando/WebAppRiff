import { Inject, Injectable } from '@nestjs/common';
import { Firestore, Query } from 'firebase-admin/firestore';
import { FIRESTORE } from '../../infrastructure/firebase/firebase.tokens';
import { Cotizacion, CotizacionFilter, CotizacionInput } from '../domain/cotizacion.entity';
import { ICotizacionRepository } from '../domain/icotizacion.repository';

const COLLECTION = 'cotizaciones';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

@Injectable()
export class CotizacionRepository implements ICotizacionRepository {
  constructor(@Inject(FIRESTORE) private readonly firestore: Firestore) {}

  async create(input: CotizacionInput): Promise<Cotizacion> {
    const id = this.firestore.collection(COLLECTION).doc().id;
    const now = new Date();
    const doc: Omit<Cotizacion, 'id'> = {
      nombre: input.nombre,
      email: input.email,
      telefono: input.telefono ?? null,
      nombre_empresa: input.nombre_empresa,
      rut: input.rut ?? null,
      mensaje: input.mensaje,
      estado: 'pendiente',
      creadoEn: now,
      actualizadoEn: now,
    };
    await this.firestore.collection(COLLECTION).doc(id).set(doc);
    return { id, ...doc };
  }

  async findAll(
    filter: CotizacionFilter,
  ): Promise<{ data: Cotizacion[]; total: number }> {
    let query: Query = this.firestore.collection(COLLECTION);
    if (filter.estado !== undefined) {
      query = query.where('estado', '==', filter.estado);
    }

    const snapshot = await query.get();
    let items = snapshot.docs.map((d) =>
      toEntity(d.id, d.data() as Omit<Cotizacion, 'id'>),
    );

    const total = items.length;

    const page = filter.page ?? DEFAULT_PAGE;
    const limit = filter.limit ?? DEFAULT_LIMIT;
    const start = (page - 1) * limit;
    items = items.slice(start, start + limit);

    return { data: items, total };
  }

  async findById(id: string): Promise<Cotizacion | null> {
    const snap = await this.firestore.collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    return toEntity(id, snap.data() as Omit<Cotizacion, 'id'>);
  }

  async updateEstado(
    id: string,
    estado: 'pendiente' | 'atendida',
  ): Promise<Cotizacion> {
    await this.firestore
      .collection(COLLECTION)
      .doc(id)
      .update({ estado, actualizadoEn: new Date() });
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Cotizacion not found after update');
    }
    return updated;
  }
}

function toEntity(id: string, data: Omit<Cotizacion, 'id'>): Cotizacion {
  return {
    id,
    nombre: data.nombre,
    email: data.email,
    telefono: data.telefono ?? null,
    nombre_empresa: data.nombre_empresa,
    rut: data.rut ?? null,
    mensaje: data.mensaje,
    estado: data.estado ?? 'pendiente',
    creadoEn: toDate(data.creadoEn),
    actualizadoEn: toDate(data.actualizadoEn),
  };
}

function toDate(value: unknown): Date {
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  return value as Date;
}
