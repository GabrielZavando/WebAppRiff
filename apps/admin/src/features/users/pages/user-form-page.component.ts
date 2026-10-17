import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { AlertComponent } from '../../../shared/components/ui/alert/alert.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ApiError } from '../../../shared/api/api-client.service';
import { RoleService } from '../../auth/role.service';
import { INVITATION_FAILED_FLASH } from '../navigation-flash';
import { UsuarioCreatePayload, UsuarioUpdatePayload } from '../models';
import { UsersService } from '../users.service';
import { UsersInvitationService } from '../users-invitation.service';
import { userActionErrorMessage } from '../users-error-mapping';

/**
 * User create/edit page (tasks 7.1–7.2, 8.1–8.2; spec `admin-users`).
 *
 * `/users/new` creates via `POST /users` — never with a password (invitation
 * flow, design D3) — and then triggers the invitation email; if the POST
 * succeeded but the email failed, the list is flashed with an error banner
 * and the user remains re-invitable (design D11). `/users/:id` preloads,
 * keeps the email read-only (design D7) and updates via `PATCH` (design D4);
 * only a superadmin sees the role select in edition. Field validation follows
 * the catalog pattern (touched + invalid → per-field Spanish message).
 */
@Component({
  selector: 'app-user-form-page',
  imports: [ReactiveFormsModule, NgClass, AlertComponent, ButtonComponent, PageBreadcrumbComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-breadcrumb [pageTitle]="isEdit() ? 'Editar usuario' : 'Nuevo usuario'" />

    @if (formError(); as message) {
      <app-alert data-form-error variant="error" [message]="message" class="mb-4 block" />
    }

    <form [formGroup]="form" (submit)="onSubmit($event)" class="max-w-2xl">
      <div class="border border-border bg-white p-6">
        <div class="flex flex-col gap-4">
          <div>
            <label for="user-nombre" class="mb-1 block text-sm font-medium text-text"
              >Nombre <span aria-hidden="true" class="text-error">*</span></label
            >
            <input
              id="user-nombre"
              data-form-nombre
              type="text"
              class="h-11 w-full border bg-white px-3 text-sm focus:outline-none focus:border-primary"
              [ngClass]="showNombreError ? 'border-error' : 'border-border'"
              formControlName="nombre"
            />
            @if (showNombreError) {
              <p data-error-nombre class="mt-1 text-xs text-error">{{ nombreErrorMessage }}</p>
            }
          </div>

          <div>
            <label for="user-email" class="mb-1 block text-sm font-medium text-text"
              >Correo <span aria-hidden="true" class="text-error">*</span></label
            >
            <input
              id="user-email"
              data-form-email
              type="email"
              class="h-11 w-full border bg-white px-3 text-sm focus:outline-none focus:border-primary"
              [ngClass]="showEmailError ? 'border-error' : 'border-border'"
              [readonly]="isEdit()"
              formControlName="email"
            />
            @if (showEmailError) {
              <p data-error-email class="mt-1 text-xs text-error">{{ emailErrorMessage }}</p>
            } @else if (isEdit()) {
              <p class="mt-1 text-xs text-text-2">
                El correo no se puede editar (es la identidad de Firebase Auth).
              </p>
            }
          </div>

          @if (!isEdit() || canChangeRoles()) {
            <div>
              <label for="user-rol" class="mb-1 block text-sm font-medium text-text">Rol</label>
              <select
                id="user-rol"
                data-form-rol
                class="h-11 w-full border border-border bg-white px-3 text-sm focus:outline-none focus:border-primary"
                formControlName="rol"
              >
                @for (option of roleOptions(); track option) {
                  <option [value]="option">{{ option === 'admin' ? 'Admin' : 'Editor' }}</option>
                }
              </select>
              @if (!canChangeRoles()) {
                <p class="mt-1 text-xs text-text-2">Con tu rol solo puedes crear editores.</p>
              }
            </div>
          }
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            data-form-back
            class="bg-white px-4 py-2.5 text-xs font-heading font-semibold uppercase tracking-wide text-text border border-border transition hover:bg-bg"
            (click)="backToList()"
          >
            Volver al listado
          </button>
          <app-button data-form-save type="submit" [disabled]="form.invalid || saving()">
            {{ isEdit() ? 'Guardar cambios' : 'Crear e invitar' }}
          </app-button>
        </div>
      </div>
    </form>
  `,
})
export class UserFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersService = inject(UsersService);
  private readonly invitations = inject(UsersInvitationService);
  private readonly roles = inject(RoleService);

  /** Only a superadmin can assign roles; an admin always creates editors (D7). */
  readonly canChangeRoles = computed(() => this.roles.hasRole('superadmin'));

  readonly isEdit = signal(false);
  readonly userId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly form = new FormGroup({
    nombre: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    rol: new FormControl<'admin' | 'editor'>('editor', { nonNullable: true }),
  });

  readonly roleOptions = computed<('admin' | 'editor')[]>(() =>
    this.canChangeRoles() ? ['editor', 'admin'] : ['editor'],
  );

  get nombre(): FormControl<string> {
    return this.form.controls.nombre;
  }

  get email(): FormControl<string> {
    return this.form.controls.email;
  }

  get showNombreError(): boolean {
    return this.nombre.touched && this.nombre.invalid;
  }

  get nombreErrorMessage(): string {
    return this.nombre.hasError('required') ? 'El nombre es obligatorio.' : 'Nombre inválido.';
  }

  get showEmailError(): boolean {
    return this.email.touched && this.email.invalid;
  }

  get emailErrorMessage(): string {
    return this.email.hasError('required') ? 'El correo es obligatorio.' : 'Ingresa un correo válido.';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id !== null) {
      this.isEdit.set(true);
      this.userId.set(id);
      void this.load(id);
    }
  }

  backToList(): void {
    void this.router.navigate(['/users']);
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const editId = this.userId();
    this.saving.set(true);
    this.formError.set(null);
    try {
      if (editId !== null) {
        const payload: UsuarioUpdatePayload = { nombre: this.nombre.value.trim() };
        if (this.canChangeRoles()) {
          payload.rol = this.form.controls.rol.value;
        }
        await firstValueFrom(this.usersService.update(editId, payload));
        await this.router.navigate(['/users'], { state: { flash: 'updated' } });
      } else {
        const payload: UsuarioCreatePayload = {
          nombre: this.nombre.value.trim(),
          email: this.email.value.trim(),
          rol: this.form.controls.rol.value,
        };
        const usuario = await firstValueFrom(this.usersService.create(payload));
        try {
          await firstValueFrom(this.invitations.sendInvitation(usuario.email));
          await this.router.navigate(['/users'], { state: { flash: 'created' } });
        } catch {
          // The user exists and is re-invitable from the list (design D11).
          await this.router.navigate(['/users'], { state: { flashError: INVITATION_FAILED_FLASH } });
        }
      }
    } catch (error: unknown) {
      this.formError.set(
        error instanceof ApiError
          ? userActionErrorMessage(error)
          : 'No se pudo guardar el usuario.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  private async load(id: string): Promise<void> {
    try {
      const usuario = await firstValueFrom(this.usersService.findById(id));
      this.form.patchValue({
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol === 'admin' ? 'admin' : 'editor',
      });
    } catch (error: unknown) {
      this.formError.set(
        error instanceof ApiError ? userActionErrorMessage(error) : 'No se pudo cargar el usuario.',
      );
    }
  }
}
