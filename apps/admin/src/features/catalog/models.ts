/**
 * Admin-side mirrors of the backend catalog entities and DTOs (task 3.1,
 * design D2). Deliberate per-workspace duplication — the shapes mirror
 * `apps/backend/src/{categorias,subcategorias,productos}` (entities + create/
 * update DTOs); do not import from `apps/web`. Dates arrive as ISO strings
 * over the JSON API.
 */

export interface Atributo {
  nombre: string;
  valor: string;
}

export interface GaleriaItem {
  url: string;
  storagePath: string;
  alt: string;
  orden: number;
}

export interface FichaTecnica {
  url: string;
  storagePath: string;
  nombreArchivo: string;
}

export interface Precio {
  valor: number;
  visible: boolean;
}

export interface Stock {
  disponible: boolean;
  cantidad: number | null;
}

/** Mirror of `Categoria` (`apps/backend/src/categorias/domain/categoria.entity.ts`). */
export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  activa: boolean;
  esDefault: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

/** Mirror of `Subcategoria` (`apps/backend/src/subcategorias/domain/subcategoria.entity.ts`). */
export interface Subcategoria {
  id: string;
  categoriaId: string;
  nombre: string;
  slug: string;
  orden: number;
  activa: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

/** Mirror of `Producto` (`apps/backend/src/productos/domain/producto.entity.ts`). */
export interface Producto {
  id: string;
  idExterno: string | null;
  sku: string;
  titulo: string;
  slug: string;
  descripcionBreve: string;
  descripcionLarga: string;
  categoriaId: string;
  subcategoriaId: string | null;
  atributos: Atributo[];
  precio: Precio;
  stock: Stock;
  galeria: GaleriaItem[];
  fichaTecnica: FichaTecnica | null;
  destacado: boolean;
  publicado: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

/** Lean projection returned for anonymous product list requests. */
export interface ProductoCard {
  id: string;
  sku: string;
  titulo: string;
  slug: string;
  descripcionBreve: string;
  categoriaId: string;
  subcategoriaId: string | null;
  precio: Precio;
  destacado: boolean;
  publicado: boolean;
  creadoEn: string;
  galeria: GaleriaItem[];
}

/** Pagination stats the backend rides on the envelope `meta` (contract `api-products-pagination`). */
export interface ProductoListMeta {
  page: number;
  limit: number;
  total: number;
}

/** Shape of `POST /categories` (mirror of `CategoriaCreateDto`). */
export interface CategoriaCreatePayload {
  nombre: string;
  slug?: string;
  orden?: number;
  activa?: boolean;
}

/** Shape of `PATCH /categories/:id` (all fields optional). */
export type CategoriaUpdatePayload = Partial<CategoriaCreatePayload>;

/** Shape of `POST /subcategories` (mirror of `SubcategoriaCreateDto`). */
export interface SubcategoriaCreatePayload {
  categoriaId: string;
  nombre: string;
  slug?: string;
  orden?: number;
  activa?: boolean;
}

/** Shape of `PATCH /subcategories/:id`. */
export type SubcategoriaUpdatePayload = Partial<Omit<SubcategoriaCreatePayload, 'categoriaId'>>;

/** Shape of `POST /products` (mirror of `ProductoCreateDto`). */
export interface ProductoCreatePayload {
  idExterno?: string | null;
  sku: string;
  titulo: string;
  slug?: string;
  descripcionBreve?: string;
  descripcionLarga?: string;
  categoriaId?: string;
  subcategoriaId?: string | null;
  atributos?: Atributo[];
  precio?: Precio;
  stock?: Stock;
  galeria?: GaleriaItem[];
  fichaTecnica?: FichaTecnica | null;
  destacado?: boolean;
  publicado?: boolean;
}

/** Shape of `PATCH /products/:id` (partial update). */
export type ProductoUpdatePayload = Partial<ProductoCreatePayload>;

/** Query params accepted by `GET /products` (server-side list contract). */
export interface ProductoListQuery {
  page: number;
  limit: number;
  search?: string;
  categoriaId?: string;
}
