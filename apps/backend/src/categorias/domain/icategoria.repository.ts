import { Categoria } from './categoria.entity';

export type CategoriaFilter = { activa?: boolean };

export type CategoriaInput = {
  nombre: string;
  slug: string;
  orden: number;
  activa: boolean;
  id?: string;
  esDefault?: boolean;
};

export interface ICategoriaRepository {
  create(input: CategoriaInput): Promise<Categoria>;
  findAll(filter?: CategoriaFilter): Promise<Categoria[]>;
  findById(id: string): Promise<Categoria | null>;
  update(id: string, input: Partial<CategoriaInput>): Promise<Categoria>;
  remove(id: string): Promise<void>;
}

export const I_CATEGORIA_REPOSITORY = 'I_CATEGORIA_REPOSITORY';

export interface ICategoriaIntegrityRepository {
  findBySlug(slug: string): Promise<Categoria | null>;
  hasAssociatedProducts(id: string): Promise<boolean>;
  ensureDefault(): Promise<void>;
}

export const I_CATEGORIA_INTEGRITY_REPOSITORY = 'I_CATEGORIA_INTEGRITY_REPOSITORY';
