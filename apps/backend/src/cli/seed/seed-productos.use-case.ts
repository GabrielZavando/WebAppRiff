import { Injectable, Inject, ConflictException } from '@nestjs/common';
import {
  IProductIntegrityRepository,
  IProductRepository,
  I_PRODUCT_INTEGRITY_REPOSITORY,
  I_PRODUCT_REPOSITORY,
} from '@/productos/domain/iproducto.repository';
import { ProductoConsistencyService } from '@/productos/application/producto-consistency.service';
import { ProductoSeed } from './producto-seed.loader';

export type SeedResult = {
  productosCreados: number;
  productosOmitidos: number;
};

/**
 * Caso de uso operativo de seed de productos. Reutiliza las reglas de dominio
 * (consistencia categoría/subcategoría vía `ProductoConsistencyService` y
 * unicidad SKU/slug vía `IProductIntegrityRepository`) y escribe con IDs
 * deterministas usando el repository. Es idempotente: si el documento con el
 * `id` ya existe se omite. Tres dependencias (repository + integrity +
 * consistency service), dentro del límite de 3 del estándar de backend.
 */
@Injectable()
export class SeedProductosUseCase {
  constructor(
    @Inject(I_PRODUCT_REPOSITORY) private readonly repository: IProductRepository,
    @Inject(I_PRODUCT_INTEGRITY_REPOSITORY) private readonly integrity: IProductIntegrityRepository,
    private readonly consistency: ProductoConsistencyService,
  ) {}

  async execute(seed: ProductoSeed): Promise<SeedResult> {
    const result: SeedResult = {
      productosCreados: 0,
      productosOmitidos: 0,
    };

    for (const item of seed.productos) {
      const existing = await this.repository.findById(item.id);
      if (existing) {
        result.productosOmitidos += 1;
        continue;
      }

      await this.consistency.assertConsistency(item.categoriaId, item.subcategoriaId);
      if (await this.integrity.existsBySku(item.sku)) {
        throw new ConflictException(`SKU already in use: ${item.sku}`);
      }
      if (await this.integrity.existsBySlug(item.slug)) {
        throw new ConflictException(`Slug already in use: ${item.slug}`);
      }

      this.consistency.sanitizeDescriptions(item);
      await this.repository.create(item);
      result.productosCreados += 1;
    }

    return result;
  }
}
