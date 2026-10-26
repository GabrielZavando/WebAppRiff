import { ExecutionContext } from '@nestjs/common';
import { HealthAwareThrottlerGuard, isHealthCheckUrl, isThrottleExemptUrl } from './health-throttler.guard';

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

describe('throttle exemptions (catalog-rebuild-flush-scheduler, 6.4)', () => {
  it('exempts the internal flush route alongside /health', () => {
    expect(isThrottleExemptUrl('/health')).toBe(true);
    expect(isThrottleExemptUrl('/internal/catalog-rebuild/flush')).toBe(true);
  });

  it('does not exempt public API routes', () => {
    expect(isThrottleExemptUrl('/api/v1/products')).toBe(false);
    expect(isThrottleExemptUrl(undefined)).toBe(false);
  });
});

describe('HealthAwareThrottlerGuard.shouldSkip', () => {
  const guard = new HealthAwareThrottlerGuard({} as never, {} as never, {} as never);

  it('skips the /health route', async () => {
    await expect((guard as unknown as { shouldSkip: (c: ExecutionContext) => Promise<boolean> }).shouldSkip(makeContext('/health'))).resolves.toBe(true);
  });

  it('skips the internal flush route (Scheduler cadence must not hit the public rate limit)', async () => {
    await expect(
      (guard as unknown as { shouldSkip: (c: ExecutionContext) => Promise<boolean> }).shouldSkip(
        makeContext('/internal/catalog-rebuild/flush'),
      ),
    ).resolves.toBe(true);
  });

  it('does not skip API routes', async () => {
    await expect((guard as unknown as { shouldSkip: (c: ExecutionContext) => Promise<boolean> }).shouldSkip(makeContext('/api/v1/products'))).resolves.toBe(false);
  });
});
