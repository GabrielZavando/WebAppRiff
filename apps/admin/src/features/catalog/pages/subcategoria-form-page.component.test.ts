import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import { SubcategoriaFormPageComponent } from './subcategoria-form-page.component';
import { RoleService } from '../../auth/role.service';

const API_BASE = 'http://localhost:3000/api/v1';
const EXISTING = {
  id: 's1',
  categoriaId: 'c1',
  nombre: 'Taladros',
  slug: 'taladros',
  orden: 1,
  activa: true,
  creadoEn: '2026-10-14T10:00:00Z',
  actualizadoEn: '2026-10-14T10:00:00Z',
};

/**
 * Subcategory form page (tasks 5.2–5.3, spec `admin-catalog-crud`): nested
 * under `/categories/:id`, `categoriaId` comes from the route (no selector),
 * create POSTs / edit PATCHes and returns to the parent detail with a flash
 * banner; the per-category slug conflict maps to the slug field.
 */
describe('SubcategoriaFormPageComponent (tasks 5.2–5.3)', () => {
  let fixture: ComponentFixture<SubcategoriaFormPageComponent>;
  let http: HttpTestingController;
  let navigateSpy: ReturnType<typeof vi.fn>;

  function setup(params: Record<string, string>): void {
    TestBed.configureTestingModule({
      imports: [SubcategoriaFormPageComponent],
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: RoleService, useValue: { hasRole: vi.fn().mockReturnValue(true) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (key: string) => params[key] ?? null } } },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(SubcategoriaFormPageComponent);
    fixture.detectChanges();
  }

  function submit(): void {
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  function setInput(selector: string, value: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  beforeEach(() => {
    history.replaceState({}, '');
  });

  afterEach(() => {
    http.verify();
  });

  it('creates with the categoriaId from the route and no category selector', async () => {
    setup({ id: 'c1' });
    setInput('[data-form-nombre]', 'Taladros');

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-form-categoria]')).toBeNull();

    submit();

    const req = http.expectOne(`${API_BASE}/subcategories`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      categoriaId: 'c1',
      nombre: 'Taladros',
      slug: undefined,
      orden: 0,
      activa: true,
    });
    req.flush({ data: EXISTING, error: null, meta: null });

    await fixture.whenStable();
    fixture.detectChanges();
    expect(navigateSpy).toHaveBeenCalledWith(['/categories', 'c1'], {
      state: { flash: 'created' },
    });
  });

  it('edits: preloads via GET /subcategories/:subId and PATCHes', async () => {
    setup({ id: 'c1', subId: 's1' });

    const req = http.expectOne(`${API_BASE}/subcategories/s1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: EXISTING, error: null, meta: null });
    await fixture.whenStable();
    fixture.detectChanges();

    const nombre = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-form-nombre]',
    ) as HTMLInputElement;
    expect(nombre.value).toBe('Taladros');

    setInput('[data-form-nombre]', 'Taladros de percusión');
    submit();

    const patchReq = http.expectOne(`${API_BASE}/subcategories/s1`);
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush({ data: EXISTING, error: null, meta: null });

    await fixture.whenStable();
    fixture.detectChanges();
    expect(navigateSpy).toHaveBeenCalledWith(['/categories', 'c1'], {
      state: { flash: 'updated' },
    });
  });

  it('maps the per-category 409 slug conflict to the slug field (task 5.3)', async () => {
    setup({ id: 'c1' });
    setInput('[data-form-nombre]', 'Taladros');

    submit();
    const req = http.expectOne(`${API_BASE}/subcategories`);
    req.flush(
      {
        data: null,
        error: { message: 'Slug already in use within this category', code: 'CONFLICT' },
        meta: null,
      },
      { status: 409, statusText: 'Conflict' },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const error = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-error-slug]',
    ) as HTMLElement;
    expect(error.textContent).toContain('El slug ya está en uso dentro de esta categoría.');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('keeps the save button disabled while the form is invalid', () => {
    setup({ id: 'c1' });
    fixture.detectChanges();

    const saveButton = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-form-save] button',
    ) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
  });
});
