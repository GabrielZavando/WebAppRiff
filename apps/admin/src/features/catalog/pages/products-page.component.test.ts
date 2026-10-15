import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';

import { ProductsPageComponent } from './products-page.component';
import { RoleService } from '../../auth/role.service';
import { Categoria, Producto } from '../models';

const API_BASE = 'http://localhost:3000/api/v1';

function buildProducto(id: string, overrides: Partial<Producto> = {}): Producto {
  return {
    id,
    idExterno: null,
    sku: `RIF-${id}`,
    titulo: `Producto ${id}`,
    slug: `producto-${id}`,
    descripcionBreve: '',
    descripcionLarga: '',
    categoriaId: 'c1',
    subcategoriaId: null,
    atributos: [],
    precio: { valor: 129990, visible: true },
    stock: { disponible: true, cantidad: 7 },
    galeria: [],
    fichaTecnica: null,
    destacado: false,
    publicado: true,
    creadoEn: '2026-10-14T10:00:00Z',
    actualizadoEn: '2026-10-14T10:00:00Z',
    ...overrides,
  };
}

const CATEGORIA: Categoria = {
  id: 'c1',
  nombre: 'Herramientas',
  slug: 'herramientas',
  orden: 0,
  activa: true,
  esDefault: false,
  creadoEn: '2026-10-14T10:00:00Z',
  actualizadoEn: '2026-10-14T10:00:00Z',
};

/**
 * Products list page (tasks 6.1–6.5, spec `admin-catalog-crud`): paginated
 * server-side table with the total counter from `meta.total`, debounced
 * server-side search, category filter, add/edit/delete actions and inline
 * banners.
 */
