import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { ProductService } from './product.service';
import { Producto, ProductoListMeta } from './models';

const API_BASE = 'http://localhost:3000/api/v1';

function buildProducto(id: string): Producto {
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
    precio: { valor: 1000, visible: true },
    stock: { disponible: true, cantidad: 5 },
    galeria: [],
    fichaTecnica: null,
    destacado: false,
    publicado: true,
    creadoEn: '2026-10-14T10:00:00Z',
    actualizadoEn: '2026-10-14T10:00:00Z',
  };
}

/** Contract (task 3.4, design D1/D2/D3): ProductService speaks to /products. */
describe('ProductService', () => {
  let service: ProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lists products server-side with page/limit via getWithMeta', () => {
    let result: { items: Producto[]; meta: ProductoListMeta | null } | undefined;

    service.findAll({ page: 1, limit: 24 }).subscribe((page) => (result = page));

    const req = http.expectOne(`${API_BASE}/products?page=1&limit=24`);
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [buildProducto('p1')],
      error: null,
      meta: { page: 1, limit: 24, total: 100 },
    });

    expect(result?.items).toHaveLength(1);
    expect(result?.meta).toEqual({ page: 1, limit: 24, total: 100 });
  });

  it('combines search and categoriaId filters in the query string', () => {
    service.findAll({ page: 1, limit: 24, search: 'taladro', categoriaId: 'c1' }).subscribe();

    const req = http.expectOne(
      `${API_BASE}/products?page=1&limit=24&search=taladro&categoriaId=c1`,
    );
    req.flush({ data: [], error: null, meta: { page: 1, limit: 24, total: 0 } });
  });

  it('omits empty search and categoriaId params', () => {
    service.findAll({ page: 2, limit: 24, search: '', categoriaId: undefined }).subscribe();

    const req = http.expectOne(`${API_BASE}/products?page=2&limit=24`);
    expect(req.request.urlWithParams).not.toContain('search=');
    expect(req.request.urlWithParams).not.toContain('categoriaId=');
    req.flush({ data: [], error: null, meta: null });
  });

  it('normalizes a non-numeric meta.total to null (no fallback counter)', () => {
    let result: { items: Producto[]; meta: ProductoListMeta | null } | undefined;

    service.findAll({ page: 1, limit: 24 }).subscribe((page) => (result = page));

    const req = http.expectOne(`${API_BASE}/products?page=1&limit=24`);
    req.flush({ data: [buildProducto('p1')], error: null, meta: { total: 'abc' } });

    expect(result?.meta).toBeNull();
  });

  it('normalizes a missing meta to null', () => {
    let result: { items: Producto[]; meta: ProductoListMeta | null } | undefined;

    service.findAll({ page: 1, limit: 24 }).subscribe((page) => (result = page));

    const req = http.expectOne(`${API_BASE}/products?page=1&limit=24`);
    req.flush({ data: [], error: null, meta: null });

    expect(result?.meta).toBeNull();
  });

  it('fetches a single product by id', () => {
    let result: Producto | undefined;

    service.findById('p1').subscribe((producto) => (result = producto));

    const req = http.expectOne(`${API_BASE}/products/p1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: buildProducto('p1'), error: null, meta: null });

    expect(result?.id).toBe('p1');
  });

  it('creates via POST /products', () => {
    const payload = { sku: 'RIF-001', titulo: 'Nuevo' };
    let result: Producto | undefined;

    service.create(payload).subscribe((producto) => (result = producto));

    const req = http.expectOne(`${API_BASE}/products`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: buildProducto('p1'), error: null, meta: null });

    expect(result?.id).toBe('p1');
  });

  it('updates via PATCH /products/:id', () => {
    let result: Producto | undefined;

    service.update('p1', { publicado: false }).subscribe((producto) => (result = producto));

    const req = http.expectOne(`${API_BASE}/products/p1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ publicado: false });
    req.flush({ data: buildProducto('p1'), error: null, meta: null });

    expect(result?.id).toBe('p1');
  });

  it('removes via DELETE /products/:id', () => {
    let done = false;

    service.remove('p1').subscribe(() => (done = true));

    const req = http.expectOne(`${API_BASE}/products/p1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: null, error: null, meta: null });

    expect(done).toBe(true);
  });
});
