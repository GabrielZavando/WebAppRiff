import type { CategoryOption } from '@/lib/types/search-form';
import type { PaginationItem } from '@/lib/products/buildPaginationItems';

/** A category as returned by `GET /api/v1/categories`. */
export interface CategoriaApi {
  readonly id: string;
  readonly nombre: string;
  readonly slug: string;
  readonly orden: number;
  readonly activa: boolean;
}

/** A subcategory as returned by `GET /api/v1/subcategories`. */
export interface SubcategoriaApi {
  readonly id: string;
  readonly categoriaId: string;
  readonly nombre: string;
  readonly slug: string;
  readonly orden: number;
  readonly activa: boolean;
}

/** A single gallery image reference (Firebase Storage URL). */
export interface GaleriaItemApi {
  readonly url: string;
  readonly alt: string;
  readonly storagePath?: string;
  readonly orden?: number;
}

/** A product as returned by `GET /api/v1/products` (public subset used by the page). */
export interface ProductoApi {
  readonly id: string;
  readonly sku: string;
  readonly titulo: string;
  readonly slug: string;
  readonly descripcionBreve: string;
  readonly categoriaId: string;
  readonly subcategoriaId: string | null;
  readonly galeria: readonly GaleriaItemApi[];
  readonly precio: {
    readonly valor: number;
    readonly visible: boolean;
  };
  readonly creadoEn: string;
}

export type ViewMode = 'grid' | 'list';

export type SortBy = 'titulo' | 'precio.valor' | 'creadoEn';
export type SortDir = 'asc' | 'desc';

/** Parsed URL params that drive the catalog page (server-rendered at build time). */
export interface ProductsPageFilters {
  readonly q: string;
  readonly categoriaId: string;
  readonly subcategoriaIds: readonly string[];
  readonly sortBy: SortBy;
  readonly sortDir: SortDir;
  readonly view: ViewMode;
  readonly page: number;
  readonly pageSize: number;
}

/** Pagination metadata derived from a filtered result set. */
export interface PaginationModel {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
  readonly items: readonly PaginationItem[];
}

/** View-model consumed by `ProductCard.astro` / `ProductListItem.astro`. */
export interface ProductCardModel {
  readonly slug: string;
  readonly titulo: string;
  readonly categoriaId: string;
  readonly subcategoriaId: string | null;
  readonly categoriaNombre: string;
  readonly descripcionBreve: string;
  readonly imageUrl: string;
  readonly imageAlt: string;
  readonly cotizarHref: string;
  readonly detalleHref: string;
}

export type { CategoryOption };
