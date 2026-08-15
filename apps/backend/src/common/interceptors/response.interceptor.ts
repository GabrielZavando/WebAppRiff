import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const API_PREFIX = '/api/v1/';

interface ResponseEnvelope<T> {
  data: T;
  error: null;
  meta: {
    timestamp: string;
    path: string;
  };
}

/**
 * Interceptor global que envuelve las respuestas exitosas de los endpoints bajo
 * `/api/v1/` en el sobre consistente `{ data, error: null, meta }`. Las rutas
 * fuera de ese prefijo (p. ej. `/health`) se devuelven sin tocar, preservando la
 * compatibilidad de los probes de salud y cualquier ruta no-API.
 */
@Injectable()
export class ResponseInterceptor<T = unknown> implements NestInterceptor<T, ResponseEnvelope<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseEnvelope<T>> {
    const request = context.switchToHttp().getRequest<{ url?: string }>();
    const url = request?.url ?? '';

    if (!url.startsWith(API_PREFIX)) {
      return next.handle() as Observable<ResponseEnvelope<T>>;
    }

    const path = url;
    return next.handle().pipe(
      map((data) => ({
        data,
        error: null,
        meta: {
          timestamp: new Date().toISOString(),
          path,
        },
      })),
    );
  }
}
