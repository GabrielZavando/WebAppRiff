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
import {
  IEmailNotifier,
  I_EMAIL_NOTIFIER,
} from '../../email/domain/iemail-notifier';
import { buildLeadEmailMessage } from '../../email/application/lead-email-message';

@Injectable()
export class CotizacionService {
  constructor(
    @Inject(I_COTIZACION_REPOSITORY)
    private readonly repository: ICotizacionRepository,
    @Inject(I_EMAIL_NOTIFIER)
    private readonly notifier: IEmailNotifier,
  ) {}

  async create(input: CotizacionInput): Promise<Cotizacion> {
    const cotizacion = await this.repository.create(input);
    await this.notifyQuoteRequest(input);
    return cotizacion;
  }

  private async notifyQuoteRequest(input: CotizacionInput): Promise<void> {
    const message = buildLeadEmailMessage(
      'Nueva solicitud de cotización',
      [
        { label: 'Nombre', value: input.nombre },
        { label: 'Email', value: input.email },
        { label: 'Teléfono', value: input.telefono ?? '' },
        { label: 'Empresa', value: input.nombre_empresa },
        { label: 'RUT', value: input.rut ?? '' },
        { label: 'Mensaje', value: input.mensaje },
      ],
    );
    await this.notifier.sendEmail(message);
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
