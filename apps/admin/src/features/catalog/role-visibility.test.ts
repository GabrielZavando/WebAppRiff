import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { CategoriesPageComponent } from './pages/categories-page.component';
import { ProductsPageComponent } from './pages/products-page.component';
import { SubcategoriaListComponent } from './components/subcategoria-list.component';
import { RoleService } from '../auth/role.service';

/**
 * Role visibility across the catalog screens (task 7.1, spec
 * `admin-role-access`): an editor sees Edit but the create/delete actions are
 * HIDDEN — not disabled. Admin sees everything.
 */
describe('Role visibility on catalog screens (task 7.1)', () => {
  let http: HttpTestingController;
  let hasRoleMock: ReturnType<typeof vi.fn>;

  const API_BASE = 'http://localhost:3000/api/v1';
  const CATEGORIA = {
    id: 'c1',
    nombre: 'Herramientas',
    slug: 'herramientas',
    orden: 0,
    activa: true,
    esDefault: false,
    creadoEn: '2026-10-14T10:00:00Z',
    actualizadoEn: '2026-10-14T10:00:00Z',
  };
  const PRODUCTO = {
    id: 'p1',
    idExterno: null,
    sku: 'RIF-1',
    titulo: 'Taladro',
    slug: 'taladro',
    descripcionBreve: '',
    descripcionLarga: '',
    categoriaId: 'c1',
    subcategoriaId: null,
    atributos: [],
    precio: { valor: 1000, visible: true },
    stock: { disponible: true, cantidad: 1 },
    galeria: [],
    fichaTecnica: null,
    destacado: false,
    publicado: true,
    creadoEn: '2026-10-14T10:00:00Z',
    actualizadoEn: '2026-10-14T10:00:00Z',
  };

  function setup(): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: RoleService, useValue: { hasRole: hasRoleMock } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  }

  function renderCategories(): ComponentFixture<CategoriesPageComponent> {
    const fixture = TestBed.createComponent(CategoriesPageComponent);
    fixture.detectChanges();
    const req = http.expectOne(`${API_BASE}/categories`);
    req.flush({ data: [CATEGORIA], error: null, meta: null });
    return fixture;
  }

  function renderProducts(): ComponentFixture<ProductsPageComponent> {
    const fixture = TestBed.createComponent(ProductsPageComponent);
    fixture.detectChanges();
    const req = http.expectOne(`${API_BASE}/products?page=1&limit=24`);
    req.flush({ data: [PRODUCTO], error: null, meta: { page: 1, limit: 24, total: 1 } });
    const cats = http.expectOne(`${API_BASE}/categories`);
    cats.flush({ data: [CATEGORIA], error: null, meta: null });
    return fixture;
  }

  function renderSubcategorias(): ComponentFixture<SubcategoriaListComponent> {
    const fixture = TestBed.createComponent(SubcategoriaListComponent);
    fixture.componentRef.setInput('categoriaId', 'c1');
    fixture.detectChanges();
    const req = http.expectOne(`${API_BASE}/subcategories?categoriaId=c1`);
    req.flush({ data: [{ ...CATEGORIA, id: 's1', nombre: 'Taladros' }], error: null, meta: null });
    return fixture;
  }

  beforeEach(() => {
    history.replaceState({}, '');
    hasRoleMock = vi.fn().mockReturnValue(true);
    setup();
  });

  afterEach(() => {
    http.verify();
  });

  describe('editor (ocultar, no deshabilitar)', () => {
    beforeEach(() => {
      hasRoleMock.mockReturnValue(false);
    });

    it('hides Añadir categoría and Eliminar; keeps Editar on /categories', async () => {
      const fixture = renderCategories();
      await fixture.whenStable();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      expect(el.querySelector('[data-add]')).toBeNull();
      expect(el.querySelector('[data-delete="c1"]')).toBeNull();
      expect(el.querySelector('[data-edit="c1"]')).not.toBeNull();
    });

    it('hides Añadir producto and Eliminar; keeps Editar on /products', async () => {
      const fixture = renderProducts();
      await fixture.whenStable();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      expect(el.querySelector('[data-add]')).toBeNull();
      expect(el.querySelector('[data-delete="p1"]')).toBeNull();
      expect(el.querySelector('[data-edit="p1"]')).not.toBeNull();
    });

    it('hides Añadir subcategoría and Eliminar in the nested list', async () => {
      const fixture = renderSubcategorias();
      await fixture.whenStable();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      expect(el.querySelector('[data-add-sub]')).toBeNull();
      expect(el.querySelector('[data-delete="s1"]')).toBeNull();
      expect(el.querySelector('[data-edit="s1"]')).not.toBeNull();
    });
  });

  describe('admin', () => {
    it('shows every action on the catalog lists', async () => {
      const categories = renderCategories();
      await categories.whenStable();
      categories.detectChanges();
      const catEl = categories.nativeElement as HTMLElement;
      expect(catEl.querySelector('[data-add]')).not.toBeNull();
      expect(catEl.querySelector('[data-delete="c1"]')).not.toBeNull();

      const products = renderProducts();
      await products.whenStable();
      products.detectChanges();
      const prodEl = products.nativeElement as HTMLElement;
      expect(prodEl.querySelector('[data-add]')).not.toBeNull();
      expect(prodEl.querySelector('[data-delete="p1"]')).not.toBeNull();

      const subs = renderSubcategorias();
      await subs.whenStable();
      subs.detectChanges();
      const subEl = subs.nativeElement as HTMLElement;
      expect(subEl.querySelector('[data-add-sub]')).not.toBeNull();
      expect(subEl.querySelector('[data-delete="s1"]')).not.toBeNull();
    });
  });
});
