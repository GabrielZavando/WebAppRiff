import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

import { AlertComponent } from '../../../shared/components/ui/alert/alert.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { TableComponent } from '../../../shared/components/ui/table/table.component';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ApiError } from '../../../shared/api/api-client.service';
import { RoleService } from '../../auth/role.service';
import { consumeNavigationFlash, type FlashKind } from '../../catalog/flash-state';
import { consumeNavigationFlashError } from '../navigation-flash';
import { Usuario } from '../models';
import { UsersService } from '../users.service';
import { UsersInvitationService } from '../users-invitation.service';
import { userListLoadErrorMessage, userActionErrorMessage } from '../users-error-mapping';

/**
 * Users list page (tasks 6.1–6.2, 9.1–9.2; spec `admin-users`): full user
 * table with the derived estado badge, role-gated actions (hidden, never
 * disabled — the matrix mirrors the backend rules in `usuario.service.ts`),
 * invitation resend for pending users, and deactivate/activate with a
 * confirmation modal and Spanish inline banners.
 */
@Component({
  selector: 'app-users-page',
  imports: [
    NgClass,
    RouterLink,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    ModalComponent,
    TableComponent,
    PageBreadcrumbComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-breadcrumb pageTitle="Usuarios" />

    @if (successMessage(); as message) {
      <app-alert data-success-banner variant="success" [message]="message" class="mb-4 block" />
    }
    @if (errorMessage(); as message) {
      <app-alert data-error-banner variant="error" [message]="message" class="mb-4 block" />
    }

    <div class="mb-4 flex items-center justify-end">
      @if (canWrite()) {
        <app-button data-add (btnClick)="addUsuario()">Añadir usuario</app-button>
      }
    </div>

    <app-table [empty]="!loading() && usuarios().length === 0" emptyMessage="Sin usuarios.">
      <tr appTableHeaderRow>
        <th class="px-4 py-3">Nombre</th>
        <th class="px-4 py-3">Email</th>
        <th class="px-4 py-3">Rol</th>
        <th class="px-4 py-3">Estado</th>
        <th class="px-4 py-3">Acciones</th>
      </tr>
      @for (usuario of usuarios(); track usuario.id) {
        <tr appTableRow class="border-t border-border">
          <td class="px-4 py-3 font-medium text-secondary">{{ usuario.nombre }}</td>
          <td class="px-4 py-3 text-text-2">{{ usuario.email }}</td>
          <td class="px-4 py-3">
            <app-badge [color]="rolColor(usuario)" size="sm">{{ rolLabel(usuario) }}</app-badge>
          </td>
          <td class="px-4 py-3">
            <app-badge [color]="estadoColor(usuario)" size="sm">{{
              estadoLabel(usuario)
            }}</app-badge>
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-3">
              @if (canManage(usuario)) {
                <a
                  [attr.data-edit]="usuario.id"
                  [routerLink]="['/users', usuario.id]"
                  class="text-sm font-medium text-primary hover:text-primary-dark"
                  >Editar</a
                >
                @if (usuario.estado === 'invitado') {
                  <button
                    type="button"
                    [attr.data-resend]="usuario.id"
                    class="text-sm font-medium text-primary hover:text-primary-dark"
                    (click)="resendInvitation(usuario)"
                  >
                    Reenviar invitación
                  </button>
                }
                <button
                  type="button"
                  [attr.data-toggle]="usuario.id"
                  class="text-sm font-medium hover:underline"
                  [ngClass]="
                    usuario.activo ? 'text-error hover:text-error-dark' : 'text-text-2'
                  "
                  (click)="askToggle(usuario)"
                >
                  {{ usuario.activo ? 'Desactivar' : 'Activar' }}
                </button>
              }
            </div>
          </td>
        </tr>
      }
    </app-table>

    @if (pendingToggle(); as usuario) {
      <app-modal
        [title]="usuario.activo ? 'Desactivar usuario' : 'Activar usuario'"
        [message]="
          usuario.activo
            ? '¿Desactivar a «' + usuario.nombre + '»? No podrá iniciar sesión hasta reactivarlo.'
            : '¿Reactivar a «' + usuario.nombre + '»? Podrá iniciar sesión nuevamente.'
        "
        [confirmLabel]="usuario.activo ? 'Desactivar' : 'Activar'"
        [confirmClassName]="usuario.activo ? 'bg-error hover:bg-error-dark' : 'bg-primary hover:bg-primary-dark'"
        (confirmed)="confirmToggle()"
        (cancelled)="cancelToggle()"
      />
    }
  `,
})
export class UsersPageComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly invitations = inject(UsersInvitationService);
  private readonly router = inject(Router);
  private readonly roles = inject(RoleService);

  readonly canWrite = computed(() => this.roles.hasRole('admin'));

  readonly usuarios = signal<Usuario[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly pendingToggle = signal<Usuario | null>(null);

  ngOnInit(): void {
    this.consumeFlashes();
    void this.load();
  }

  /** Consumes success/error flashes set by the form navigation (D5, D11). */
  consumeFlashes(): void {
    const flash = consumeNavigationFlash();
    if (flash !== null) {
      this.successMessage.set(this.flashMessageFor(flash));
    }
    const flashError = consumeNavigationFlashError();
    if (flashError !== null) {
      this.errorMessage.set(flashError);
    }
  }

  /** Mirrors `usuario.service.ts`: admin manages editors, superadmin also admins. */
  canManage(usuario: Usuario): boolean {
    if (this.roles.hasRole('superadmin')) {
      return usuario.rol !== 'superadmin';
    }
    if (this.roles.hasRole('admin')) {
      return usuario.rol === 'editor';
    }
    return false;
  }

  rolLabel(usuario: Usuario): string {
    switch (usuario.rol) {
      case 'superadmin':
        return 'Superadmin';
      case 'admin':
        return 'Admin';
      case 'editor':
        return 'Editor';
    }
  }

  rolColor(usuario: Usuario): 'warning' | 'primary' | 'neutral' {
    switch (usuario.rol) {
      case 'superadmin':
        return 'warning';
      case 'admin':
        return 'primary';
      case 'editor':
        return 'neutral';
    }
  }

  estadoLabel(usuario: Usuario): string {
    return usuario.estado === 'activo' ? 'Activo' : 'Invitado';
  }

  estadoColor(usuario: Usuario): 'success' | 'info' {
    return usuario.estado === 'activo' ? 'success' : 'info';
  }

  addUsuario(): void {
    void this.router.navigate(['/users/new']);
  }

  async resendInvitation(usuario: Usuario): Promise<void> {
    this.errorMessage.set(null);
    try {
      await firstValueFrom(this.invitations.resendInvitation(usuario.email));
      this.successMessage.set('Invitación reenviada.');
    } catch {
      this.successMessage.set(null);
      this.errorMessage.set('No se pudo reenviar la invitación. Inténtalo nuevamente.');
    }
  }

  askToggle(usuario: Usuario): void {
    this.pendingToggle.set(usuario);
  }

  cancelToggle(): void {
    this.pendingToggle.set(null);
  }

  async confirmToggle(): Promise<void> {
    const usuario = this.pendingToggle();
    if (usuario === null) {
      return;
    }
    this.pendingToggle.set(null);
    this.errorMessage.set(null);
    try {
      await firstValueFrom(this.usersService.update(usuario.id, { activo: !usuario.activo }));
      this.successMessage.set(
        usuario.activo ? 'Usuario desactivado con éxito.' : 'Usuario activado con éxito.',
      );
      await this.load();
    } catch (error: unknown) {
      this.successMessage.set(null);
      this.errorMessage.set(
        error instanceof ApiError
          ? userActionErrorMessage(error)
          : 'No se pudo actualizar el usuario.',
      );
    }
  }

  private flashMessageFor(kind: FlashKind): string {
    switch (kind) {
      case 'created':
        return 'Invitación enviada al correo del usuario.';
      case 'updated':
        return 'Usuario actualizado con éxito.';
      case 'deleted':
        return 'Usuario eliminado con éxito.';
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const usuarios = await firstValueFrom(this.usersService.findAll());
      this.usuarios.set(usuarios);
    } catch {
      this.usuarios.set([]);
      this.errorMessage.set(userListLoadErrorMessage);
    } finally {
      this.loading.set(false);
    }
  }
}
