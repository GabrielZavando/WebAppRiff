import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';

import { CategoriesPageComponent } from './categories-page.component';
import { RoleService } from '../../auth/role.service';
import { Categoria } from '../models';

const API_BASE = 'http://localhost:3000/api/v1';

function buildCategoria(id: string, overrides: Partial<Categoria> = {}): Categoria {
  return {
    id,
    nombre: `Categoría ${id}`,
    slug: `categoria-${id}`,
    orden: 0,
    activa: true,
    esDefault: false,
    creadoEn: '2026-10-14T10:00:00Z',
    actualizadoEn: '2026-10-14T10:00:00Z',
    ...overrides,
  };
}

/**
 * Categories list page (tasks 4.1–4.2, spec `admin-catalog-crud`): table with
 * nombre/slug/orden/activa, client-side search, empty state, load-error banner,
 * add/edit navigation, and delete with confirmation + inline banners.
 */
describe('CategoriesPageComponent (tasks 4.1–4.2)', () => {
  let fixture: ComponentFixture<CategoriesPageComponent>;
  let http: HttpTestingController;
  let router: Router;
  let navigateSpy: ReturnType<typeof vi.fn>;

  async function flushList(categorias: Categoria[]): Promise<void> {
    const req = http.expectOne(`${API_BASE}/categories`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: categorias, error: null, meta: null });
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function render(): HTMLElement {
    fixture = TestBed.createComponent(CategoriesPageComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    history.replaceState({}, '');
    TestBed.configureTestingModule({
      imports: [CategoriesPageComponent],
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

  describe('[4.1] listado', () => {
    it('renders the nombre/slug/orden/activa table with the loaded rows', async () => {
      const el = render();
      await flushList([buildCategoria('c1'), buildCategoria('c2', { activa: false })]);

      expect(el.querySelectorAll('tbody tr').length).toBe(2);
      expect(el.textContent).toContain('Categoría c1');
      expect(el.textContent).toContain('categoria-c1');
      expect(el.textContent).toContain('Inactiva');
    });

    it('filters client-side without emitting new backend requests', async () => {
      const el = render();
      await flushList([buildCategoria('c1'), buildCategoria('c2')]);

      const input = el.querySelector('[data-search]') as HTMLInputElement;
      input.value = 'c2';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(el.querySelectorAll('tbody tr').length).toBe(1);
      expect(el.textContent).toContain('Categoría c2');
    });

    it('shows the empty state when there are no categories', async () => {
      const el = render();
      await flushList([]);

      expect(el.querySelector('[data-table-empty]')?.textContent).toContain('No hay categorías');
    });

    it('shows an error banner when the load fails', async () => {
      const el = render();
      const req = http.expectOne(`${API_BASE}/categories`);
      req.flush(
        { data: null, error: { message: 'Internal error', code: 'X' }, meta: null },
        { status: 500, statusText: 'Server Error' },
      );
      await fixture.whenStable();
      fixture.detectChanges();

      const banner = el.querySelector('[data-alert]') as HTMLElement;
      expect(banner).not.toBeNull();
      expect(banner.textContent).toContain('Internal error');
    });
  });

  describe('[4.2] acciones', () => {
    it('navigates to /categories/new on Añadir categoría', async () => {
      const el = render();
      await flushList([]);

      const addButton = el.querySelector('[data-add] button') as HTMLButtonElement;
      addButton.click();

      expect(navigateSpy).toHaveBeenCalledWith(['/categories/new']);
    });

    it('links Editar to /categories/:id', async () => {
      const el = render();
      await flushList([buildCategoria('c1')]);

      const editLink = el.querySelector('[data-edit="c1"]') as HTMLAnchorElement;
      expect(editLink.getAttribute('href')).toBe('/categories/c1');
    });

    it('deletes after confirmation, reloads and shows the success banner', async () => {
      const el = render();
      await flushList([buildCategoria('c1')]);

      (el.querySelector('[data-delete="c1"]') as HTMLButtonElement).click();
      fixture.detectChanges();

      const modal = el.querySelector('[role="dialog"]');
      expect(modal).not.toBeNull();

      (el.querySelector('[data-modal-confirm]') as HTMLButtonElement).click();
      const deleteReq = http.expectOne(`${API_BASE}/categories/c1`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush({ data: null, error: null, meta: null });

      // The reload fires once the DELETE promise chain resumes (microtask).
      await fixture.whenStable();
      fixture.detectChanges();
      await flushList([buildCategoria('c2')]);

      const banner = el.querySelector('[data-alert]') as HTMLElement;
      expect(banner.textContent).toContain('Categoría eliminada con éxito.');
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('does not emit DELETE when the modal is cancelled', async () => {
      const el = render();
      await flushList([buildCategoria('c1')]);

      (el.querySelector('[data-delete="c1"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      (el.querySelector('[data-modal-cancel]') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(el.querySelector('[role="dialog"]')).toBeNull();
    });

    it('maps the 409 delete blocker to an error banner and keeps the row', async () => {
      const el = render();
      await flushList([buildCategoria('c1')]);

      (el.querySelector('[data-delete="c1"]') as HTMLButtonElement).click();
      fixture.detectChanges();
      (el.querySelector('[data-modal-confirm]') as HTMLButtonElement).click();

      const deleteReq = http.expectOne(`${API_BASE}/categories/c1`);
      deleteReq.flush(
        {
          data: null,
          error: { message: 'Cannot delete a category with associated products', code: 'CONFLICT' },
          meta: null,
        },
        { status: 409, statusText: 'Conflict' },
      );
      await fixture.whenStable();
      fixture.detectChanges();

      const banner = el.querySelector('[data-alert]') as HTMLElement;
      expect(banner.textContent).toContain(
        'No se puede eliminar: la categoría tiene productos asociados.',
      );
      expect(el.querySelectorAll('tbody tr').length).toBe(1);
    });

    it('shows the success banner after arriving with a flash state and clears it', async () => {
      history.replaceState({ flash: 'created' }, '');
      const el = render();
      await flushList([]);

      const banner = el.querySelector('[data-alert]') as HTMLElement;
      expect(banner.textContent).toContain('Categoría creada con éxito.');
      expect((history.state as { flash?: string }).flash).toBeUndefined();

      // Task 7.2: a reload (F5) re-mounts the page against the SAME history
      // state — already consumed, so no banner again. And no toast anywhere.
      const elReload = render();
      await flushList([]);
      expect(elReload.querySelector('[data-alert]')).toBeNull();
      expect(elReload.querySelector('[data-toast]')).toBeNull();
      expect(elReload.querySelector('app-toast')).toBeNull();
    });
  });
});
