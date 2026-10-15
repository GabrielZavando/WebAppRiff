import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import { CategoriaFormPageComponent } from './categoria-form-page.component';
import { RoleService } from '../../auth/role.service';

const API_BASE = 'http://localhost:3000/api/v1';
const EXISTING = {
  id: 'c1',
  nombre: 'Herramientas',
  slug: 'herramientas',
  orden: 2,
  activa: true,
  esDefault: false,
  creadoEn: '2026-10-14T10:00:00Z',
  actualizadoEn: '2026-10-14T10:00:00Z',
};

/**
 * Category form page (tasks 4.3–4.4, spec `admin-catalog-crud`): create via
 * POST, edit via PATCH with preload, required-field validation per field
 * (login pattern), 409 slug conflict mapped to the slug field, and
 * back-to-list navigation.
 */
describe('CategoriaFormPageComponent (tasks 4.3–4.4)', () => {
  let fixture: ComponentFixture<CategoriaFormPageComponent>;
  let http: HttpTestingController;
  let navigateSpy: ReturnType<typeof vi.fn>;

  function setup(routeId: string | null): void {
    TestBed.configureTestingModule({
      imports: [CategoriaFormPageComponent],
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: RoleService, useValue: { hasRole: vi.fn().mockReturnValue(true) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (key: string) => (key === 'id' ? routeId : null) } } },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(CategoriaFormPageComponent);
    fixture.detectChanges();
  }

  function submit(): void {
    (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
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

  it('creates: submits POST /categories and returns to the list with flash', async () => {
    setup(null);
    setInput('[data-form-nombre]', 'Herramientas nuevas');

    submit();
    const req = http.expectOne(`${API_BASE}/categories`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      nombre: 'Herramientas nuevas',
      slug: undefined,
      orden: 0,
      activa: true,
    });
    req.flush({ data: EXISTING, error: null, meta: null });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/categories'], {
      state: { flash: 'created' },
    });
  });

  it('edits: preloads the category and submits PATCH /categories/:id', async () => {
    setup('c1');

    const req = http.expectOne(`${API_BASE}/categories/c1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: EXISTING, error: null, meta: null });
    // Edit mode composes the nested subcategories list (task 5.1).
    const subsReq = http.expectOne(`${API_BASE}/subcategories?categoriaId=c1`);
    subsReq.flush({ data: [], error: null, meta: null });
    await fixture.whenStable();
    fixture.detectChanges();

    const nombre = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-form-nombre]',
    ) as HTMLInputElement;
    expect(nombre.value).toBe('Herramientas');

    setInput('[data-form-nombre]', 'Herramientas eléctricas');
    submit();

    const patchReq = http.expectOne(`${API_BASE}/categories/c1`);
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush({ data: EXISTING, error: null, meta: null });

    await fixture.whenStable();
    fixture.detectChanges();
    expect(navigateSpy).toHaveBeenCalledWith(['/categories'], {
      state: { flash: 'updated' },
    });
  });

  it('keeps the save button disabled while the form is invalid', () => {
    setup(null);
    fixture.detectChanges();

    const saveButton = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-form-save] button',
    ) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
  });

  it('shows the required error per field once touched (login pattern)', () => {
    setup(null);
    setInput('[data-form-nombre]', '');
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-form-nombre]',
    ) as HTMLInputElement;
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    const error = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-error-nombre]',
    ) as HTMLElement;
    expect(error.textContent).toContain('El nombre es obligatorio.');
    expect(input.className).toContain('border-error');
  });

  it('maps the 409 slug conflict to the slug field and stays on the page', async () => {
    setup(null);
    setInput('[data-form-nombre]', 'Herramientas');

    submit();
    const req = http.expectOne(`${API_BASE}/categories`);
    req.flush(
      { data: null, error: { message: 'Slug already in use', code: 'CONFLICT' }, meta: null },
      { status: 409, statusText: 'Conflict' },
    );
    await fixture.whenStable();
    fixture.detectChanges();

    const error = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-error-slug]',
    ) as HTMLElement;
    expect(error.textContent).toContain('El slug ya está en uso.');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('returns to the list without saving on Volver al listado', async () => {
    setup(null);

    (fixture.nativeElement as HTMLElement).querySelector('[data-form-back]')?.dispatchEvent(
      new Event('click', { bubbles: true }),
    );

    expect(navigateSpy).toHaveBeenCalledWith(['/categories']);
  });

  it('composes the nested subcategories list in edit mode only (task 5.1)', async () => {
    setup('c1');

    const preload = http.expectOne(`${API_BASE}/categories/c1`);
    preload.flush({ data: EXISTING, error: null, meta: null });
    await fixture.whenStable();
    fixture.detectChanges();

    const subsReq = http.expectOne(`${API_BASE}/subcategories?categoriaId=c1`);
    subsReq.flush({
      data: [
        { ...EXISTING, id: 's1', categoriaId: 'c1', nombre: 'Taladros', slug: 'taladros' },
      ],
      error: null,
      meta: null,
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Subcategorías');
    expect(el.textContent).toContain('Taladros');
  });

  it('does not render the subcategories section in create mode', async () => {
    setup(null);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).textContent?.includes('Subcategorías'),
    ).toBe(false);
  });
});
