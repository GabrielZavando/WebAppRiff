import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';

import { SubcategoriaListComponent } from './subcategoria-list.component';
import { RoleService } from '../../auth/role.service';
import { Subcategoria } from '../models';

const API_BASE = 'http://localhost:3000/api/v1';

function buildSubcategoria(id: string): Subcategoria {
  return {
    id,
    categoriaId: 'c1',
    nombre: `Subcategoría ${id}`,
    slug: `sub-${id}`,
    orden: 0,
    activa: true,
    creadoEn: '2026-10-14T10:00:00Z',
    actualizadoEn: '2026-10-14T10:00:00Z',
  };
}

/**
 * Nested subcategories list (task 5.1, spec `admin-catalog-crud`): renders the
 * subcategories of one category with add/edit/delete actions, server-side
 * filtering and inline banners.
 */
describe('SubcategoriaListComponent (task 5.1)', () => {
  let fixture: ComponentFixture<SubcategoriaListComponent>;
  let http: HttpTestingController;
  let navigateSpy: ReturnType<typeof vi.fn>;

  async function renderWith(subcategorias: Subcategoria[]): Promise<HTMLElement> {
    fixture = TestBed.createComponent(SubcategoriaListComponent);
    fixture.componentRef.setInput('categoriaId', 'c1');
    fixture.detectChanges();

    const req = http.expectOne(`${API_BASE}/subcategories?categoriaId=c1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: subcategorias, error: null, meta: null });
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    history.replaceState({}, '');
    TestBed.configureTestingModule({
      imports: [SubcategoriaListComponent],
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: RoleService, useValue: { hasRole: vi.fn().mockReturnValue(true) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    http.verify();
  });

  it('lists the subcategories of the category with their actions', async () => {
    const el = await renderWith([buildSubcategoria('s1'), buildSubcategoria('s2')]);

    expect(el.querySelectorAll('tbody tr').length).toBe(2);
    expect(el.textContent).toContain('Subcategoría s1');
    const editLink = el.querySelector('[data-edit="s1"]') as HTMLAnchorElement;
    expect(editLink.getAttribute('href')).toBe('/categories/c1/subcategories/s1');
  });

  it('navigates to the nested new form on Añadir subcategoría', async () => {
    const el = await renderWith([]);

    (el.querySelector('[data-add-sub] button') as HTMLButtonElement).click();

    expect(navigateSpy).toHaveBeenCalledWith(['/categories', 'c1', 'subcategories', 'new']);
  });

  it('shows the empty state when the category has no subcategories', async () => {
    const el = await renderWith([]);

    expect(el.querySelector('[data-table-empty]')?.textContent).toContain(
      'Sin subcategorías',
    );
  });

  it('deletes after confirmation, reloads and shows the success banner', async () => {
    const el = await renderWith([buildSubcategoria('s1')]);

    (el.querySelector('[data-delete="s1"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (el.querySelector('[data-modal-confirm]') as HTMLButtonElement).click();

    const deleteReq = http.expectOne(`${API_BASE}/subcategories/s1`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({ data: null, error: null, meta: null });

    await fixture.whenStable();
    fixture.detectChanges();

    const reloadReq = http.expectOne(`${API_BASE}/subcategories?categoriaId=c1`);
    reloadReq.flush({ data: [], error: null, meta: null });
    await fixture.whenStable();
    fixture.detectChanges();

    const banner = el.querySelector('[data-alert]') as HTMLElement;
    expect(banner.textContent).toContain('Subcategoría eliminada con éxito.');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('maps the 409 delete blocker to an error banner and keeps the row', async () => {
    const el = await renderWith([buildSubcategoria('s1')]);

    (el.querySelector('[data-delete="s1"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (el.querySelector('[data-modal-confirm]') as HTMLButtonElement).click();

    const deleteReq = http.expectOne(`${API_BASE}/subcategories/s1`);
    deleteReq.flush(
      {
        data: null,
        error: {
          message: 'Cannot delete a subcategoria with associated products',
          code: 'CONFLICT',
        },
        meta: null,
      },
      { status: 409, statusText: 'Conflict' },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const banner = el.querySelector('[data-alert]') as HTMLElement;
    expect(banner.textContent).toContain(
      'No se puede eliminar: la subcategoría tiene productos asociados.',
    );
    expect(el.querySelectorAll('tbody tr').length).toBe(1);
  });
});
