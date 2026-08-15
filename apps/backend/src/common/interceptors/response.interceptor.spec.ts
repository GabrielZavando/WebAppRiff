import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

function makeContext(url: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ url }),
    }),
  } as unknown as ExecutionContext;
}

describe('ResponseInterceptor', () => {
  const interceptor = new ResponseInterceptor();

  it('wraps /api/v1 responses in the envelope', (done) => {
    const context = makeContext('/api/v1/products');
    const next: CallHandler = { handle: () => of({ id: 1 }) };

    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual({
        data: { id: 1 },
        error: null,
        meta: { timestamp: expect.any(String), path: '/api/v1/products' },
      });
      done();
    });
  });

  it('passes through non-API routes unchanged', (done) => {
    const context = makeContext('/health');
    const next: CallHandler = { handle: () => of({ status: 'ok' }) };

    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual({ status: 'ok' });
      done();
    });
  });

  it('passes through when the request has no url', (done) => {
    const context = {
      switchToHttp: () => ({ getRequest: () => ({}) }),
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of({ passed: true }) };

    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual({ passed: true });
      done();
    });
  });
});
