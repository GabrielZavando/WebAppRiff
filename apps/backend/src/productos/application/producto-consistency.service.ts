import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ICategoriaRepository,
  I_CATEGORIA_REPOSITORY,
} from '../../categorias/domain/icategoria.repository';
import {
  ISubcategoriaIntegrityRepository,
  I_SUBCATEGORIA_INTEGRITY_REPOSITORY,
} from '../../subcategorias/domain/isubcategoria.repository';

export const DEFAULT_CATEGORIA_ID = 'sin-categoria';

/**
 * Valida la consistencia categoría/subcategoría de un producto aislando las
 * dependencias de otros módulos. Inyecta dos puertos. La existencia de la
 * categoría se resuelve con `ICategoriaRepository.findById` (el módulo de
 * categorías ya exporta el token); la pertenencia de la subcategoría con
 * `ISubcategoriaIntegrityRepository.belongsToCategoria`. La categoría por
 * defecto es "sin-categoria" cuando se omite `categoriaId`.
 */
@Injectable()
export class ProductoConsistencyService {
  constructor(
    @Inject(I_CATEGORIA_REPOSITORY)
    private readonly categoriaRepository: ICategoriaRepository,
    @Inject(I_SUBCATEGORIA_INTEGRITY_REPOSITORY)
    private readonly subcategoriaIntegrity: ISubcategoriaIntegrityRepository,
  ) {}

  /**
   * Resuelve la categoría efectiva y valida la consistencia con la
   * subcategoría. Lanza 404 si la categoría no existe (sin subcategoría), o 409
   * si la subcategoría no pertenece a la categoría indicada. Devuelve el id de
   * categoría efectivo a persistir.
   */
  async assertConsistency(
    categoriaId: string | undefined,
    subcategoriaId: string | null | undefined,
  ): Promise<string> {
    const effectiveCategoriaId = categoriaId ?? DEFAULT_CATEGORIA_ID;

    if (subcategoriaId) {
      const belongs = await this.subcategoriaIntegrity.belongsToCategoria(
        subcategoriaId,
        effectiveCategoriaId,
      );
      if (!belongs) {
        throw new ConflictException('Subcategoria does not belong to the category');
      }
      return effectiveCategoriaId;
    }

    const categoria = await this.categoriaRepository.findById(effectiveCategoriaId);
    if (!categoria) {
      throw new NotFoundException('Category not found');
    }
    return effectiveCategoriaId;
  }
}
