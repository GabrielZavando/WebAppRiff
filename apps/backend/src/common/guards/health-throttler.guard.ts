import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Devuelve `true` si la URL corresponde al endpoint de health check, que debe
 * quedar exento de rate limiting para no bloquear los probes de salud.
 */
export function isHealthCheckUrl(url: string | undefined): boolean {
  return url === '/health';
}

/**
 * Rutas exentas del throttler global: `/health` (probes) y el endpoint interno
 * de flush del rebuild del catálogo, invocado por Cloud Scheduler cada minuto
 * (change `catalog-rebuild-flush-scheduler`). La cadencia del job no debe
 * competir con el límite de peticiones público.
 */
export function isThrottleExemptUrl(url: string | undefined): boolean {
  return url === '/health' || url === '/internal/catalog-rebuild/flush';
}

@Injectable()
export class HealthAwareThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ url?: string }>();
    return isThrottleExemptUrl(request?.url);
  }
}
