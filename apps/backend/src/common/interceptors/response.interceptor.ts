import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const API_PREFIX = '/api/v1/';

interface EnvelopeMeta {
  timestamp: string;
  path: string;
  [key: string]: unknown;
}

interface ResponseEnvelope<T> {
  data: T;
  error: null;
  meta: EnvelopeMeta;
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
      map((data) => {
        const hasHandlerMeta =
          data !== null &&
          typeof data === 'object' &&
          'meta' in data &&
          (data as Record<string, unknown>).meta !== null &&
          typeof (data as Record<string, unknown>).meta === 'object';

        const handlerMeta: Record<string, unknown> = hasHandlerMeta
          ? ((data as Record<string, unknown>).meta as Record<string, unknown>)
          : {};

        const handlerData =
          data !== null &&
          typeof data === 'object' &&
          'data' in data
            ? (data as Record<string, unknown>).data
            : data;

        return {
          data: handlerData,
          error: null,
          meta: {
            timestamp: new Date().toISOString(),
            path,
            ...handlerMeta,
          },
        };
      }),
    );
  }
}
