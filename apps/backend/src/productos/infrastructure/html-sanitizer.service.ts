import { Injectable } from '@nestjs/common';
import { IHtmlSanitizer } from '../domain/ihtml-sanitizer';
import { sanitizeRichHtml, stripHtmlToText } from '@riff/html-sanitize';

/**
 * Adaptador de `IHtmlSanitizer` que delega en el paquete compartido
 * `@riff/html-sanitize` (única fuente de verdad de la política de saneamiento).
 * Registrado por el token `I_HTML_SANITIZER` en `ProductosModule`.
 */
@Injectable()
export class HtmlSanitizerService implements IHtmlSanitizer {
  sanitizeRichHtml(dirty: string): string {
    return sanitizeRichHtml(dirty);
  }

  stripHtmlToText(dirty: string): string {
    return stripHtmlToText(dirty);
  }
}
