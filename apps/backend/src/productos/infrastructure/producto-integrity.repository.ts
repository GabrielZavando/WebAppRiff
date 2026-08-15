import { Inject, Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from '../../infrastructure/firebase/firebase.tokens';
import { IProductIntegrityRepository } from '../domain/iproducto.repository';

const COLLECTION = 'productos';

/**
 * Reglas de integridad de productos (unicidad global de SKU y slug).
 * Separado de `ProductoRepository` para respetar ISP (≤5 métodos por puerto).
 */
@Injectable()
export class ProductoIntegrityRepository implements IProductIntegrityRepository {
  constructor(@Inject(FIRESTORE) private readonly firestore: Firestore) {}

  async existsBySku(sku: string, excludeId?: string): Promise<boolean> {
    const snapshot = await this.firestore
      .collection(COLLECTION)
      .where('sku', '==', sku)
      .get();
    return snapshot.docs.some((d) => d.id !== (excludeId ?? ''));
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const snapshot = await this.firestore
      .collection(COLLECTION)
      .where('slug', '==', slug)
      .get();
    return snapshot.docs.some((d) => d.id !== (excludeId ?? ''));
  }
}
