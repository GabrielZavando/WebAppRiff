import { ThrottlerOptions } from '@nestjs/throttler';

export interface ThrottlerConfig {
  /** Time-to-live window in milliseconds (throttler v6 convention). */
  ttl?: number;
  limit?: number;
}

type ResolvedThrottlerOptions = {
  throttlers: ThrottlerOptions[];
};

const DEFAULT_TTL_MS = 60_000;
const DEFAULT_LIMIT = 100;

/**
 * Construye las opciones de `ThrottlerModule` para el BFF.
 *
 * En throttler v6 `ttl` se expresa en milisegundos; el default de 60.000 ms
 * equivale a una ventana de 60 segundos. El límite por defecto es 100
 * peticiones por ventana. Estos valores se sobreescriben con `THROTTLE_TTL` y
 * `THROTTLE_LIMIT` del entorno.
 */
export function buildThrottlerOptions(config: ThrottlerConfig): ResolvedThrottlerOptions {
  return {
    throttlers: [
      {
        ttl: config.ttl ?? DEFAULT_TTL_MS,
        limit: config.limit ?? DEFAULT_LIMIT,
      },
    ],
  };
}
