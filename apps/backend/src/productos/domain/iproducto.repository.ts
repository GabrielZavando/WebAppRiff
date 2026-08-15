import { Producto, ProductoFilter, ProductoInput, ProductoUpdateInput } from './producto.entity';

/**
 * Puerto de acceso a datos de productos (ISP, ≤5 métodos).
 * Implementado en infrastructure con Firebase Admin SDK.
 */
export interface IProductRepository {
  create(input: ProductoInput): Promise<Producto>;
  findById(id: string): Promise<Producto | null>;
  update(id: string, input: ProductoUpdateInput): Promise<Producto>;
  remove(id: string): Promise<void>;
}

export const I_PRODUCT_REPOSITORY = 'I_PRODUCT_REPOSITORY';

/**
 * Puerto de lectura/consulta de productos (ISP, ≤5 métodos).
 * Separado de IProductRepository para no exceder 5 métodos por interfaz.
 */
export interface IProductQueryRepository {
  findById(id: string): Promise<Producto | null>;
  findAll(filter: ProductoFilter): Promise<Producto[]>;
  findBySlug(slug: string): Promise<Producto | null>;
}

export const I_PRODUCT_QUERY_REPOSITORY = 'I_PRODUCT_QUERY_REPOSITORY';

/**
 * Puerto de reglas de integridad de productos (ISP, ≤5 métodos).
 * Separado para no exceder 5 métodos por interfaz.
 */
export interface IProductIntegrityRepository {
  existsBySku(sku: string, excludeId?: string): Promise<boolean>;
  existsBySlug(slug: string, excludeId?: string): Promise<boolean>;
}

export const I_PRODUCT_INTEGRITY_REPOSITORY = 'I_PRODUCT_INTEGRITY_REPOSITORY';
