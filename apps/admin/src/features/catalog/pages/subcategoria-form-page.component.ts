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
import { SubcategoriaCreatePayload, SubcategoriaUpdatePayload } from '../models';
import { SubcategoriaService } from '../subcategoria.service';

/**
 * Subcategory create/edit page (tasks 5.2–5.3, spec `admin-catalog-crud`),
 * nested under `/categories/:id`. The `categoriaId` comes from the route —
 * the form offers NO category selector. Create POSTs `/subcategories`; edit
 * preloads `GET /subcategories/:subId` and PATCHes. The per-category slug
 * conflict maps to the slug field (design D9); success returns to the parent
 * detail with a flash banner (D5).
 */
@Component({
  selector: 'app-subcategoria-form-page',
  imports: [ReactiveFormsModule, NgClass, AlertComponent, ButtonComponent, PageBreadcrumbComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-breadcrumb [pageTitle]="isEdit() ? 'Editar subcategoría' : 'Nueva subcategoría'" />

    @if (formError(); as message) {
      <app-alert variant="error" [message]="message" class="mb-4 block" />
    }

    <form [formGroup]="form" (submit)="onSubmit($event)" class="max-w-2xl">
      <div class="border border-border bg-white p-6">
        <div class="flex flex-col gap-4">
          <div>
            <label for="sub-nombre" class="mb-1 block text-sm font-medium text-text"
              >Nombre <span aria-hidden="true" class="text-error">*</span></label
            >
            <input
              id="sub-nombre"
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
            <label for="sub-slug" class="mb-1 block text-sm font-medium text-text">Slug</label>
            <input
              id="sub-slug"
              data-form-slug
              type="text"
              class="h-11 w-full border bg-white px-3 text-sm focus:outline-none focus:border-primary"
              [ngClass]="slugConflict() ? 'border-error' : 'border-border'"
              formControlName="slug"
            />
            @if (slugConflict(); as message) {
              <p data-error-slug class="mt-1 text-xs text-error">{{ message }}</p>
            } @else {
              <p class="mt-1 text-xs text-text-2">
                Opcional: se genera desde el nombre si se deja vacío. Único dentro de la categoría.
              </p>
            }
          </div>

          <div>
            <label for="sub-orden" class="mb-1 block text-sm font-medium text-text">Orden</label>
            <input
              id="sub-orden"
              data-form-orden
              type="number"
              min="0"
              class="h-11 w-full border border-border bg-white px-3 text-sm focus:outline-none focus:border-primary"
              formControlName="orden"
            />
          </div>

          <label class="flex items-center gap-2 text-sm font-medium text-text">
            <input data-form-activa type="checkbox" formControlName="activa" class="size-4" />
            Subcategoría activa
          </label>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            data-form-back
            class="bg-white px-4 py-2.5 text-xs font-heading font-semibold uppercase tracking-wide text-text border border-border transition hover:bg-bg"
            (click)="backToDetail()"
          >
            Volver a la categoría
          </button>
          <app-button data-form-save type="submit" [disabled]="form.invalid || saving()">
            {{ isEdit() ? 'Guardar cambios' : 'Crear subcategoría' }}
          </app-button>
        </div>
      </div>
    </form>
  `,
})
export class SubcategoriaFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly subcategoriaService = inject(SubcategoriaService);
  private readonly roles = inject(RoleService);

  readonly canWrite = computed(() => this.roles.hasRole('admin', 'superadmin'));

  readonly isEdit = signal(false);
  readonly categoriaId = signal<string | null>(null);
  readonly subId = signal<string | null>(null);
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

  get showNombreError(): boolean {
    return this.nombre.touched && this.nombre.invalid;
  }

  get nombreErrorMessage(): string {
    return this.nombre.hasError('required') ? 'El nombre es obligatorio.' : 'Nombre inválido.';
  }

  ngOnInit(): void {
    const categoriaId = this.route.snapshot.paramMap.get('id');
    const subId = this.route.snapshot.paramMap.get('subId');
    if (categoriaId === null) {
      this.formError.set('Falta la categoría en la ruta.');
      return;
    }
    this.categoriaId.set(categoriaId);
    if (subId !== null) {
      this.isEdit.set(true);
      this.subId.set(subId);
      void this.load(subId);
    }
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const categoriaId = this.categoriaId();
    if (categoriaId === null) {
      return;
    }

    const payload: SubcategoriaCreatePayload = {
      categoriaId,
      nombre: this.form.controls.nombre.value.trim(),
      slug: this.form.controls.slug.value.trim() || undefined,
      orden: this.form.controls.orden.value,
      activa: this.form.controls.activa.value,
    };

    this.saving.set(true);
    this.formError.set(null);
    this.slugConflict.set(null);
    try {
      const subId = this.subId();
      if (subId !== null) {
        const update: SubcategoriaUpdatePayload = {
          nombre: payload.nombre,
          slug: payload.slug,
          orden: payload.orden,
          activa: payload.activa,
        };
        await firstValueFrom(this.subcategoriaService.update(subId, update));
        await this.router.navigate(['/categories', categoriaId], {
          state: { flash: 'updated' },
        });
      } else {
        await firstValueFrom(this.subcategoriaService.create(payload));
        await this.router.navigate(['/categories', categoriaId], {
          state: { flash: 'created' },
        });
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
        this.formError.set('No se pudo guardar la subcategoría.');
      }
    } finally {
      this.saving.set(false);
    }
  }

  backToDetail(): void {
    const categoriaId = this.categoriaId();
    if (categoriaId !== null) {
      void this.router.navigate(['/categories', categoriaId]);
    }
  }

  private async load(subId: string): Promise<void> {
    try {
      const subcategoria = await firstValueFrom(this.subcategoriaService.findById(subId));
      this.form.patchValue({
        nombre: subcategoria.nombre,
        slug: subcategoria.slug,
        orden: subcategoria.orden,
        activa: subcategoria.activa,
      });
    } catch (error: unknown) {
      this.formError.set(
        error instanceof ApiError ? error.message : 'No se pudo cargar la subcategoría.',
      );
    }
  }
}
