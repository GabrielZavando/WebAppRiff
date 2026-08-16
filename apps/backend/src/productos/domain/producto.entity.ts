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

/** Central catalog entity persisted in the `productos` Firestore collection. */
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
  creadoEn: Date;
  actualizadoEn: Date;
}

export type ProductoInput = {
  id?: string;
  idExterno?: string | null;
  sku: string;
  titulo: string;
  slug: string;
  descripcionBreve: string;
  descripcionLarga: string;
  categoriaId: string;
  subcategoriaId?: string | null;
  atributos: Atributo[];
  precio: Precio;
  stock: Stock;
  galeria: GaleriaItem[];
  fichaTecnica: FichaTecnica | null;
  destacado: boolean;
  publicado: boolean;
};

export type ProductoUpdateInput = Partial<ProductoInput>;

export type ProductoSortField = 'creadoEn' | 'actualizadoEn' | 'titulo' | 'precio.valor';

export type ProductoFilter = {
  categoriaId?: string;
  subcategoriaId?: string;
  destacado?: boolean;
  publicado?: boolean;
  search?: string;
  sortBy?: ProductoSortField;
  sortDir?: 'asc' | 'desc';
};
