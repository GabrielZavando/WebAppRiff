import { Subcategoria } from './subcategoria.entity';

export type SubcategoriaFilter = { categoriaId?: string; activa?: boolean };

export type SubcategoriaInput = {
  categoriaId: string;
  nombre: string;
  slug: string;
  orden: number;
  activa: boolean;
  id?: string;
};

export type SubcategoriaUpdateInput = {
  categoriaId?: string;
  nombre?: string;
  slug?: string;
  orden?: number;
  activa?: boolean;
};

/**
 * Puerto de acceso a datos de subcategorías (ISP, ≤5 métodos).
 * Implementado en infrastructure con Firebase Admin SDK.
 */
export interface ISubcategoriaRepository {
  create(input: SubcategoriaInput): Promise<Subcategoria>;
  findAll(filter?: SubcategoriaFilter): Promise<Subcategoria[]>;
  findById(id: string): Promise<Subcategoria | null>;
  update(id: string, input: Partial<SubcategoriaInput>): Promise<Subcategoria>;
  remove(id: string): Promise<void>;
}

export const I_SUBCATEGORIA_REPOSITORY = 'I_SUBCATEGORIA_REPOSITORY';

/**
 * Puerto de reglas de integridad de subcategorías (ISP, ≤5 métodos).
 * Separado de ISubcategoriaRepository para no exceder 5 métodos por interfaz.
 */
export interface ISubcategoriaIntegrityRepository {
  findByCategoriaAndSlug(categoriaId: string, slug: string): Promise<Subcategoria | null>;
  existsById(id: string): Promise<boolean>;
  belongsToCategoria(subcategoriaId: string, categoriaId: string): Promise<boolean>;
  hasAssociatedProducts(subcategoriaId: string): Promise<boolean>;
}

export const I_SUBCATEGORIA_INTEGRITY_REPOSITORY = 'I_SUBCATEGORIA_INTEGRITY_REPOSITORY';
