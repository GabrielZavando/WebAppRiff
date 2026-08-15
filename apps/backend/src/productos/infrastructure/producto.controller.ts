import {
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
import { Producto, ProductoFilter, ProductoSortField } from '../domain/producto.entity';
import { ProductoCreateDto } from './producto-create.dto';
import { ProductoUpdateDto } from './producto-update.dto';

const ALLOWED_SORT: ProductoSortField[] = ['creadoEn', 'actualizadoEn', 'titulo', 'precio.valor'];

interface AuthedRequest extends Request {
  user?: DecodedIdToken;
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
  ): Promise<Producto[]> {
    const filter: ProductoFilter = {};
    if (categoriaId) filter.categoriaId = categoriaId;
    if (subcategoriaId) filter.subcategoriaId = subcategoriaId;
    if (destacado !== undefined) filter.destacado = destacado === 'true';
    if (publicado !== undefined) filter.publicado = publicado === 'true';
    if (search) filter.search = search;
    if (sortBy && (ALLOWED_SORT as string[]).includes(sortBy)) {
      filter.sortBy = sortBy as ProductoSortField;
    }
    if (sortDir === 'asc' || sortDir === 'desc') {
      filter.sortDir = sortDir;
    }
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
