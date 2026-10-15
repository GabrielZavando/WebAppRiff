import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, firstValueFrom, Subject } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

import { AlertComponent } from '../../../shared/components/ui/alert/alert.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { TableComponent } from '../../../shared/components/ui/table/table.component';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ApiError } from '../../../shared/api/api-client.service';
import { RoleService } from '../../auth/role.service';
import { loadErrorMessage } from '../api-error-mapping';
import { consumeNavigationFlash, flashMessage } from '../flash-state';
import { Categoria, Producto } from '../models';
import { CategoriaService } from '../categoria.service';
import { ProductService } from '../product.service';

/** Server-side page size, aligned with the backend default (24). */
const PAGE_SIZE = 24;

/**
 * Products list page (tasks 6.1–6.5, spec `admin-catalog-crud`): server-side
 * paginated table (`?page&limit`, default 24) with the total counter read
 * from `meta.total` (shown only when numeric — no fallback), debounced
 * server-side search (`?search=`), category filter (`?categoriaId=`, fed by
 * the full category list), and add/edit/delete actions with inline banners.
 * Create/delete actions are hidden for editors (spec `admin-role-access`).
 */
@Component({
  selector: 'app-products-page',
  imports: [
    ReactiveFormsModule,
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
    <app-page-breadcrumb pageTitle="Productos" />

    @if (successMessage(); as message) {
      <app-alert variant="success" [message]="message" class="mb-4 block" />
    }
    @if (errorMessage(); as message) {
      <app-alert variant="error" [message]="message" class="mb-4 block" />
    }

    <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex flex-col gap-3 sm:flex-row">
        <input
          data-search
          type="search"
          placeholder="Buscar productos…"
          class="h-11 w-full max-w-xs border border-border bg-white px-3 text-sm focus:outline-none focus:border-primary"
          [value]="searchTerm()"
          (input)="onSearchInput($any($event.target).value)"
        />
        <select
          data-categoria-filter
          class="h-11 w-full max-w-xs border border-border bg-white px-3 text-sm focus:outline-none focus:border-primary"
          [formControl]="categoriaFilterControl"
        >
          <option value="">Todas las categorías</option>
          @for (categoria of categorias(); track categoria.id) {
            <option [value]="categoria.id">{{ categoria.nombre }}</option>
          }
        </select>
      </div>
      @if (canWrite()) {
        <app-button data-add (btnClick)="addProducto()">Añadir producto</app-button>
      }
    </div>

    @if (total() !== null) {
      <p data-total-counter class="mb-2 text-sm font-medium text-text-2">
        {{ total() }} productos en total
      </p>
    }

    <app-table
      [empty]="!loading() && productos().length === 0"
      emptyMessage="No hay productos."
    >
      <tr appTableHeaderRow>
        <th class="px-4 py-3">Título / SKU</th>
        <th class="px-4 py-3">Categoría</th>
        <th class="px-4 py-3">Precio</th>
        <th class="px-4 py-3">Stock</th>
        <th class="px-4 py-3">Publicado</th>
        <th class="px-4 py-3">Destacado</th>
        <th class="px-4 py-3">Acciones</th>
      </tr>
      @for (producto of productos(); track producto.id) {
        <tr appTableRow class="border-t border-border">
          <td class="px-4 py-3">
            <span class="block font-medium text-secondary">{{ producto.titulo }}</span>
            <span class="block text-xs text-text-2">{{ producto.sku }}</span>
          </td>
          <td class="px-4 py-3 text-text-2">{{ categoriaNombre(producto.categoriaId) }}</td>
          <td class="px-4 py-3">{{ producto.precio.valor }}</td>
          <td class="px-4 py-3">{{ stockLabel(producto) }}</td>
          <td class="px-4 py-3">
            @if (producto.publicado) {
              <app-badge color="success" size="sm">Publicado</app-badge>
            } @else {
              <app-badge color="warning" size="sm">Borrador</app-badge>
            }
          </td>
          <td class="px-4 py-3">{{ producto.destacado ? 'Sí' : 'No' }}</td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-3">
              <a
                [attr.data-edit]="producto.id"
                [routerLink]="['/products', producto.id]"
                class="text-sm font-medium text-primary hover:text-primary-dark"
                >Editar</a
              >
              @if (canWrite()) {
                <button
                  type="button"
                  [attr.data-delete]="producto.id"
                  class="text-sm font-medium text-error hover:text-error-dark"
                  (click)="askDelete(producto)"
                >
                  Eliminar
                </button>
              }
            </div>
          </td>
        </tr>
      }
    </app-table>

    <div class="mt-4 flex items-center justify-between">
      <button
        type="button"
        data-prev
        class="border border-border bg-white px-4 py-2 text-sm font-medium text-text transition hover:bg-bg disabled:cursor-not-allowed disabled:opacity-50"
        [disabled]="!canGoPrev()"
        (click)="goToPage(page() - 1)"
      >
        Anterior
      </button>
      <span data-page-indicator class="text-sm text-text-2">
        Página {{ page() }}@if (totalPages() !== null) { de {{ totalPages() }} }
      </span>
      <button
        type="button"
        data-next
        class="border border-border bg-white px-4 py-2 text-sm font-medium text-text transition hover:bg-bg disabled:cursor-not-allowed disabled:opacity-50"
        [disabled]="!canGoNext()"
        (click)="goToPage(page() + 1)"
      >
        Siguiente
      </button>
    </div>

    @if (pendingDelete(); as producto) {
      <app-modal
        title="Eliminar producto"
        [message]="'¿Eliminar el producto «' + producto.titulo + '»? Esta acción no se puede deshacer.'"
        confirmLabel="Eliminar"
        (confirmed)="confirmDelete()"
        (cancelled)="cancelDelete()"
      />
    }
  `,
})
export class ProductsPageComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly router = inject(Router);
  private readonly roles = inject(RoleService);

  /** Search terms debounce into server-side queries (spec: server-side search). */
  private readonly searchTerms = new Subject<string>();

  readonly pageSize = PAGE_SIZE;
  readonly canWrite = computed(() => this.roles.hasRole('admin', 'superadmin'));

  readonly productos = signal<Producto[]>([]);
  readonly categorias = signal<Categoria[]>([]);
  readonly total = signal<number | null>(null);
  readonly page = signal(1);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly pendingDelete = signal<Producto | null>(null);

  readonly categoriaFilterControl = new FormControl<string>('', { nonNullable: true });

  readonly totalPages = computed(() => {
    const total = this.total();
    return total === null ? null : Math.max(1, Math.ceil(total / PAGE_SIZE));
  });

  readonly canGoPrev = computed(() => this.page() > 1);

  readonly canGoNext = computed(() => {
    const total = this.total();
    if (total !== null) {
      return this.page() * PAGE_SIZE < total;
    }
    // Unknown total: allow advancing while the page came back full.
    return this.productos().length === PAGE_SIZE;
  });

  constructor() {
    this.searchTerms
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.page.set(1);
        void this.load();
      });
    this.categoriaFilterControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((categoriaId) => {
        this.page.set(1);
        void this.load(categoriaId === '' ? undefined : categoriaId);
      });
  }

  ngOnInit(): void {
    const flash = consumeNavigationFlash();
    if (flash !== null) {
      this.successMessage.set(flashMessage(flash, 'producto'));
    }
    void this.load();
    void this.loadCategorias();
  }

  categoriaNombre(categoriaId: string): string {
    const categoria = this.categorias().find((c) => c.id === categoriaId);
    return categoria?.nombre ?? categoriaId;
  }

  stockLabel(producto: Producto): string {
    if (!producto.stock.disponible) {
      return 'No';
    }
    return producto.stock.cantidad === null ? 'Sí' : String(producto.stock.cantidad);
  }

  onSearchInput(value: string): void {
    this.searchTerms.next(value);
  }

  addProducto(): void {
    void this.router.navigate(['/products/new']);
  }

  goToPage(target: number): void {
    if (target < 1) {
      return;
    }
    this.page.set(target);
    void this.load();
  }

  askDelete(producto: Producto): void {
    this.pendingDelete.set(producto);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  async confirmDelete(): Promise<void> {
    const producto = this.pendingDelete();
    if (producto === null) {
      return;
    }
    this.pendingDelete.set(null);
    this.errorMessage.set(null);
    try {
      await firstValueFrom(this.productService.remove(producto.id));
      this.successMessage.set(flashMessage('deleted', 'producto'));
      await this.load();
    } catch (error: unknown) {
      this.successMessage.set(null);
      this.errorMessage.set(
        error instanceof ApiError ? error.message : 'No se pudo eliminar el producto.',
      );
    }
  }

  private async load(categoriaIdOverride?: string): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const categoriaId =
        categoriaIdOverride ?? this.categoriaFilterControl.value ?? '';
      const { items, meta } = await firstValueFrom(
        this.productService.findAll({
          page: this.page(),
          limit: PAGE_SIZE,
          search: this.searchTerm() === '' ? undefined : this.searchTerm(),
          categoriaId: categoriaId === '' ? undefined : categoriaId,
        }),
      );
      this.productos.set(items);
      this.total.set(meta?.total ?? null);
    } catch (error: unknown) {
      this.productos.set([]);
      this.total.set(null);
      this.errorMessage.set(
        error instanceof ApiError
          ? loadErrorMessage(error)
          : 'No se pudo cargar el listado de productos.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  private async loadCategorias(): Promise<void> {
    try {
      const categorias = await firstValueFrom(this.categoriaService.findAll());
      this.categorias.set(categorias);
    } catch {
      // The filter degrades to an empty list; the table still works.
      this.categorias.set([]);
    }
  }
}
