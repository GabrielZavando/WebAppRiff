import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

import { AlertComponent } from '../../../shared/components/ui/alert/alert.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { TableComponent } from '../../../shared/components/ui/table/table.component';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { RoleService } from '../../auth/role.service';
import { ApiError } from '../../../shared/api/api-client.service';
import { deleteErrorMessage, loadErrorMessage } from '../api-error-mapping';
import { consumeNavigationFlash, flashMessage } from '../flash-state';
import { Categoria } from '../models';
import { CategoriaService } from '../categoria.service';

/**
 * Categories list page (tasks 4.1–4.2, spec `admin-catalog-crud`): table with
 * nombre/slug/orden/activa, client-side search (the backend has no `?search`
 * for this domain — design D6), add/edit navigation, delete with confirmation
 * modal and inline success/error banners (no toasts).
 */
@Component({
  selector: 'app-categories-page',
  imports: [
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
    <app-page-breadcrumb pageTitle="Categorías" />

    @if (successMessage(); as message) {
      <app-alert variant="success" [message]="message" class="mb-4 block" />
    }
    @if (errorMessage(); as message) {
      <app-alert variant="error" [message]="message" class="mb-4 block" />
    }

    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <input
        data-search
        type="search"
        placeholder="Buscar categorías…"
        class="h-11 w-full max-w-sm border border-border bg-white px-3 text-sm focus:outline-none focus:border-primary"
        [value]="searchTerm()"
        (input)="onSearchInput($any($event.target).value)"
      />
      @if (canWrite()) {
        <app-button data-add (btnClick)="addCategoria()">Añadir categoría</app-button>
      }
    </div>

    <app-table
      [empty]="!loading() && filtered().length === 0"
      emptyMessage="No hay categorías."
    >
      <tr appTableHeaderRow>
        <th class="px-4 py-3">Nombre</th>
        <th class="px-4 py-3">Slug</th>
        <th class="px-4 py-3">Orden</th>
        <th class="px-4 py-3">Activa</th>
        <th class="px-4 py-3">Acciones</th>
      </tr>
      @for (categoria of filtered(); track categoria.id) {
        <tr appTableRow class="border-t border-border">
          <td class="px-4 py-3 font-medium text-secondary">{{ categoria.nombre }}</td>
          <td class="px-4 py-3 text-text-2">{{ categoria.slug }}</td>
          <td class="px-4 py-3">{{ categoria.orden }}</td>
          <td class="px-4 py-3">
            @if (categoria.activa) {
              <app-badge color="success" size="sm">Activa</app-badge>
            } @else {
              <app-badge color="neutral" size="sm">Inactiva</app-badge>
            }
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-3">
              <a
                [attr.data-edit]="categoria.id"
                [routerLink]="['/categories', categoria.id]"
                class="text-sm font-medium text-primary hover:text-primary-dark"
                >Editar</a
              >
              @if (canWrite()) {
                <button
                  type="button"
                  [attr.data-delete]="categoria.id"
                  class="text-sm font-medium text-error hover:text-error-dark"
                  (click)="askDelete(categoria)"
                >
                  Eliminar
                </button>
              }
            </div>
          </td>
        </tr>
      }
    </app-table>

    @if (pendingDelete(); as categoria) {
      <app-modal
        title="Eliminar categoría"
        [message]="'¿Eliminar la categoría «' + categoria.nombre + '»? Esta acción no se puede deshacer.'"
        confirmLabel="Eliminar"
        (confirmed)="confirmDelete()"
        (cancelled)="cancelDelete()"
      />
    }
  `,
})
export class CategoriesPageComponent implements OnInit {
  private readonly categoriaService = inject(CategoriaService);
  private readonly router = inject(Router);
  private readonly roles = inject(RoleService);

  /** Create/delete actions are hidden — not disabled — for editors (D6). */
  readonly canWrite = computed(() => this.roles.hasRole('admin', 'superadmin'));

  readonly categorias = signal<Categoria[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly pendingDelete = signal<Categoria | null>(null);

  readonly filtered = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (term === '') {
      return this.categorias();
    }
    return this.categorias().filter(
      (categoria) =>
        categoria.nombre.toLowerCase().includes(term) ||
        categoria.slug.toLowerCase().includes(term),
    );
  });

  ngOnInit(): void {
    const flash = consumeNavigationFlash();
    if (flash !== null) {
      this.successMessage.set(flashMessage(flash, 'categoría'));
    }
    void this.load();
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  addCategoria(): void {
    void this.router.navigate(['/categories/new']);
  }

  askDelete(categoria: Categoria): void {
    this.pendingDelete.set(categoria);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  async confirmDelete(): Promise<void> {
    const categoria = this.pendingDelete();
    if (categoria === null) {
      return;
    }
    this.pendingDelete.set(null);
    this.errorMessage.set(null);
    try {
      await firstValueFrom(this.categoriaService.remove(categoria.id));
      this.successMessage.set('Categoría eliminada con éxito.');
      await this.load();
    } catch (error: unknown) {
      this.successMessage.set(null);
      this.errorMessage.set(
        error instanceof ApiError
          ? deleteErrorMessage(error)
          : 'No se pudo eliminar la categoría.',
      );
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const categorias = await firstValueFrom(this.categoriaService.findAll());
      this.categorias.set(categorias);
    } catch (error: unknown) {
      this.categorias.set([]);
      this.errorMessage.set(
        error instanceof ApiError
          ? loadErrorMessage(error)
          : 'No se pudo cargar el listado de categorías.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
