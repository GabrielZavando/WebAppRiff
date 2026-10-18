import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiError } from '../../../shared/api/api-client.service';
import { AlertComponent } from '../../../shared/components/ui/alert/alert.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { RoleService } from '../../auth/role.service';
import { fieldConflictMessage } from '../api-error-mapping';
import { UploadFieldComponent } from '../components/upload-field/upload-field.component';
import { UploadedAsset } from '../upload.service';
import {
  Atributo,
  FichaTecnica,
  GaleriaItem,
  Producto,
  ProductoCreatePayload,
  Subcategoria,
} from '../models';
import { CategoriaService } from '../categoria.service';
import { ProductService } from '../product.service';
import { SubcategoriaService } from '../subcategoria.service';

interface AtributoForm {
  nombre: FormControl<string>;
  valor: FormControl<string>;
}

interface GaleriaForm {
  url: FormControl<string>;
  storagePath: FormControl<string>;
  alt: FormControl<string>;
  orden: FormControl<number>;
}

/** Raw value shape of the product form (mirrors the FormGroup definition). */
type ProductoFormRawValue = {
  sku: string;
  titulo: string;
  slug: string;
  descripcionBreve: string;
  descripcionLarga: string;
  categoriaId: string;
  subcategoriaId: string;
  atributos: { nombre: string; valor: string }[];
  precioValor: number | null;
  precioVisible: boolean;
  stockDisponible: boolean;
  stockCantidad: number | null;
  galeria: { url: string; storagePath: string; alt: string; orden: number }[];
  fichaUrl: string;
  fichaStorage: string;
  fichaNombre: string;
  destacado: boolean;
  publicado: boolean;
};

/**
 * Product create/edit page (spec `admin-catalog-crud` + change
 * `admin-uploads`): dedicated pages (`/products/new`, `/products/:id`)
 * covering the full backend DTO. Gallery rows and the ficha técnica are
 * upload-first: each row exposes an upload control (gallery accepts
 * jpg/jpeg/png/webp up to 5 MB, the ficha accepts a PDF up to 10 MB) and the
 * returned `url`/`storagePath` fill hidden, autocompleted form controls —
 * only `alt`/`orden` (galería) and `nombreArchivo` (ficha) stay editable
 * (tasks 4.1–4.3, design D7). Editing preloads the thumbnail (or PDF name)
 * and a re-upload overwrites both hidden fields. Separate category →
 * subcategory selects cascade (design D7); 409 conflicts map to their fields
 * (design D9) and success returns to the list with a flash banner (D5).
 * Saving stays disabled while any upload is in flight.
 */
