import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export interface CorsConfig {
  nodeEnv: string;
  astroSiteUrl?: string;
  angularAdminUrl?: string;
}

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

/**
 * Construye las opciones de CORS para el BFF.
 *
 * En desarrollo se permite cualquier origen mediante una `CustomOrigin` que
 * refleja el origen de la petición (válido junto con `credentials: true`).
 * En producción la allowlist es estricta: solo los orígenes del sitio Astro y
 * del admin Angular que estén configurados. Si ninguno está presente, la lista
 * queda vacía (fail-closed) en lugar de abrir CORS.
 */
export function buildCorsOptions(config: CorsConfig): CorsOptions {
  const credentials = true;

  if (config.nodeEnv === 'development') {
    return {
      origin: (_req, cb) => cb(null, true),
      credentials,
    };
  }

  const origins = [config.astroSiteUrl, config.angularAdminUrl].filter(
    (url): url is string => typeof url === 'string' && url.trim().length > 0,
  );

  return {
    origin: origins,
    credentials,
    methods: ALLOWED_METHODS,
  };
}
