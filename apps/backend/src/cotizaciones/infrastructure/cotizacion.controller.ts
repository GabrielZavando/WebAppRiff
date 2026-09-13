import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CotizacionService } from '../application/cotizacion.service';
import {
  Cotizacion,
  CotizacionFilter,
  CotizacionListResult,
} from '../domain/cotizacion.entity';
import { CotizacionCreateDto } from './cotizacion-create.dto';
import { CotizacionUpdateDto } from './cotizacion-update.dto';

/** Tighter rate limit for the public lead-capture form (spam surface). */
const QUOTES_THROTTLE = { limit: 10, ttl: 60_000 };

@Controller('quotes')
export class CotizacionController {
  constructor(private readonly service: CotizacionService) {}

  @Post()
  @HttpCode(201)
  @Throttle({ default: QUOTES_THROTTLE })
  async create(@Body() dto: CotizacionCreateDto): Promise<Cotizacion> {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  findAll(
    @Query('estado') estado?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<CotizacionListResult> {
    const filter: CotizacionFilter = {};
    if (estado === 'pendiente' || estado === 'atendida') {
      filter.estado = estado;
    }
    if (page) {
      filter.page = parseInt(page, 10);
    }
    if (limit) {
      filter.limit = parseInt(limit, 10);
    }
    return this.service.findAll(filter);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  findById(@Param('id') id: string): Promise<Cotizacion> {
    return this.service.findById(id);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'editor')
  updateEstado(
    @Param('id') id: string,
    @Body() dto: CotizacionUpdateDto,
  ): Promise<Cotizacion> {
    return this.service.updateEstado(id, dto.estado);
  }
}
