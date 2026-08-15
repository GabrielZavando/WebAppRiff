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
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CategoriaService } from '../application/categoria.service';
import { Categoria } from '../domain/categoria.entity';
import { CategoriaFilter } from '../domain/icategoria.repository';
import { CategoriaCreateDto } from './categoria-create.dto';
import { CategoriaUpdateDto } from './categoria-update.dto';

@Controller('categories')
export class CategoriaController {
  constructor(private readonly service: CategoriaService) {}

  @Get()
  findAll(@Query('activa') activa?: string): Promise<Categoria[]> {
    const filter: CategoriaFilter | undefined =
      activa === undefined ? undefined : { activa: activa === 'true' };
    return this.service.findAll(filter);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<Categoria> {
    return this.service.findById(id);
  }

  @Post()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  create(@Body() dto: CategoriaCreateDto): Promise<Categoria> {
    return this.service.create(dto);
  }

  @Put(':id')
  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'editor')
  update(@Param('id') id: string, @Body() dto: CategoriaUpdateDto): Promise<Categoria> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
