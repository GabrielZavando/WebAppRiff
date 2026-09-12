import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { OptionalFirebaseAuthGuard } from '../../auth/optional-firebase-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ProductoReadService } from '../application/producto-read.service';
import { ProductoWriteService } from '../application/producto-write.service';
import { Producto, ProductoCard, ProductoFilter, ProductoListResult, ProductoSortField } from '../domain/producto.entity';
import { ProductoCreateDto } from './producto-create.dto';
import { ProductoUpdateDto } from './producto-update.dto';

const ALLOWED_SORT: ProductoSortField[] = ['creadoEn', 'actualizadoEn', 'titulo', 'precio.valor'];

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

interface AuthedRequest extends Request {
  user?: DecodedIdToken;
}

function buildFilter(params: {
  categoriaId?: string;
  subcategoriaId?: string;
  destacado?: string;
  publicado?: string;
  search?: string;
  sortBy?: string;
  sortDir?: string;
}): ProductoFilter {
  const filter: ProductoFilter = {};
  if (params.categoriaId) filter.categoriaId = params.categoriaId;
  if (params.subcategoriaId) filter.subcategoriaId = params.subcategoriaId;
  if (params.destacado !== undefined) filter.destacado = params.destacado === 'true';
  if (params.publicado !== undefined) filter.publicado = params.publicado === 'true';
  if (params.search) filter.search = params.search;
  if (params.sortBy && (ALLOWED_SORT as string[]).includes(params.sortBy)) {
    filter.sortBy = params.sortBy as ProductoSortField;
  }
  if (params.sortDir === 'asc' || params.sortDir === 'desc') {
    filter.sortDir = params.sortDir;
  }
  return filter;
}

function parsePagination(page?: string, limit?: string): { page: number; limit: number } {
  const pageNum = page ? parseInt(page, 10) : 1;
  if (page && isNaN(pageNum)) {
    throw new BadRequestException('page must be a number');
  }
  const limitNum = limit
    ? Math.min(Math.max(1, parseInt(limit, 10)), MAX_LIMIT)
    : DEFAULT_LIMIT;
  if (limit && isNaN(parseInt(limit, 10))) {
    throw new BadRequestException('limit must be a number');
  }
  return { page: pageNum, limit: limitNum };
}

/**
 * Endpoints de productos bajo `/api/v1/products`. La lectura es pública pero
 * admite un token opcional: un usuario autenticado puede ver también los
 * productos no publicados. La escritura requiere rol (admin/superadmin crean y
 * borran; editor también edita).
 */
@Controller('products')
export class ProductoController {
  constructor(
    private readonly readService: ProductoReadService,
    private readonly writeService: ProductoWriteService,
  ) {}

  @Get()
  @UseGuards(OptionalFirebaseAuthGuard)
  findAll(
    @Req() req: AuthedRequest,
    @Query('categoriaId') categoriaId?: string,
    @Query('subcategoriaId') subcategoriaId?: string,
    @Query('destacado') destacado?: string,
    @Query('publicado') publicado?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ProductoListResult<Producto | ProductoCard>> {
    const filter = buildFilter({ categoriaId, subcategoriaId, destacado, publicado, search, sortBy, sortDir });
    const pagination = parsePagination(page, limit);
    filter.page = pagination.page;
    filter.limit = pagination.limit;

    return this.readService.findAll(filter, !!req.user);
  }

  @Get('slug/:slug')
  @UseGuards(OptionalFirebaseAuthGuard)
  findBySlug(@Req() req: AuthedRequest, @Param('slug') slug: string): Promise<Producto> {
    return this.readService.findBySlug(slug, !!req.user);
  }

  @Get(':id')
  @UseGuards(OptionalFirebaseAuthGuard)
  findById(@Req() req: AuthedRequest, @Param('id') id: string): Promise<Producto> {
    return this.readService.findById(id, !!req.user);
  }

  @Post()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  create(@Body() dto: ProductoCreateDto): Promise<Producto> {
    return this.writeService.create(dto);
  }

  @Put(':id')
  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'editor')
  update(@Param('id') id: string, @Body() dto: ProductoUpdateDto): Promise<Producto> {
    return this.writeService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  remove(@Param('id') id: string): Promise<void> {
    return this.writeService.remove(id);
  }
}
