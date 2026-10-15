import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

import { ApiError } from '../../../shared/api/api-client.service';
import { AlertComponent } from '../../../shared/components/ui/alert/alert.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { TableComponent } from '../../../shared/components/ui/table/table.component';
import { RoleService } from '../../auth/role.service';
import { deleteErrorMessage, loadErrorMessage } from '../api-error-mapping';
import { flashMessage } from '../flash-state';
import { Subcategoria } from '../models';
import { SubcategoriaService } from '../subcategoria.service';

/**
 * Nested subcategories list (task 5.1, spec `admin-catalog-crud`): rendered
 * below the category form on `/categories/:id`. Lists the subcategories of
 * the category (server-side `?categoriaId=` filter) with add/edit/delete
 * actions and inline success/error banners. Create/delete actions are hidden
 * for editors (spec `admin-role-access`).
 */
@Component({
  selector: 'app-subcategoria-list',
  imports: [
    RouterLink,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    ModalComponent,
    TableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt-8">
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="font-heading text-lg font-semibold text-secondary">Subcategorías</h2>
        @if (canWrite()) {
          <app-button data-add-sub size="sm" (btnClick)="addSubcategoria()">
            Añadir subcategoría
          </app-button>
        }
      </div>

      @if (successMessage(); as message) {
        <app-alert variant="success" [message]="message" class="mb-4 block" />
      }
      @if (errorMessage(); as message) {
        <app-alert variant="error" [message]="message" class="mb-4 block" />
      }

      <app-table
        [empty]="!loading() && subcategorias().length === 0"
        emptyMessage="Sin subcategorías."
      >
        <tr appTableHeaderRow>
          <th class="px-4 py-3">Nombre</th>
          <th class="px-4 py-3">Slug</th>
          <th class="px-4 py-3">Orden</th>
          <th class="px-4 py-3">Activa</th>
          <th class="px-4 py-3">Acciones</th>
        </tr>
        @for (subcategoria of subcategorias(); track subcategoria.id) {
          <tr appTableRow class="border-t border-border">
            <td class="px-4 py-3 font-medium text-secondary">{{ subcategoria.nombre }}</td>
            <td class="px-4 py-3 text-text-2">{{ subcategoria.slug }}</td>
            <td class="px-4 py-3">{{ subcategoria.orden }}</td>
            <td class="px-4 py-3">
              @if (subcategoria.activa) {
                <app-badge color="success" size="sm">Activa</app-badge>
              } @else {
                <app-badge color="neutral" size="sm">Inactiva</app-badge>
              }
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <a
                  [attr.data-edit]="subcategoria.id"
                  [routerLink]="['/categories', categoriaId, 'subcategories', subcategoria.id]"
                  class="text-sm font-medium text-primary hover:text-primary-dark"
                  >Editar</a
                >
                @if (canWrite()) {
                  <button
                    type="button"
                    [attr.data-delete]="subcategoria.id"
                    class="text-sm font-medium text-error hover:text-error-dark"
                    (click)="askDelete(subcategoria)"
                  >
                    Eliminar
                  </button>
                }
              </div>
            </td>
          </tr>
        }
      </app-table>

      @if (pendingDelete(); as subcategoria) {
        <app-modal
          title="Eliminar subcategoría"
          [message]="'¿Eliminar la subcategoría «' + subcategoria.nombre + '»? Esta acción no se puede deshacer.'"
          confirmLabel="Eliminar"
          (confirmed)="confirmDelete()"
          (cancelled)="cancelDelete()"
        />
      }
    </section>
  `,
})
export class SubcategoriaListComponent implements OnInit {
  private readonly subcategoriaService = inject(SubcategoriaService);
  private readonly router = inject(Router);
  private readonly roles = inject(RoleService);

  /** Parent category id, provided by the detail page route. */
  @Input({ required: true }) categoriaId!: string;

  readonly canWrite = computed(() => this.roles.hasRole('admin', 'superadmin'));

  readonly subcategorias = signal<Subcategoria[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly pendingDelete = signal<Subcategoria | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  addSubcategoria(): void {
    void this.router.navigate(['/categories', this.categoriaId, 'subcategories', 'new']);
  }

  askDelete(subcategoria: Subcategoria): void {
    this.pendingDelete.set(subcategoria);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  async confirmDelete(): Promise<void> {
    const subcategoria = this.pendingDelete();
    if (subcategoria === null) {
      return;
    }
    this.pendingDelete.set(null);
    this.errorMessage.set(null);
    try {
      await firstValueFrom(this.subcategoriaService.remove(subcategoria.id));
      this.successMessage.set(flashMessage('deleted', 'subcategoría'));
      await this.load();
    } catch (error: unknown) {
      this.successMessage.set(null);
      this.errorMessage.set(
        error instanceof ApiError
          ? deleteErrorMessage(error)
          : 'No se pudo eliminar la subcategoría.',
      );
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const subcategorias = await firstValueFrom(
        this.subcategoriaService.findByCategoria(this.categoriaId),
      );
      this.subcategorias.set(subcategorias);
    } catch (error: unknown) {
      this.subcategorias.set([]);
      this.errorMessage.set(
        error instanceof ApiError
          ? loadErrorMessage(error)
          : 'No se pudo cargar el listado de subcategorías.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
