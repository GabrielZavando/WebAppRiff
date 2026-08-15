import { ExecutionContext } from '@nestjs/common';
import { HealthAwareThrottlerGuard, isHealthCheckUrl } from './health-throttler.guard';

function makeContext(url?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ url }),
    }),
  } as unknown as ExecutionContext;
}

describe('isHealthCheckUrl', () => {
  it('returns true only for /health', () => {
    expect(isHealthCheckUrl('/health')).toBe(true);
    expect(isHealthCheckUrl('/api/v1/products')).toBe(false);
    expect(isHealthCheckUrl(undefined)).toBe(false);
  });
});

describe('HealthAwareThrottlerGuard.shouldSkip', () => {
  const guard = new HealthAwareThrottlerGuard({} as never, {} as never, {} as never);

  it('skips the /health route', async () => {
    await expect((guard as unknown as { shouldSkip: (c: ExecutionContext) => Promise<boolean> }).shouldSkip(makeContext('/health'))).resolves.toBe(true);
  });

  it('does not skip API routes', async () => {
    await expect((guard as unknown as { shouldSkip: (c: ExecutionContext) => Promise<boolean> }).shouldSkip(makeContext('/api/v1/products'))).resolves.toBe(false);
  });
});
