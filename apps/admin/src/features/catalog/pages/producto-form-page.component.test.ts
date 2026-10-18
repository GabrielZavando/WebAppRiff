import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ɵresolveComponentResources } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ProductoFormPageComponent } from './producto-form-page.component';
import { RoleService } from '../../auth/role.service';
import { Producto } from '../models';

const API_BASE = 'http://localhost:3000/api/v1';

// External templateUrl must be resolved from disk before TestBed compiles
// (same pattern as the login component test; see test-setup.ts).
const testDir = dirname(fileURLToPath(import.meta.url));

const EXISTING: Producto = {
  id: 'p1',
  idExterno: null,
  sku: 'RIF-001',
  titulo: 'Taladro inalámbrico 18V',
  slug: 'taladro-inalambrico-18v',
  descripcionBreve: 'Taladro de percusión.',
  descripcionLarga: '<p>Descripción completa.</p>',
  categoriaId: 'c1',
  subcategoriaId: 's1',
  atributos: [{ nombre: 'Voltaje', valor: '18V' }],
  precio: { valor: 129990, visible: true },
  stock: { disponible: true, cantidad: 7 },
  galeria: [
    {
      url: 'https://storage.googleapis.com/b/p1/0.webp',
      storagePath: 'productos/p1/0.webp',
      alt: 'Taladro',
      orden: 0,
    },
  ],
  fichaTecnica: null,
  destacado: true,
  publicado: true,
  creadoEn: '2026-10-14T10:00:00Z',
  actualizadoEn: '2026-10-14T10:00:00Z',
};

const CATEGORIAS = [
  { id: 'c1', nombre: 'Herramientas' },
  { id: 'c2', nombre: 'Jardín' },
];

/**
 * Product form page (tasks 6.6–6.9, spec `admin-catalog-crud`): dedicated
 * pages for create/edit covering the full backend DTO — gallery and ficha
 * técnica edited as data (no file inputs), cascading category→subcategory
 * selects, 409 field mapping and per-field validation.
 */
