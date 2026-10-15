import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { CategoriaService } from './categoria.service';
import { Categoria, CategoriaCreatePayload } from './models';

const API_BASE = 'http://localhost:3000/api/v1';
const CATEGORIA: Categoria = {
  id: 'c1',
  nombre: 'Herramientas',
  slug: 'herramientas',
  orden: 1,
  activa: true,
  esDefault: false,
  creadoEn: '2026-10-14T10:00:00Z',
  actualizadoEn: '2026-10-14T10:00:00Z',
};

/** Contract (task 3.2, design D2/D3): CategoriaService speaks to /categories. */
describe('CategoriaService', () => {
  let service: CategoriaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoriaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('fetches the full category list from /categories (no activa filter)', () => {
    let result: Categoria[] | undefined;

    service.findAll().subscribe((categorias) => (result = categorias));

    const req = http.expectOne(`${API_BASE}/categories`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ data: [CATEGORIA], error: null, meta: null });

    expect(result).toEqual([CATEGORIA]);
  });

  it('fetches a single category by id', () => {
    let result: Categoria | undefined;

    service.findById('c1').subscribe((categoria) => (result = categoria));

    const req = http.expectOne(`${API_BASE}/categories/c1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: CATEGORIA, error: null, meta: null });

    expect(result).toEqual(CATEGORIA);
  });

  it('creates via POST /categories', () => {
    const payload: CategoriaCreatePayload = { nombre: 'Herramientas', activa: true };
    let result: Categoria | undefined;

    service.create(payload).subscribe((categoria) => (result = categoria));

    const req = http.expectOne(`${API_BASE}/categories`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: CATEGORIA, error: null, meta: null });

    expect(result).toEqual(CATEGORIA);
  });

  it('updates via PATCH /categories/:id (design D3: PATCH, not PUT)', () => {
    let result: Categoria | undefined;

    service.update('c1', { nombre: 'Herramientas eléctricas' }).subscribe((r) => (result = r));

    const req = http.expectOne(`${API_BASE}/categories/c1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ nombre: 'Herramientas eléctricas' });
    req.flush({ data: CATEGORIA, error: null, meta: null });

    expect(result).toEqual(CATEGORIA);
  });

  it('removes via DELETE /categories/:id', () => {
    let done = false;

    service.remove('c1').subscribe(() => (done = true));

    const req = http.expectOne(`${API_BASE}/categories/c1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: null, error: null, meta: null });

    expect(done).toBe(true);
  });
});
