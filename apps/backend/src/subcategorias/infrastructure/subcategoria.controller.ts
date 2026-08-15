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
import { SubcategoriaService } from '../application/subcategoria.service';
import { Subcategoria } from '../domain/subcategoria.entity';
import { SubcategoriaFilter } from '../domain/isubcategoria.repository';
import { SubcategoriaCreateDto } from './subcategoria-create.dto';
import { SubcategoriaUpdateDto } from './subcategoria-update.dto';

@Controller('subcategories')
export class SubcategoriaController {
  constructor(private readonly service: SubcategoriaService) {}

  @Get()
  findAll(
    @Query('categoriaId') categoriaId?: string,
    @Query('activa') activa?: string,
  ): Promise<Subcategoria[]> {
    const filter: SubcategoriaFilter = {};
    if (categoriaId !== undefined) filter.categoriaId = categoriaId;
    if (activa !== undefined) filter.activa = activa === 'true';
    return this.service.findAll(filter);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<Subcategoria> {
    return this.service.findById(id);
  }

  @Post()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  create(@Body() dto: SubcategoriaCreateDto): Promise<Subcategoria> {
    return this.service.create(dto);
  }

  @Put(':id')
  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'editor')
  update(@Param('id') id: string, @Body() dto: SubcategoriaUpdateDto): Promise<Subcategoria> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
