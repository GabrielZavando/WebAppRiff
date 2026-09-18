import { UrlAccessibilityPort } from './ports';

const DEFAULT_HEAD_TIMEOUT_MS = 8000;

/**
 * Implementación de `UrlAccessibilityPort` que valida la accesibilidad pública
 * de una URL de imagen con un HTTP HEAD request. Devuelve `true` solo si la URL
 * responde HTTP 200; 403/404 y timeouts/errores de red se consideran no
 * accesibles. Nunca lanza: cualquier fallo se traduce en `false`.
 *
 * Usa únicamente `fetch` (stdlib de Node) y `AbortController` para el timeout;
 * no sigue el body porque es una petición HEAD.
 */
export class UrlAccessibilityHttpAdapter implements UrlAccessibilityPort {
  constructor(private readonly timeoutMs = DEFAULT_HEAD_TIMEOUT_MS) {}

  async isAccessible(url: string): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
      return res.ok && res.status === 200;
    } catch {
      // Timeout (AbortError) y errores de red: no accesible, nunca propagar.
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }
}