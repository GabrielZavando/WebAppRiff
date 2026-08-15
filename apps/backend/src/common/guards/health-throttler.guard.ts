import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Devuelve `true` si la URL corresponde al endpoint de health check, que debe
 * quedar exento de rate limiting para no bloquear los probes de salud.
 */
export function isHealthCheckUrl(url: string | undefined): boolean {
  return url === '/health';
}

@Injectable()
export class HealthAwareThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ url?: string }>();
    return isHealthCheckUrl(request?.url);
  }
}
