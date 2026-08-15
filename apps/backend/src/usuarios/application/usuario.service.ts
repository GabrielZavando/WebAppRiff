import { ForbiddenException, Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { IUsuarioRepository, I_USUARIO_REPOSITORY } from '../domain/iusuario.repository';
import { CreateUsuarioInput, UpdateUsuarioInput } from '../domain/iusuario.repository';
import { Usuario, UsuarioRol } from '../domain/usuario.entity';

/**
 * Reglas de negocio de usuarios (docs/data-model.md):
 * - Superadmin gestiona todo; admin solo crea editors y no desactiva admins; etc.
 * - El rol vive en Firestore; el custom claim se sincroniza en alta/modificación
 *   (lo hace el repository). Este service solo valida reglas y delega.
 * - Nunca puede quedar sin al menos un superadmin activo.
 */
@Injectable()
export class UsuarioService {
  constructor(
    @Inject(I_USUARIO_REPOSITORY) private readonly repository: IUsuarioRepository,
  ) {}

  async create(input: CreateUsuarioInput, actorRol: UsuarioRol): Promise<Usuario> {
    this.assertCanCreate(actorRol, input.rol);
    return this.repository.create(input);
  }

  async findAll(actorRol: UsuarioRol): Promise<Usuario[]> {
    this.assertCanRead(actorRol);
    return this.repository.findAll();
  }

  async findById(id: string, actorRol: UsuarioRol): Promise<Usuario> {
    this.assertCanRead(actorRol);
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(
    id: string,
    input: UpdateUsuarioInput,
    actorRol: UsuarioRol,
  ): Promise<Usuario> {
    if (actorRol !== 'superadmin' && actorRol !== 'admin') {
      throw new ForbiddenException('Insufficient permissions to update users');
    }

    const target = await this.repository.findById(id);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    this.assertUpdateAllowed(actorRol, target, input);
    await this.assertNotOrphaningSuperadmin(target, input);

    const updated = await this.repository.update(id, input);
    if (input.rol && input.rol !== target.rol) {
      await this.repository.setRoleClaim(id, input.rol);
    }
    return updated;
  }

  private assertCanCreate(actor: UsuarioRol, targetRol: UsuarioRol): void {
    if (actor === 'superadmin') return;
    if (actor === 'admin' && targetRol === 'editor') return;
    throw new ForbiddenException('Insufficient permissions to create this role');
  }

  private assertCanRead(actor: UsuarioRol): void {
    if (actor === 'superadmin' || actor === 'admin') return;
    throw new ForbiddenException('Insufficient permissions to read users');
  }

  private assertUpdateAllowed(
    actor: UsuarioRol,
    target: Usuario,
    input: UpdateUsuarioInput,
  ): void {
    // Solo superadmin gestiona roles.
    if (input.rol !== undefined && actor !== 'superadmin') {
      throw new ForbiddenException('Only superadmin can change roles');
    }
    // Admin no puede desactivar ningún admin (a sí mismo ni a otro).
    if (actor === 'admin' && input.activo === false && target.rol === 'admin') {
      throw new ForbiddenException('Admin cannot deactivate an admin');
    }
  }

  private async assertNotOrphaningSuperadmin(
    target: Usuario,
    input: UpdateUsuarioInput,
  ): Promise<void> {
    const isActiveSuperadmin = target.rol === 'superadmin' && target.activo === true;
    if (!isActiveSuperadmin) return;

    const wouldLoseSuperadmin =
      (input.rol !== undefined && input.rol !== 'superadmin') || input.activo === false;
    if (!wouldLoseSuperadmin) return;

    const all = await this.repository.findAll();
    const otherActiveSuperadmins = all.filter(
      (u) => u.id !== target.id && u.rol === 'superadmin' && u.activo === true,
    );
    if (otherActiveSuperadmins.length === 0) {
      throw new ConflictException('Cannot leave the system without an active superadmin');
    }
  }
}
