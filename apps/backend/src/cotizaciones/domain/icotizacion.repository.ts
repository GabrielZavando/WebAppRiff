import { Cotizacion, CotizacionFilter, CotizacionInput } from './cotizacion.entity';

/**
 * Port for cotizacion data access (ISP, ≤5 methods).
 * Implemented in infrastructure with Firebase Admin SDK.
 */
export interface ICotizacionRepository {
  create(input: CotizacionInput): Promise<Cotizacion>;
  findAll(
    filter: CotizacionFilter,
  ): Promise<{ data: Cotizacion[]; total: number }>;
  findById(id: string): Promise<Cotizacion | null>;
  updateEstado(
    id: string,
    estado: 'pendiente' | 'atendida',
  ): Promise<Cotizacion>;
}

export const I_COTIZACION_REPOSITORY = 'I_COTIZACION_REPOSITORY';
