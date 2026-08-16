import { Injectable, Inject } from '@nestjs/common';
import {
  ICategoriaRepository,
  I_CATEGORIA_REPOSITORY,
} from '@/categorias/domain/icategoria.repository';
import {
  ISubcategoriaRepository,
  I_SUBCATEGORIA_REPOSITORY,
} from '@/subcategorias/domain/isubcategoria.repository';
import type { CatalogSeed } from '@/cli/seed/catalog-seed.loader';

export type SeedResult = {
  categoriasCreadas: number;
  categoriasOmitidas: number;
  subcategoriasCreadas: number;
  subcategoriasOmitidas: number;
};

@Injectable()
export class SeedCatalogUseCase {
  constructor(
    @Inject(I_CATEGORIA_REPOSITORY) private readonly categoriaRepository: ICategoriaRepository,
    @Inject(I_SUBCATEGORIA_REPOSITORY) private readonly subcategoriaRepository: ISubcategoriaRepository,
  ) {}

  async execute(seed: CatalogSeed): Promise<SeedResult> {
    const result: SeedResult = {
      categoriasCreadas: 0,
      categoriasOmitidas: 0,
      subcategoriasCreadas: 0,
      subcategoriasOmitidas: 0,
    };

    // Categories first: subcategories reference them by id, so parents must exist
    // before children are created (deterministic ids avoid relying on Firestore order).
    for (const categoria of seed.categorias) {
      const existing = await this.categoriaRepository.findById(categoria.id);
      if (existing) {
        result.categoriasOmitidas += 1;
        continue;
      }
      await this.categoriaRepository.create({
        nombre: categoria.nombre,
        slug: categoria.slug,
        orden: categoria.orden,
        activa: categoria.activa,
        id: categoria.id,
        esDefault: categoria.esDefault,
      });
      result.categoriasCreadas += 1;
    }

    for (const subcategoria of seed.subcategorias) {
      const existing = await this.subcategoriaRepository.findById(subcategoria.id);
      if (existing) {
        result.subcategoriasOmitidas += 1;
        continue;
      }
      await this.subcategoriaRepository.create({
        categoriaId: subcategoria.categoriaId,
        nombre: subcategoria.nombre,
        slug: subcategoria.slug,
        orden: subcategoria.orden,
        activa: subcategoria.activa,
        id: subcategoria.id,
      });
      result.subcategoriasCreadas += 1;
    }

    return result;
  }
}
