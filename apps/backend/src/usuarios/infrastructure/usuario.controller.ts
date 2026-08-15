import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UsuarioService } from '../application/usuario.service';
import { Usuario, UsuarioRol } from '../domain/usuario.entity';
import { UsuarioCreateDto } from './usuario-create.dto';
import { UsuarioUpdateDto } from './usuario-update.dto';

interface AuthedUser {
  uid: string;
  role: UsuarioRol;
}

interface AuthedRequest {
  user: AuthedUser;
}

@Controller('users')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('superadmin', 'admin')
export class UsuarioController {
  constructor(private readonly service: UsuarioService) {}

  @Get()
  findAll(@Req() req: AuthedRequest): Promise<Usuario[]> {
    const actor = req.user as AuthedUser;
    return this.service.findAll(actor.role);
  }

  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: UsuarioCreateDto): Promise<Usuario> {
    const actor = req.user as AuthedUser;
    return this.service.create(
      { ...dto, creadoPor: actor.uid },
      actor.role,
    );
  }

  @Get(':id')
  findById(@Req() req: AuthedRequest, @Param('id') id: string): Promise<Usuario> {
    const actor = req.user as AuthedUser;
    return this.service.findById(id, actor.role);
  }

  @Put(':id')
  @Patch(':id')
  update(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UsuarioUpdateDto,
  ): Promise<Usuario> {
    const actor = req.user as AuthedUser;
    return this.service.update(id, dto, actor.role);
  }
}