describe('ProductoFormPageComponent (tasks 6.6–6.9)', () => {
  let fixture: ComponentFixture<ProductoFormPageComponent>;
  let http: HttpTestingController;
  let navigateSpy: ReturnType<typeof vi.fn>;

  async function setup(routeParams: Record<string, string>): Promise<void> {
    await ɵresolveComponentResources(async (url: string) =>
      readFileSync(resolve(testDir, url), 'utf-8'),
    );
    TestBed.configureTestingModule({
      imports: [ProductoFormPageComponent],
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: RoleService, useValue: { hasRole: vi.fn().mockReturnValue(true) } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (routeParams[key] !== undefined ? routeParams[key] : null),
              },
            },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ProductoFormPageComponent);
    fixture.detectChanges();
  }

  function setInput(selector: string, value: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector(selector) as HTMLInputElement;
    input.value = value;
    // Selects emit `change`; text inputs emit `input` — fire both so the
    // helper works for every control kind.
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
  }

  function submit(): void {
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  beforeEach(() => {
    history.replaceState({}, '');
  });

  /** Flushes the categories query for the cascading select (common preamble). */
  async function expectCategoriesFlushed(): Promise<void> {
    const catsReq = http.expectOne(`${API_BASE}/categories`);
    catsReq.flush({ data: CATEGORIAS, error: null, meta: null });
    await fixture.whenStable();
    fixture.detectChanges();
  }

  afterEach(() => {
    http.verify();
  });

  describe('[6.6] creación y edición', () => {
    it('creates: POSTs the typed payload and returns to the list with flash', async () => {
      await setup({});
      // Categories load for the cascading select.
      await expectCategoriesFlushed();

      setInput('[data-form-sku]', 'RIF-100');
      setInput('[data-form-titulo]', 'Amoladora angular');
      setInput('[data-form-slug]', 'amoladora-angular');
      setInput('[data-form-categoria]', 'c1');
      const subReq = http.expectOne(`${API_BASE}/subcategories?categoriaId=c1`);
      subReq.flush({
        data: [{ id: 's2', categoriaId: 'c1', nombre: 'Amoladoras' }],
        error: null,
        meta: null,
      });
      await fixture.whenStable();
      fixture.detectChanges();
      setInput('[data-form-subcategoria]', 's2');
      setInput('[data-form-precio-valor]', '89990');
      setInput('[data-form-stock-cantidad]', '3');
      setInput('[data-form-desc-breve]', 'Amoladora 850W.');

      submit();

      const req = http.expectOne(`${API_BASE}/products`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        sku: 'RIF-100',
        titulo: 'Amoladora angular',
        slug: 'amoladora-angular',
        descripcionBreve: 'Amoladora 850W.',
        categoriaId: 'c1',
        subcategoriaId: 's2',
        precio: { valor: 89990, visible: true },
        stock: { disponible: true, cantidad: 3 },
        destacado: false,
        publicado: false,
      });
      req.flush({ data: EXISTING, error: null, meta: null });

      await fixture.whenStable();
      fixture.detectChanges();
      expect(navigateSpy).toHaveBeenCalledWith(['/products'], { state: { flash: 'created' } });
    });

    it('edits: preloads the product with its cascade and PATCHes on save', async () => {
      await setup({ id: 'p1' });
      const catsReq = http.expectOne(`${API_BASE}/categories`);
      catsReq.flush({ data: CATEGORIAS, error: null, meta: null });

      const prodReq = http.expectOne(`${API_BASE}/products/p1`);
      prodReq.flush({ data: EXISTING, error: null, meta: null });
      // The cascade fires once the preload promise chain resumes (microtask).
      await fixture.whenStable();
      fixture.detectChanges();

      const subsReq = http.expectOne(`${API_BASE}/subcategories?categoriaId=c1`);
      subsReq.flush({
        data: [{ id: 's1', categoriaId: 'c1', nombre: 'Taladros' }],
        error: null,
        meta: null,
      });
      // The post-cascade restore (design D7) runs on a later microtask.
      await new Promise((resolve) => setTimeout(resolve, 0));
      await fixture.whenStable();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect((el.querySelector('[data-form-titulo]') as HTMLInputElement).value).toBe(
        'Taladro inalámbrico 18V',
      );
      expect((el.querySelector('[data-form-subcategoria]') as HTMLSelectElement).value).toBe('s1');

      // Task 4.3: the preloaded gallery row shows its thumbnail and allows
      // replacement via the upload control.
      const galeriaPreview = el.querySelector('app-upload-field[data-upload-galeria] img');
      expect(galeriaPreview?.getAttribute('src')).toBe('https://storage.googleapis.com/b/p1/0.webp');

      setInput('[data-form-titulo]', 'Taladro 18V con maletín');
      submit();

      const patchReq = http.expectOne(`${API_BASE}/products/p1`);
      expect(patchReq.request.method).toBe('PATCH');
      patchReq.flush({ data: EXISTING, error: null, meta: null });

      await fixture.whenStable();
      fixture.detectChanges();
      expect(navigateSpy).toHaveBeenCalledWith(['/products'], { state: { flash: 'updated' } });
    });
  });

  describe('[6.7] cascada categoría → subcategoría', () => {
    it('loads subcategories for the selected category and clears the selection on change', async () => {
      await setup({});
      await expectCategoriesFlushed();

      setInput('[data-form-categoria]', 'c1');
      const subs1 = http.expectOne(`${API_BASE}/subcategories?categoriaId=c1`);
      subs1.flush({
        data: [{ id: 's2', categoriaId: 'c1', nombre: 'Amoladoras' }],
        error: null,
        meta: null,
      });
      await fixture.whenStable();
      fixture.detectChanges();
      setInput('[data-form-subcategoria]', 's2');

      // Switching to another category re-queries and clears the subcategory.
      setInput('[data-form-categoria]', 'c2');
      const subs2 = http.expectOne(`${API_BASE}/subcategories?categoriaId=c2`);
      subs2.flush({ data: [], error: null, meta: null });
      await fixture.whenStable();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect((el.querySelector('[data-form-subcategoria]') as HTMLSelectElement).value).toBe('');
    });
  });

  describe('[4.1–4.3] galería y ficha técnica upload-first', () => {
    /** Assigns a File to a file input (jsdom lacks DataTransfer). */
    function chooseFile(scope: HTMLElement, selector: string, file: File): void {
      const input = scope.querySelector(`${selector} input[type="file"]`) as HTMLInputElement;
      Object.defineProperty(input, 'files', {
        value: [file] as unknown as FileList,
        configurable: true,
      });
      input.dispatchEvent(new Event('change'));
    }

    function makeFile(name: string): File {
      return new File(['x'.repeat(1024)], name, { type: 'image/webp' });
    }

    it('uploads a gallery image, autocompletes the hidden url/storagePath and posts them', async () => {
      await setup({});
      await expectCategoriesFlushed();

      const el = fixture.nativeElement as HTMLElement;

      setInput('[data-form-sku]', 'RIF-200');
      setInput('[data-form-titulo]', 'Producto con galería');

      (el.querySelector('[data-add-galeria]') as HTMLButtonElement).click();
      fixture.detectChanges();

      chooseFile(el, '[data-upload-galeria]', makeFile('frente.png'));
      const uploadReq = http.expectOne(`${API_BASE}/uploads/images`);
      expect(uploadReq.request.method).toBe('POST');
      expect(uploadReq.request.headers.get('Content-Type')).toBeNull();
      expect((uploadReq.request.body as FormData).get('file')).not.toBeNull();
      uploadReq.flush({
        data: {
          url: 'https://storage.googleapis.com/riff-catalogo-staging/productos/tmp-abc/frente.webp',
          storagePath: 'productos/tmp-abc/frente.webp',
        },
        error: null,
        meta: null,
      });
      await fixture.whenStable();
      fixture.detectChanges();

      // The uploaded url renders as thumbnail preview (task 4.3 reload path).
      const preview = el.querySelector('img');
      expect(preview?.getAttribute('src')).toBe(
        'https://storage.googleapis.com/riff-catalogo-staging/productos/tmp-abc/frente.webp',
      );

      // Only alt/orden remain as manual, editable inputs.
      setInput('[data-galeria-alt="0"]', 'Frente');
      setInput('[data-galeria-orden="0"]', '0');

      // Ficha técnica upload autocompletes url/storagePath; only the display
      // name stays editable (hidden fields are not text inputs).
      const fichaFile = new File(['%PDF-1.7'], 'ficha.pdf', { type: 'application/pdf' });
      chooseFile(el, '[data-ficha-upload]', fichaFile);
      const fichaUploadReq = http.expectOne(`${API_BASE}/uploads/tech-sheet`);
      fichaUploadReq.flush({
        data: {
          url: 'https://storage.googleapis.com/riff-catalogo-staging/productos/tmp-abc/ficha.pdf',
          storagePath: 'productos/tmp-abc/ficha.pdf',
        },
        error: null,
        meta: null,
      });
      await fixture.whenStable();
      fixture.detectChanges();
      setInput('[data-ficha-nombre]', 'ficha.pdf');

      submit();

      const req = http.expectOne(`${API_BASE}/products`);
      expect(req.request.body).toMatchObject({
        galeria: [
          {
            url: 'https://storage.googleapis.com/riff-catalogo-staging/productos/tmp-abc/frente.webp',
            storagePath: 'productos/tmp-abc/frente.webp',
            alt: 'Frente',
            orden: 0,
          },
        ],
        fichaTecnica: {
          url: 'https://storage.googleapis.com/riff-catalogo-staging/productos/tmp-abc/ficha.pdf',
          storagePath: 'productos/tmp-abc/ficha.pdf',
          nombreArchivo: 'ficha.pdf',
        },
      });
      req.flush({ data: EXISTING, error: null, meta: null });

      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('renders a file input per gallery row plus the ficha and no manual data inputs', async () => {
      await setup({});
      await expectCategoriesFlushed();

      const el = fixture.nativeElement as HTMLElement;
      // One upload input for the ficha técnica before adding gallery rows...
      expect(el.querySelectorAll('input[type="file"]').length).toBe(1);
      (el.querySelector('[data-add-galeria]') as HTMLButtonElement).click();
      fixture.detectChanges();
      // ...and one per gallery row after adding them.
      expect(el.querySelectorAll('input[type="file"]').length).toBe(2);

      // Manual url/storagePath inputs are gone: they are hidden autocompleted
      // fields now.
      expect(el.querySelector('[data-galeria-url="0"]')).toBeNull();
      expect(el.querySelector('[data-galeria-storage="0"]')).toBeNull();
      expect(el.querySelector('[data-ficha-url]')).toBeNull();
      expect(el.querySelector('[data-ficha-storage]')).toBeNull();
    });

    it('disables saving while an upload is in flight and re-enables afterwards', async () => {
      await setup({});
      await expectCategoriesFlushed();

      const el = fixture.nativeElement as HTMLElement;
      setInput('[data-form-sku]', 'RIF-400');
      setInput('[data-form-titulo]', 'Producto subiendo');
      (el.querySelector('[data-add-galeria]') as HTMLButtonElement).click();
      fixture.detectChanges();

      chooseFile(el, '[data-upload-galeria]', makeFile('frente.png'));
      // Zoneless render is async; flush the pending render before asserting.
      await fixture.whenStable();
      fixture.detectChanges();
      const uploadReq = http.expectOne(`${API_BASE}/uploads/images`);
      const save = el.querySelector('[data-form-save] button') as HTMLButtonElement;
      expect(save.disabled).toBe(true);

      uploadReq.flush({
        data: {
          url: 'https://storage.googleapis.com/riff-catalogo-staging/productos/tmp-abc/frente.webp',
          storagePath: 'productos/tmp-abc/frente.webp',
        },
        error: null,
        meta: null,
      });
      await fixture.whenStable();
      fixture.detectChanges();

      const saveAfter = el.querySelector('[data-form-save] button') as HTMLButtonElement;
      expect(saveAfter.disabled).toBe(false);
    });

    it('omits galería, ficha técnica, atributos and precio when empty', async () => {
      await setup({});
      await expectCategoriesFlushed();

      setInput('[data-form-sku]', 'RIF-300');
      setInput('[data-form-titulo]', 'Producto mínimo');

      submit();

      const req = http.expectOne(`${API_BASE}/products`);
      const body = req.request.body as Record<string, unknown>;
      expect(body).not.toHaveProperty('galeria');
      expect(body).not.toHaveProperty('fichaTecnica');
      expect(body).not.toHaveProperty('atributos');
      expect(body).not.toHaveProperty('precio');
      req.flush({ data: EXISTING, error: null, meta: null });
      await fixture.whenStable();
      fixture.detectChanges();
    });
  });

  describe('[6.9] errores 409 y validación', () => {
    it('maps the 409 SKU conflict to the sku field', async () => {
      await setup({});
      await expectCategoriesFlushed();

      setInput('[data-form-sku]', 'RIF-001');
      setInput('[data-form-titulo]', 'Duplicado');
      submit();

      const req = http.expectOne(`${API_BASE}/products`);
      req.flush(
        { data: null, error: { message: 'SKU already in use', code: 'CONFLICT' }, meta: null },
        { status: 409, statusText: 'Conflict' },
      );
      await fixture.whenStable();
      fixture.detectChanges();

      const error = (fixture.nativeElement as HTMLElement).querySelector(
        '[data-error-sku]',
      ) as HTMLElement;
      expect(error.textContent).toContain('El SKU ya está en uso.');
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('maps the 409 slug conflict to the slug field', async () => {
      await setup({});
      await expectCategoriesFlushed();

      setInput('[data-form-sku]', 'RIF-400');
      setInput('[data-form-titulo]', 'Slug ocupado');
      setInput('[data-form-slug]', 'taladro-inalambrico-18v');
      submit();

      const req = http.expectOne(`${API_BASE}/products`);
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
    });

    it('keeps save disabled while invalid and shows required errors per field', async () => {
      await setup({});
      await expectCategoriesFlushed();

      const el = fixture.nativeElement as HTMLElement;
      const saveButton = el.querySelector('[data-form-save] button') as HTMLButtonElement;
      expect(saveButton.disabled).toBe(true);

      setInput('[data-form-titulo]', '');
      const titulo = el.querySelector('[data-form-titulo]') as HTMLInputElement;
      titulo.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      const error = el.querySelector('[data-error-titulo]') as HTMLElement;
      expect(error.textContent).toContain('El título es obligatorio.');
      expect(titulo.className).toContain('border-error');
    });
  });

  describe('navegación', () => {
    it('returns to the list without saving on Volver al listado', async () => {
      await setup({});
      await expectCategoriesFlushed();

      (fixture.nativeElement as HTMLElement)
        .querySelector('[data-form-back]')
        ?.dispatchEvent(new Event('click', { bubbles: true }));

      expect(navigateSpy).toHaveBeenCalledWith(['/products']);
    });
  });
});