@Component({
  selector: 'app-producto-form-page',
  imports: [
    ReactiveFormsModule,
    NgClass,
    AlertComponent,
    ButtonComponent,
    PageBreadcrumbComponent,
    UploadFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './producto-form-page.component.html',
})
export class ProductoFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly subcategoriaService = inject(SubcategoriaService);
  private readonly roles = inject(RoleService);

  readonly canWrite = computed(() => this.roles.hasRole('admin', 'superadmin'));

  readonly isEdit = signal(false);
  readonly productoId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly skuConflict = signal<string | null>(null);
  readonly slugConflict = signal<string | null>(null);

  /** Number of in-flight uploads; saving stays disabled while > 0 (task 4.2). */
  readonly uploadingCount = signal(0);
  readonly uploading = computed(() => this.uploadingCount() > 0);

  readonly categorias = signal<{ id: string; nombre: string }[]>([]);
  readonly subcategorias = signal<Subcategoria[]>([]);

  readonly form = new FormGroup({
    sku: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    titulo: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    slug: new FormControl<string>('', { nonNullable: true }),
    descripcionBreve: new FormControl<string>('', { nonNullable: true }),
    descripcionLarga: new FormControl<string>('', { nonNullable: true }),
    categoriaId: new FormControl<string>('', { nonNullable: true }),
    subcategoriaId: new FormControl<string>('', { nonNullable: true }),
    atributos: new FormArray<FormGroup<AtributoForm>>([]),
    precioValor: new FormControl<number | null>(null),
    precioVisible: new FormControl<boolean>(true, { nonNullable: true }),
    stockDisponible: new FormControl<boolean>(true, { nonNullable: true }),
    stockCantidad: new FormControl<number | null>(null),
    galeria: new FormArray<FormGroup<GaleriaForm>>([]),
    fichaUrl: new FormControl<string>('', { nonNullable: true }),
    fichaStorage: new FormControl<string>('', { nonNullable: true }),
    fichaNombre: new FormControl<string>('', { nonNullable: true }),
    destacado: new FormControl<boolean>(false, { nonNullable: true }),
    publicado: new FormControl<boolean>(false, { nonNullable: true }),
  });

  get atributosArray(): FormArray<FormGroup<AtributoForm>> {
    return this.form.controls.atributos;
  }

  get galeriaArray(): FormArray<FormGroup<GaleriaForm>> {
    return this.form.controls.galeria;
  }

  get titulo(): FormControl<string> {
    return this.form.controls.titulo;
  }

  get showTituloError(): boolean {
    return this.titulo.touched && this.titulo.invalid;
  }

  get tituloErrorMessage(): string {
    return this.titulo.hasError('required') ? 'El título es obligatorio.' : 'Título inválido.';
  }

  /** Resolves when the cascade for the currently selected category finished. */
  private subcategoriasLoad: Promise<void> = Promise.resolve();

  constructor() {
    this.form.controls.categoriaId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((categoriaId) => {
        this.form.controls.subcategoriaId.setValue('');
        this.subcategoriasLoad = this.loadSubcategorias(categoriaId);
      });
  }

  ngOnInit(): void {
    void this.loadCategorias();
    const id = this.route.snapshot.paramMap.get('id');
    if (id !== null) {
      this.isEdit.set(true);
      this.productoId.set(id);
      void this.load(id);
    }
  }

  addAtributo(): void {
    this.atributosArray.push(
      new FormGroup<AtributoForm>({
        nombre: new FormControl<string>('', { nonNullable: true }),
        valor: new FormControl<string>('', { nonNullable: true }),
      }),
    );
  }

  removeAtributo(index: number): void {
    this.atributosArray.removeAt(index);
  }

  addGaleria(): void {
    this.galeriaArray.push(
      new FormGroup<GaleriaForm>({
        url: new FormControl<string>('', { nonNullable: true }),
        storagePath: new FormControl<string>('', { nonNullable: true }),
        alt: new FormControl<string>('', { nonNullable: true }),
        orden: new FormControl<number>(this.galeriaArray.length, { nonNullable: true }),
      }),
    );
  }

  removeGaleria(index: number): void {
    this.galeriaArray.removeAt(index);
  }

  /** Tracks in-flight uploads so the save button stays disabled while uploading. */
  onUploadingChange(active: boolean): void {
    this.uploadingCount.update((count) => Math.max(0, count + (active ? 1 : -1)));
  }

  /** Autocompletes the hidden `url`/`storagePath` of a gallery row (task 4.1). */
  onGaleriaUploaded(index: number, asset: UploadedAsset): void {
    this.galeriaArray.at(index).patchValue({ url: asset.url, storagePath: asset.storagePath });
  }

  /** Autocompletes the hidden ficha técnica `url`/`storagePath` (task 4.2). */
  onFichaUploaded(asset: UploadedAsset): void {
    this.form.controls.fichaUrl.setValue(asset.url);
    this.form.controls.fichaStorage.setValue(asset.storagePath);
  }

  /** True when the form can be submitted (valid, not saving, no uploads). */
  private canSubmit(): boolean {
    return !this.form.invalid && !this.saving() && !this.uploading();
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.canSubmit()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.formError.set(null);
    this.skuConflict.set(null);
    this.slugConflict.set(null);
    try {
      const payload = this.buildPayload();
      const editId = this.productoId();
      if (editId !== null) {
        await firstValueFrom(this.productService.update(editId, payload));
        await this.router.navigate(['/products'], { state: { flash: 'updated' } });
      } else {
        await firstValueFrom(this.productService.create(payload));
        await this.router.navigate(['/products'], { state: { flash: 'created' } });
      }
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        const conflict = fieldConflictMessage(error);
        if (conflict !== null && conflict.field === 'sku') {
          this.skuConflict.set(conflict.message);
        } else if (conflict !== null && conflict.field === 'slug') {
          this.slugConflict.set(conflict.message);
        } else {
          this.formError.set(error.message);
        }
      } else {
        this.formError.set('No se pudo guardar el producto.');
      }
    } finally {
      this.saving.set(false);
    }
  }

  backToList(): void {
    void this.router.navigate(['/products']);
  }

  /** Builds the DTO payload, omitting empty optional fields (typed). */
  private buildPayload(): ProductoCreatePayload {
    const value = this.form.getRawValue() as ProductoFormRawValue;
    const payload = this.buildBasePayload(value);
    this.appendAtributos(payload, value.atributos);
    this.appendPrecioStock(payload, value);
    this.appendGaleria(payload, value.galeria);
    this.appendFichaTecnica(payload, value);
    return payload;
  }

  private buildBasePayload(value: ProductoFormRawValue): ProductoCreatePayload {
    const payload: ProductoCreatePayload = {
      sku: value.sku.trim(),
      titulo: value.titulo.trim(),
    };
    if (value.slug.trim() !== '') {
      payload.slug = value.slug.trim();
    }
    if (value.descripcionBreve.trim() !== '') {
      payload.descripcionBreve = value.descripcionBreve.trim();
    }
    if (value.descripcionLarga.trim() !== '') {
      payload.descripcionLarga = value.descripcionLarga;
    }
    if (value.categoriaId !== '') {
      payload.categoriaId = value.categoriaId;
    }
    payload.subcategoriaId = value.subcategoriaId !== '' ? value.subcategoriaId : null;
    payload.destacado = value.destacado;
    payload.publicado = value.publicado;
    return payload;
  }

  private appendAtributos(
    payload: ProductoCreatePayload,
    atributos: { nombre: string; valor: string }[],
  ): void {
    const cleaned = atributos
      .map((atributo) => ({ nombre: atributo.nombre.trim(), valor: atributo.valor.trim() }))
      .filter((atributo) => atributo.nombre !== '');
    if (cleaned.length > 0) {
      payload.atributos = cleaned satisfies Atributo[];
    }
  }

  private appendPrecioStock(payload: ProductoCreatePayload, value: ProductoFormRawValue): void {
    if (value.precioValor !== null) {
      payload.precio = { valor: value.precioValor, visible: value.precioVisible };
    }
    payload.stock = { disponible: value.stockDisponible, cantidad: value.stockCantidad };
  }

  private appendGaleria(
    payload: ProductoCreatePayload,
    galeria: { url: string; storagePath: string; alt: string; orden: number }[],
  ): void {
    if (galeria.length === 0) {
      return;
    }
    payload.galeria = galeria.map((item, index) => ({
      url: item.url.trim(),
      storagePath: item.storagePath.trim(),
      alt: item.alt.trim(),
      orden: item.orden ?? index,
    })) satisfies GaleriaItem[];
  }

  private appendFichaTecnica(payload: ProductoCreatePayload, value: ProductoFormRawValue): void {
    if (value.fichaUrl.trim() === '') {
      return;
    }
    payload.fichaTecnica = {
      url: value.fichaUrl.trim(),
      storagePath: value.fichaStorage.trim(),
      nombreArchivo:
        value.fichaNombre.trim() !== '' ? value.fichaNombre.trim() : value.fichaUrl.trim(),
    } satisfies FichaTecnica;
  }

  private async loadCategorias(): Promise<void> {
    try {
      const categorias = await firstValueFrom(this.categoriaService.findAll());
      this.categorias.set(categorias.map((c) => ({ id: c.id, nombre: c.nombre })));
    } catch {
      this.categorias.set([]);
    }
  }

  private async loadSubcategorias(categoriaId: string): Promise<void> {
    if (categoriaId === '') {
      this.subcategorias.set([]);
      return;
    }
    try {
      this.subcategorias.set(
        await firstValueFrom(this.subcategoriaService.findByCategoria(categoriaId)),
      );
    } catch {
      this.subcategorias.set([]);
    }
  }

  private async load(id: string): Promise<void> {
    try {
      const producto = await firstValueFrom(this.productService.findById(id));
      this.patchFromProducto(producto);
      this.pushFormArrays(producto);
      // Wait for the cascade triggered by patchValue, then restore the original
      // subcategory so the edit form shows it (design D7).
      await this.subcategoriasLoad;
      if (producto.subcategoriaId !== null) {
        this.form.controls.subcategoriaId.setValue(producto.subcategoriaId);
      }
    } catch (error: unknown) {
      this.formError.set(
        error instanceof ApiError ? error.message : 'No se pudo cargar el producto.',
      );
    }
  }

  private patchFromProducto(producto: Producto): void {
    this.form.patchValue({
      sku: producto.sku,
      titulo: producto.titulo,
      slug: producto.slug,
      descripcionBreve: producto.descripcionBreve,
      descripcionLarga: producto.descripcionLarga,
      categoriaId: producto.categoriaId,
      subcategoriaId: '',
      precioValor: producto.precio.valor,
      precioVisible: producto.precio.visible,
      stockDisponible: producto.stock.disponible,
      stockCantidad: producto.stock.cantidad,
      fichaUrl: producto.fichaTecnica?.url ?? '',
      fichaStorage: producto.fichaTecnica?.storagePath ?? '',
      fichaNombre: producto.fichaTecnica?.nombreArchivo ?? '',
      destacado: producto.destacado,
      publicado: producto.publicado,
    });
  }

  private pushFormArrays(producto: Producto): void {
    for (const atributo of producto.atributos) {
      this.atributosArray.push(
        new FormGroup<AtributoForm>({
          nombre: new FormControl<string>(atributo.nombre, { nonNullable: true }),
          valor: new FormControl<string>(atributo.valor, { nonNullable: true }),
        }),
      );
    }
    for (const item of producto.galeria) {
      this.galeriaArray.push(
        new FormGroup<GaleriaForm>({
          url: new FormControl<string>(item.url, { nonNullable: true }),
          storagePath: new FormControl<string>(item.storagePath, { nonNullable: true }),
          alt: new FormControl<string>(item.alt, { nonNullable: true }),
          orden: new FormControl<number>(item.orden, { nonNullable: true }),
        }),
      );
    }
  }
}
