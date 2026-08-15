export interface Subcategoria {
  id: string;
  categoriaId: string;
  nombre: string;
  slug: string;
  orden: number;
  activa: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}
