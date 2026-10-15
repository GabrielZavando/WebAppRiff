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

import { ApiError } from '../../../shared/api/api-client.service';
import { AlertComponent } from '../../../shared/components/ui/alert/alert.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { RoleService } from '../../auth/role.service';
import { fieldConflictMessage } from '../api-error-mapping';
import { CategoriaCreatePayload, CategoriaUpdatePayload } from '../models';
import { SubcategoriaListComponent } from '../components/subcategoria-list.component';
import { CategoriaService } from '../categoria.service';

/**
 * Category create/edit page (tasks 4.3–4.4, spec `admin-catalog-crud`).
 * `/categories/new` creates (POST); `/categories/:id` preloads and updates
 * (PATCH — design D3) and hosts the nested subcategories list (task 5.1).
 * Field validation follows the login pattern (touched + invalid → per-field
 * message); the backend 409 «Slug already in use» is mapped to the slug field
 * (design D9). Success navigates back to the list with a flash banner (D5).
 */
@Component({
  selector: 'app-categoria-form-page',
  imports: [
    ReactiveFormsModule,
    NgClass,
    AlertComponent,
    ButtonComponent,
    PageBreadcrumbComponent,
    SubcategoriaListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-breadcrumb [pageTitle]="isEdit() ? 'Editar categoría' : 'Nueva categoría'" />

    @if (formError(); as message) {
      <app-alert variant="error" [message]="message" class="mb-4 block" />
    }

    <form [formGroup]="form" (submit)="onSubmit($event)" class="max-w-2xl">
      <div class="border border-border bg-white p-6">
        <div class="flex flex-col gap-4">
          <div>
            <label for="categoria-nombre" class="mb-1 block text-sm font-medium text-text"
              >Nombre <span aria-hidden="true" class="text-error">*</span></label
            >
            <input
              id="categoria-nombre"
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
            <label for="categoria-slug" class="mb-1 block text-sm font-medium text-text">Slug</label>
            <input
              id="categoria-slug"
              data-form-slug
              type="text"
              class="h-11 w-full border bg-white px-3 text-sm focus:outline-none focus:border-primary"
              [ngClass]="slugConflict() ? 'border-error' : 'border-border'"
              formControlName="slug"
            />
            @if (slugConflict(); as message) {
              <p data-error-slug class="mt-1 text-xs text-error">{{ message }}</p>
            }
            @else {
              <p class="mt-1 text-xs text-text-2">Opcional: se genera desde el nombre si se deja vacío.</p>
            }
          </div>

          <div>
            <label for="categoria-orden" class="mb-1 block text-sm font-medium text-text">Orden</label>
            <input
              id="categoria-orden"
              data-form-orden
              type="number"
              min="0"
              class="h-11 w-full border border-border bg-white px-3 text-sm focus:outline-none focus:border-primary"
              formControlName="orden"
            />
          </div>

          <label class="flex items-center gap-2 text-sm font-medium text-text">
            <input data-form-activa type="checkbox" formControlName="activa" class="size-4" />
            Categoría activa
          </label>
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
            {{ isEdit() ? 'Guardar cambios' : 'Crear categoría' }}
          </app-button>
        </div>
      </div>
    </form>

    @if (isEdit() && categoriaId(); as id) {
      <app-subcategoria-list [categoriaId]="id" />
    }
  `,
})
export class CategoriaFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoriaService = inject(CategoriaService);
  private readonly roles = inject(RoleService);

  readonly canWrite = computed(() => this.roles.hasRole('admin', 'superadmin'));

  readonly isEdit = signal(false);
  readonly categoriaId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly slugConflict = signal<string | null>(null);

  readonly form = new FormGroup({
    nombre: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    slug: new FormControl<string>('', { nonNullable: true }),
    orden: new FormControl<number>(0, { nonNullable: true, validators: [Validators.min(0)] }),
    activa: new FormControl<boolean>(true, { nonNullable: true }),
  });

  get nombre(): FormControl<string> {
    return this.form.controls.nombre;
  }

  get slug(): FormControl<string> {
    return this.form.controls.slug;
  }

  get showNombreError(): boolean {
    return this.nombre.touched && this.nombre.invalid;
  }

  get nombreErrorMessage(): string {
    return this.nombre.hasError('required') ? 'El nombre es obligatorio.' : 'Nombre inválido.';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id !== null) {
      this.isEdit.set(true);
      this.categoriaId.set(id);
      void this.load(id);
    }
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CategoriaCreatePayload = {
      nombre: this.form.controls.nombre.value.trim(),
      slug: this.form.controls.slug.value.trim() || undefined,
      orden: this.form.controls.orden.value,
      activa: this.form.controls.activa.value,
    };

    this.saving.set(true);
    this.formError.set(null);
    this.slugConflict.set(null);
    try {
      const editId = this.categoriaId();
      if (editId !== null) {
        await firstValueFrom(
          this.categoriaService.update(editId, payload as CategoriaUpdatePayload),
        );
        await this.router.navigate(['/categories'], { state: { flash: 'updated' } });
      } else {
        await firstValueFrom(this.categoriaService.create(payload));
        await this.router.navigate(['/categories'], { state: { flash: 'created' } });
      }
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        const conflict = fieldConflictMessage(error);
        if (conflict !== null && conflict.field === 'slug') {
          this.slugConflict.set(conflict.message);
        } else {
          this.formError.set(error.message);
        }
      } else {
        this.formError.set('No se pudo guardar la categoría.');
      }
    } finally {
      this.saving.set(false);
    }
  }

  backToList(): void {
    void this.router.navigate(['/categories']);
  }

  private async load(id: string): Promise<void> {
    try {
      const categoria = await firstValueFrom(this.categoriaService.findById(id));
      this.form.patchValue({
        nombre: categoria.nombre,
        slug: categoria.slug,
        orden: categoria.orden,
        activa: categoria.activa,
      });
    } catch (error: unknown) {
      this.formError.set(
        error instanceof ApiError ? error.message : 'No se pudo cargar la categoría.',
      );
    }
  }
}
