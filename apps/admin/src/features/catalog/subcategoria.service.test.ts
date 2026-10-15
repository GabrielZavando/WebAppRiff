import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { SubcategoriaService } from './subcategoria.service';
import { Subcategoria } from './models';

const API_BASE = 'http://localhost:3000/api/v1';
const SUBCATEGORIA: Subcategoria = {
  id: 's1',
  categoriaId: 'c1',
  nombre: 'Taladros',
  slug: 'taladros',
  orden: 0,
  activa: true,
  creadoEn: '2026-10-14T10:00:00Z',
  actualizadoEn: '2026-10-14T10:00:00Z',
};

/** Contract (task 3.3, design D2/D3): SubcategoriaService speaks to /subcategories. */
describe('SubcategoriaService', () => {
  let service: SubcategoriaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(SubcategoriaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('fetches the subcategories of one category (server-side filter)', () => {
    let result: Subcategoria[] | undefined;

    service.findByCategoria('c1').subscribe((subcategorias) => (result = subcategorias));

    const req = http.expectOne(`${API_BASE}/subcategories?categoriaId=c1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [SUBCATEGORIA], error: null, meta: null });

    expect(result).toEqual([SUBCATEGORIA]);
  });

  it('fetches a single subcategory by id (edit preload, task 5.2)', () => {
    let result: Subcategoria | undefined;

    service.findById('s1').subscribe((subcategoria) => (result = subcategoria));

    const req = http.expectOne(`${API_BASE}/subcategories/s1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: SUBCATEGORIA, error: null, meta: null });

    expect(result).toEqual(SUBCATEGORIA);
  });

  it('creates via POST /subcategories carrying the categoriaId', () => {
    let result: Subcategoria | undefined;

    service.create({ categoriaId: 'c1', nombre: 'Taladros' }).subscribe((r) => (result = r));

    const req = http.expectOne(`${API_BASE}/subcategories`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ categoriaId: 'c1', nombre: 'Taladros' });
    req.flush({ data: SUBCATEGORIA, error: null, meta: null });

    expect(result).toEqual(SUBCATEGORIA);
  });

  it('updates via PATCH /subcategories/:id', () => {
    let result: Subcategoria | undefined;

    service.update('s1', { nombre: 'Taladros de percusión' }).subscribe((r) => (result = r));

    const req = http.expectOne(`${API_BASE}/subcategories/s1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ nombre: 'Taladros de percusión' });
    req.flush({ data: SUBCATEGORIA, error: null, meta: null });

    expect(result).toEqual(SUBCATEGORIA);
  });

  it('removes via DELETE /subcategories/:id', () => {
    let done = false;

    service.remove('s1').subscribe(() => (done = true));

    const req = http.expectOne(`${API_BASE}/subcategories/s1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: null, error: null, meta: null });

    expect(done).toBe(true);
  });
});
