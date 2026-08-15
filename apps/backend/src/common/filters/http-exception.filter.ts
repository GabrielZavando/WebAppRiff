import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

interface ResponseLike {
  status: (code: number) => { json: (body: unknown) => void };
}

interface RequestLike {
  url: string;
}

interface ErrorEnvelope {
  data: null;
  error: {
    statusCode: number;
    message: string | string[];
    error: string;
  };
  meta: {
    timestamp: string;
    path: string;
  };
}

/**
 * Filtro global de excepciones que normaliza cualquier error al sobre
 * `{ data: null, error: { statusCode, message, error }, meta }`, alineado con el
 * contrato de respuestas del BFF. Los `HttpException` conservan su status y
 * mensaje; los errores no controlados se reportan como `500` con un mensaje
 * genérico (sin filtrar el stacktrace en producción).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ResponseLike>();
    const request = ctx.getRequest<RequestLike>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[];
    let errorName: string;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        message = (r.message as string | string[]) ?? exception.message;
        errorName = (r.error as string) ?? exception.name;
      } else {
        message = res as string;
        errorName = exception.name;
      }
    } else {
      message = 'Internal server error';
      errorName = 'Internal Server Error';
    }

    const body: ErrorEnvelope = {
      data: null,
      error: { statusCode: status, message, error: errorName },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    response.status(status).json(body);
  }
}
