import { Injectable, Inject } from '@nestjs/common';
import {
  IProductQueryRepository,
  IProductRepository,
  I_PRODUCT_QUERY_REPOSITORY,
  I_PRODUCT_REPOSITORY,
} from '@/productos/domain/iproducto.repository';
import { IHtmlSanitizer, I_HTML_SANITIZER } from '@/productos/domain/ihtml-sanitizer';

export type NormalizeResult = {
  escaneados: number;
  modificados: number;
  escritos: number;
};

/**
 * Caso de uso operativo de migración de datos: normaliza `descripcionLarga`
 * (HTML saneado) y `descripcionBreve` (texto plano) en todos los documentos de
 * la colección `productos` ya existentes en Firestore. Es idempotente: al
 * re-ejecutarlo, el HTML ya saneado produce la misma salida y no se escribe.
 *
 * Tres dependencias (repositorio de lectura + repositorio de escritura +
 * sanitizador), dentro del límite de 3 del estándar de backend. Bajo
 * `--dry-run` solo reporta el conteo de cambios sin persistir.
 */
@Injectable()
export class NormalizeDescriptionsUseCase {
  constructor(
    @Inject(I_PRODUCT_QUERY_REPOSITORY) private readonly query: IProductQueryRepository,
    @Inject(I_PRODUCT_REPOSITORY) private readonly repository: IProductRepository,
    @Inject(I_HTML_SANITIZER) private readonly htmlSanitizer: IHtmlSanitizer,
  ) {}

  async execute(dryRun: boolean): Promise<NormalizeResult> {
    const productos = await this.query.findAll({});
    const result: NormalizeResult = { escaneados: 0, modificados: 0, escritos: 0 };

    for (const producto of productos) {
      result.escaneados += 1;

      const descripcionLarga = this.htmlSanitizer.sanitizeRichHtml(producto.descripcionLarga);
      const descripcionBreve = this.htmlSanitizer.stripHtmlToText(producto.descripcionBreve);

      const cambio =
        descripcionLarga !== producto.descripcionLarga ||
        descripcionBreve !== producto.descripcionBreve;

      if (!cambio) {
        continue;
      }

      result.modificados += 1;
      if (!dryRun) {
        await this.repository.update(producto.id, { descripcionLarga, descripcionBreve });
        result.escritos += 1;
      }
    }

    return result;
  }
}
