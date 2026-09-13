/** Quote request entity persisted in the `cotizaciones` Firestore collection. */
export interface Cotizacion {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  nombre_empresa: string;
  rut: string | null;
  mensaje: string;
  estado: 'pendiente' | 'atendida';
  creadoEn: Date;
  actualizadoEn: Date;
}

/** Payload for creating a new cotizacion (without id, estado, or timestamps). */
export type CotizacionInput = {
  nombre: string;
  email: string;
  telefono?: string | null;
  nombre_empresa: string;
  rut?: string | null;
  mensaje: string;
};

/** Filter for listing cotizaciones with pagination. */
export type CotizacionFilter = {
  estado?: 'pendiente' | 'atendida';
  page?: number;
  limit?: number;
};

/** Paginated list result with the envelope `meta` shape consumed by the response interceptor. */
export type CotizacionListResult = {
  data: Cotizacion[];
  meta: { page: number; limit: number; total: number };
};
