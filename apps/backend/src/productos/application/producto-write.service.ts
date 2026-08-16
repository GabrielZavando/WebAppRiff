import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  IProductIntegrityRepository,
  IProductRepository,
  I_PRODUCT_INTEGRITY_REPOSITORY,
  I_PRODUCT_REPOSITORY,
} from '../domain/iproducto.repository';
import { Producto, ProductoInput, ProductoUpdateInput } from '../domain/producto.entity';
import { ProductoConsistencyService } from './producto-consistency.service';
import { slugify } from '@/common/utils/slugify';
import { FichaTecnicaDto, GaleriaItemDto } from '../infrastructure/producto-nested.dto';
import { ProductoCreateDto } from '../infrastructure/producto-create.dto';
import { ProductoUpdateDto } from '../infrastructure/producto-update.dto';

const MAX_GALERIA = 10;

const CREATE_DEFAULTS: Record<string, unknown> = {
  idExterno: null,
  descripcionBreve: '',
  descripcionLarga: '',
  subcategoriaId: null,
  atributos: [],
  galeria: [],
  fichaTecnica: null,
  destacado: false,
  publicado: false,
};

const UPDATE_PASSTHROUGH: Array<keyof ProductoUpdateInput> = [
  'titulo',
  'descripcionBreve',
  'descripcionLarga',
  'atributos',
  'precio',
  'stock',
  'galeria',
  'destacado',
  'publicado',
];

/**
 * Casos de uso de escritura de productos. Centraliza todas las reglas de
 * negocio del dominio (unicidad SKU/slug, categoría por defecto, consistencia
 * categoría/subcategoría, galería ≤10, ficha técnica PDF). Inyecta 3
 * dependencias (repository + integrity + consistency service), dentro del
 * límite de 3 del estándar de backend.
 */
@Injectable()
export class ProductoWriteService {
  constructor(
    @Inject(I_PRODUCT_REPOSITORY)
    private readonly repository: IProductRepository,
    @Inject(I_PRODUCT_INTEGRITY_REPOSITORY)
    private readonly integrity: IProductIntegrityRepository,
    private readonly consistency: ProductoConsistencyService,
  ) {}

  async create(dto: ProductoCreateDto): Promise<Producto> {
    if (await this.integrity.existsBySku(dto.sku)) {
      throw new ConflictException('SKU already in use');
    }
    const slug = dto.slug ?? slugify(dto.titulo);
    if (await this.integrity.existsBySlug(slug)) {
      throw new ConflictException('Slug already in use');
    }
    const categoriaId = await this.consistency.assertConsistency(
      dto.categoriaId,
      dto.subcategoriaId,
    );
    this.assertGaleriaSize(dto.galeria);
    this.assertFichaTecnica(dto.fichaTecnica);

    const input = this.buildCreateInput(dto, slug, categoriaId);
    return this.repository.create(input);
  }

  async update(id: string, dto: ProductoUpdateDto): Promise<Producto> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new NotFoundException('Producto not found');
    }

    const sku = this.resolveSku(dto, current.sku);
    const slug = this.resolveSlug(dto, current.slug);
    await this.assertConsistencyOnUpdate(dto, current);

    if (dto.galeria !== undefined) {
      this.assertGaleriaSize(dto.galeria);
    }
    if (dto.fichaTecnica !== undefined) {
      this.assertFichaTecnica(dto.fichaTecnica);
    }

    if (sku.changed && (await this.integrity.existsBySku(sku.value, id))) {
      throw new ConflictException('SKU already in use');
    }
    if (slug.changed && (await this.integrity.existsBySlug(slug.value, id))) {
      throw new ConflictException('Slug already in use');
    }

    const input = this.buildUpdateInput(dto, sku.value, slug.value);
    return this.repository.update(id, input);
  }

  async remove(id: string): Promise<void> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new NotFoundException('Producto not found');
    }
    await this.repository.remove(id);
  }

  private buildCreateInput(
    dto: ProductoCreateDto,
    slug: string,
    categoriaId: string,
  ): ProductoInput {
    const input = {
      sku: dto.sku,
      titulo: dto.titulo,
      slug,
      categoriaId,
      precio: dto.precio ?? { valor: 0, visible: false },
      stock: dto.stock
        ? { disponible: dto.stock.disponible, cantidad: dto.stock.cantidad ?? null }
        : { disponible: true, cantidad: null },
    } as ProductoInput;
    this.applyDefaults(input, dto as unknown as Record<string, unknown>, CREATE_DEFAULTS);
    return input;
  }

  private buildUpdateInput(
    dto: ProductoUpdateDto,
    sku: string,
    slug: string,
  ): ProductoUpdateInput {
    const input: ProductoUpdateInput = {};
    for (const key of UPDATE_PASSTHROUGH) {
      const value = dto[key];
      if (value !== undefined) {
        (input as Record<string, unknown>)[key] = value;
      }
    }
    if (dto.idExterno !== undefined) input.idExterno = dto.idExterno;
    if (dto.sku !== undefined) input.sku = sku;
    if (dto.slug !== undefined) input.slug = slug;
    if (dto.categoriaId !== undefined) input.categoriaId = dto.categoriaId;
    if (dto.subcategoriaId !== undefined) input.subcategoriaId = dto.subcategoriaId;
    if (dto.fichaTecnica !== undefined) input.fichaTecnica = dto.fichaTecnica;
    return input;
  }

  private resolveSku(
    dto: ProductoUpdateDto,
    currentSku: string,
  ): { value: string; changed: boolean } {
    if (dto.sku === undefined) return { value: currentSku, changed: false };
    return { value: dto.sku, changed: dto.sku !== currentSku };
  }

  private resolveSlug(
    dto: ProductoUpdateDto,
    currentSlug: string,
  ): { value: string; changed: boolean } {
    if (dto.slug === undefined) return { value: currentSlug, changed: false };
    return { value: dto.slug, changed: dto.slug !== currentSlug };
  }

  private async assertConsistencyOnUpdate(
    dto: ProductoUpdateDto,
    current: Producto,
  ): Promise<void> {
    const categoriaId = dto.categoriaId ?? current.categoriaId;
    const subcategoriaId =
      dto.subcategoriaId !== undefined ? dto.subcategoriaId : current.subcategoriaId;
    const changed = dto.categoriaId !== undefined || dto.subcategoriaId !== undefined;
    if (changed) {
      await this.consistency.assertConsistency(categoriaId, subcategoriaId);
    }
  }

  private applyDefaults(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
    defaults: Record<string, unknown>,
  ): void {
    for (const key of Object.keys(defaults)) {
      const value = source[key];
      target[key] = value === undefined ? defaults[key] : value;
    }
  }

  private assertGaleriaSize(galeria?: GaleriaItemDto[]): void {
    if (galeria && galeria.length > MAX_GALERIA) {
      throw new UnprocessableEntityException('Gallery exceeds the maximum of 10 images');
    }
  }

  private assertFichaTecnica(ficha?: FichaTecnicaDto | null): void {
    if (ficha && !/\.pdf$/i.test(ficha.nombreArchivo ?? '')) {
      throw new UnprocessableEntityException('Ficha tecnica must be a PDF file');
    }
  }
}
