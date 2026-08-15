import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

interface ResponseLike {
  status: (code: number) => { json: (body: unknown) => void };
}
interface RequestLike {
  url: string;
}

function makeHost(url: string, response: ResponseLike): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url }) as RequestLike,
    }),
  } as unknown as ArgumentsHost;
}

describe('HttpExceptionFilter', () => {
  it('normalizes an HttpException to the error envelope', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = makeHost('/api/v1/products', { status });

    new HttpExceptionFilter().catch(
      new HttpException({ statusCode: 404, message: 'Not found', error: 'Not Found' }, 404),
      host,
    );

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      data: null,
      error: { statusCode: 404, message: 'Not found', error: 'Not Found' },
      meta: { timestamp: expect.any(String), path: '/api/v1/products' },
    });
  });

  it('normalizes an unexpected error to a 500', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = makeHost('/api/v1/products', { status });

    new HttpExceptionFilter().catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = json.mock.calls[0][0] as {
      error: { statusCode: number; message: string };
    };
    expect(body.error.statusCode).toBe(500);
    expect(body.error.message).toBe('Internal server error');
  });

  it('uses the raw string message when getResponse returns a string', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = makeHost('/api/v1/products', { status });

    new HttpExceptionFilter().catch(new HttpException('Plain error message', 400), host);

    expect(status).toHaveBeenCalledWith(400);
    const body = json.mock.calls[0][0] as {
      error: { statusCode: number; message: string; error: string };
    };
    expect(body.error.message).toBe('Plain error message');
    expect(body.error.error).toBe('HttpException');
  });

  it('falls back to exception message/name when the response object omits them', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = makeHost('/api/v1/products', { status });

    new HttpExceptionFilter().catch(new HttpException({ statusCode: 400 }, 400), host);

    expect(status).toHaveBeenCalledWith(400);
    const body = json.mock.calls[0][0] as {
      error: { statusCode: number; message: string; error: string };
    };
    expect(body.error.message).toBe('Http Exception');
    expect(body.error.error).toBe('HttpException');
  });
});
