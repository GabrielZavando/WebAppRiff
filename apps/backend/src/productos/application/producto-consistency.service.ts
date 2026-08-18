import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ICategoriaRepository,
  I_CATEGORIA_REPOSITORY,
} from '../../categorias/domain/icategoria.repository';
import {
  ISubcategoriaIntegrityRepository,
  I_SUBCATEGORIA_INTEGRITY_REPOSITORY,
} from '../../subcategorias/domain/isubcategoria.repository';
import { IHtmlSanitizer, I_HTML_SANITIZER } from '../domain/ihtml-sanitizer';

export const DEFAULT_CATEGORIA_ID = 'sin-categoria';

/**
 * Valida la consistencia y el formato del contenido de un producto antes de
 * persistir, aislando las dependencias de otros módulos. Inyecta tres puertos
 * (dentro del límite de 3 del estándar de backend):
 * - `ICategoriaRepository` para la existencia de la categoría.
 * - `ISubcategoriaIntegrityRepository` para la pertenencia de la subcategoría.
 * - `IHtmlSanitizer` para sanear `descripcionLarga` (HTML) y `descripcionBreve`
 *   (texto plano) según la política compartida `@riff/html-sanitize`.
 */
@Injectable()
export class ProductoConsistencyService {
  constructor(
    @Inject(I_CATEGORIA_REPOSITORY)
    private readonly categoriaRepository: ICategoriaRepository,
    @Inject(I_SUBCATEGORIA_INTEGRITY_REPOSITORY)
    private readonly subcategoriaIntegrity: ISubcategoriaIntegrityRepository,
    @Inject(I_HTML_SANITIZER)
    private readonly htmlSanitizer: IHtmlSanitizer,
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

  /**
   * Sanea los campos de descripción de un producto antes de persistirlo:
   * - `descripcionLarga` → subconjunto HTML seguro (vía `sanitizeRichHtml`).
   * - `descripcionBreve` → texto plano sin tags (vía `stripHtmlToText`).
   *
   * Mutua el objeto recibido (solo los campos presentes) y lo devuelve, de modo
   * que puede aplicarse tanto al `ProductoInput` completo (create) como a un
   * `ProductoUpdateInput` parcial (update).
   */
  sanitizeDescriptions<T extends { descripcionBreve?: string; descripcionLarga?: string }>(
    data: T,
  ): T {
    if (data.descripcionLarga !== undefined) {
      data.descripcionLarga = this.htmlSanitizer.sanitizeRichHtml(data.descripcionLarga);
    }
    if (data.descripcionBreve !== undefined) {
      data.descripcionBreve = this.htmlSanitizer.stripHtmlToText(data.descripcionBreve);
    }
    return data;
  }
}