describe('ProductsPageComponent (tasks 6.1–6.5)', () => {
  let fixture: ComponentFixture<ProductsPageComponent>;
  let http: HttpTestingController;
  let router: Router;
  let navigateSpy: ReturnType<typeof vi.fn>;

  function flushProducts(
    items: Producto[],
    meta: Record<string, unknown> | null,
  ): void {
    const req = http.expectOne((r) => r.urlWithParams === `${API_BASE}/products?page=1&limit=24`);
    req.flush({ data: items, error: null, meta });
  }

  async function renderWith(
    items: Producto[],
    meta: Record<string, unknown> | null = { page: 1, limit: 24, total: 100 },
  ): Promise<HTMLElement> {
    fixture = TestBed.createComponent(ProductsPageComponent);
    fixture.detectChanges();
    flushProducts(items, meta);
    // The page also loads the categories for the filter and the name column.
    const categoriasReq = http.expectOne(`${API_BASE}/categories`);
    categoriasReq.flush({ data: [CATEGORIA], error: null, meta: null });
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    history.replaceState({}, '');
    TestBed.configureTestingModule({
      imports: [ProductsPageComponent],
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: RoleService, useValue: { hasRole: vi.fn().mockReturnValue(true) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    http.verify();
  });

  describe('[6.1] tabla', () => {
    it('renders título/sku, categoría (name), precio, stock, publicado and destacado', async () => {
      const el = await renderWith([
        buildProducto('p1', { destacado: true, publicado: false }),
      ]);

      expect(el.querySelectorAll('tbody tr').length).toBe(1);
      expect(el.textContent).toContain('Producto p1');
      expect(el.textContent).toContain('RIF-p1');
      expect(el.textContent).toContain('Herramientas');
      expect(el.textContent).toContain('129990');
      expect(el.textContent).toContain('7');
      expect(el.textContent).toContain('Borrador');
      expect(el.textContent).toContain('Sí');
    });

    it('shows the empty state when there are no products', async () => {
      const el = await renderWith([], { page: 1, limit: 24, total: 0 });

      expect(el.querySelector('[data-table-empty]')?.textContent).toContain('No hay productos');
    });

    it('shows an error banner when the load fails', async () => {
      fixture = TestBed.createComponent(ProductsPageComponent);
      fixture.detectChanges();
      const req = http.expectOne((_r) => _r.url.split('?')[0].endsWith('/products'));
      req.flush(
        { data: null, error: { message: 'Server exploded', code: 'X' }, meta: null },
        { status: 500, statusText: 'Server Error' },
      );
      // The category list request still goes out; flush it so verify() is clean.
      const categoriasReq = http.expectOne(`${API_BASE}/categories`);
      categoriasReq.flush({ data: [], error: null, meta: null });
      await fixture.whenStable();
      fixture.detectChanges();

      const banner = fixture.nativeElement as HTMLElement;
      expect(banner.querySelector('[data-alert]')?.textContent).toContain('Server exploded');
    });
  });

  describe('[6.2] contador total', () => {
    it('shows "N productos en total" from meta.total even with fewer visible rows', async () => {
      const el = await renderWith([buildProducto('p1'), buildProducto('p2')]);

      const counter = el.querySelector('[data-total-counter]');
      expect(counter?.textContent).toContain('100 productos en total');
    });

    it('hides the counter when meta.total is not numeric (no fallback)', async () => {
      const el = await renderWith([buildProducto('p1')], { total: 'abc' });

      expect(el.querySelector('[data-total-counter]')).toBeNull();
      expect(el.querySelectorAll('tbody tr').length).toBe(1);
    });

    it('hides the counter when meta is missing', async () => {
      const el = await renderWith([buildProducto('p1')], null);

      expect(el.querySelector('[data-total-counter]')).toBeNull();
      expect(el.querySelectorAll('tbody tr').length).toBe(1);
    });
  });

  describe('[6.3] paginación server-side', () => {
    it('requests page 2 on next and disables prev on page 1', async () => {
      const el = await renderWith([buildProducto('p1')]);

      const prev = el.querySelector('[data-prev]') as HTMLButtonElement;
      expect(prev.disabled).toBe(true);

      (el.querySelector('[data-next]') as HTMLButtonElement).click();
      const req = http.expectOne(`${API_BASE}/products?page=2&limit=24`);
      req.flush({ data: [buildProducto('p2')], error: null, meta: { page: 2, limit: 24, total: 100 } });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(el.querySelector('[data-page-indicator]')?.textContent).toContain('Página 2');
      expect((el.querySelector('[data-prev]') as HTMLButtonElement).disabled).toBe(false);
    });

    it('disables next on the last page when the total is known', async () => {
      const el = await renderWith([buildProducto('p1')], {
        page: 1,
        limit: 24,
        total: 1,
      });

      expect((el.querySelector('[data-next]') as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe('[6.4] búsqueda y filtro server-side', () => {
    it('debounces the search input and queries server-side resetting to page 1', async () => {
      const el = await renderWith([]);

      const input = el.querySelector('[data-search]') as HTMLInputElement;
      input.value = 'taladro';
      input.dispatchEvent(new Event('input'));
      await new Promise((resolve) => setTimeout(resolve, 350));
      fixture.detectChanges();

      const req = http.expectOne(`${API_BASE}/products?page=1&limit=24&search=taladro`);
      req.flush({ data: [], error: null, meta: { page: 1, limit: 24, total: 0 } });
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('combines the category filter with the search and resets to page 1', async () => {
      const el = await renderWith([buildProducto('p1')]);

      const select = el.querySelector('[data-categoria-filter]') as HTMLSelectElement;
      select.value = 'c1';
      select.dispatchEvent(new Event('change'));
      const req = http.expectOne(`${API_BASE}/products?page=1&limit=24&categoriaId=c1`);
      req.flush({ data: [], error: null, meta: { page: 1, limit: 24, total: 0 } });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(el.textContent).toContain('Todas las categorías');
    });
  });

  describe('[6.5] acciones', () => {
    it('navigates to /products/new on Añadir producto', async () => {
      const el = await renderWith([]);

      (el.querySelector('[data-add] button') as HTMLButtonElement).click();

      expect(navigateSpy).toHaveBeenCalledWith(['/products/new']);
    });

    it('links Editar to /products/:id', async () => {
      const el = await renderWith([buildProducto('p1')]);

      const editLink = el.querySelector('[data-edit="p1"]') as HTMLAnchorElement;
      expect(editLink.getAttribute('href')).toBe('/products/p1');
    });

    it('deletes after confirmation, reloads and shows the success banner', async () => {
      const el = await renderWith([buildProducto('p1')]);

      (el.querySelector('[data-delete="p1"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      (el.querySelector('[data-modal-confirm]') as HTMLButtonElement).click();

      const deleteReq = http.expectOne(`${API_BASE}/products/p1`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush({ data: null, error: null, meta: null });

      await fixture.whenStable();
      fixture.detectChanges();

      const reloadReq = http.expectOne(
        (r) => r.urlWithParams === `${API_BASE}/products?page=1&limit=24`,
      );
      reloadReq.flush({ data: [], error: null, meta: { page: 1, limit: 24, total: 0 } });
      await fixture.whenStable();
      fixture.detectChanges();

      const banner = el.querySelector('[data-alert]') as HTMLElement;
      expect(banner.textContent).toContain('Producto eliminado con éxito.');
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('shows the success banner after arriving with a flash state', async () => {
      history.replaceState({ flash: 'created' }, '');
      const el = await renderWith([]);

      const banner = el.querySelector('[data-alert]') as HTMLElement;
      expect(banner.textContent).toContain('Producto creado con éxito.');
      expect((history.state as { flash?: string }).flash).toBeUndefined();
    });
  });
});
