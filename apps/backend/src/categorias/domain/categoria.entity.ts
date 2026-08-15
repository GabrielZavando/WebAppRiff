export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  activa: boolean;
  esDefault: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}
