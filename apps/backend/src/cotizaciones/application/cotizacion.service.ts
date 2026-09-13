import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  Cotizacion,
  CotizacionFilter,
  CotizacionInput,
  CotizacionListResult,
} from '../domain/cotizacion.entity';
import {
  ICotizacionRepository,
  I_COTIZACION_REPOSITORY,
} from '../domain/icotizacion.repository';

@Injectable()
export class CotizacionService {
  constructor(
    @Inject(I_COTIZACION_REPOSITORY)
    private readonly repository: ICotizacionRepository,
  ) {}

  async create(input: CotizacionInput): Promise<Cotizacion> {
    return this.repository.create(input);
  }

  async findAll(filter: CotizacionFilter): Promise<CotizacionListResult> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const { data, total } = await this.repository.findAll(filter);
    return { data, meta: { page, limit, total } };
  }

  async findById(id: string): Promise<Cotizacion> {
    const cotizacion = await this.repository.findById(id);
    if (!cotizacion) {
      throw new NotFoundException('Cotizacion not found');
    }
    return cotizacion;
  }

  async updateEstado(
    id: string,
    estado: 'pendiente' | 'atendida',
  ): Promise<Cotizacion> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Cotizacion not found');
    }
    return this.repository.updateEstado(id, estado);
  }
}
