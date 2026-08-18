/**
 * Puerto de saneamiento de HTML (DIP). La implementación concreta vive en
 * `infrastructure` y delega en el paquete compartido `@riff/html-sanitize`,
 * de modo que `domain`/`application` no importan dependencias de infraestructura.
 *
 * `sanitizeRichHtml` devuelve un subconjunto HTML seguro (para `descripcionLarga`);
 * `stripHtmlToText` elimina todo el HTML y devuelve texto plano (para
 * `descripcionBreve`).
 */
export interface IHtmlSanitizer {
  sanitizeRichHtml(dirty: string): string;
  stripHtmlToText(dirty: string): string;
}

export const I_HTML_SANITIZER = 'I_HTML_SANITIZER';
