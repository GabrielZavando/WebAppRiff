import { buildThrottlerOptions } from './throttler.config';

describe('buildThrottlerOptions', () => {
  it('encodes the provided ttl and limit (throttler v6: ttl in ms)', () => {
    const options = buildThrottlerOptions({ ttl: 60, limit: 100 });

    expect(options.throttlers).toHaveLength(1);
    expect(options.throttlers[0].ttl).toBe(60);
    expect(options.throttlers[0].limit).toBe(100);
  });

  it('falls back to positive defaults when env is unset', () => {
    const options = buildThrottlerOptions({});

    expect(options.throttlers[0].ttl).toBeGreaterThan(0);
    expect(options.throttlers[0].limit).toBeGreaterThan(0);
  });
});
