import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { normalizeApiBaseUrl, resolveApiBaseUrl } from '@/lib/api/apiBaseUrl';

/**
 * Contract tests for the shared API base URL resolver (SC-env-01/02).
 *
 * The resolver guarantees the returned base always ends with `/api/v1`,
 * whether `NESTJS_API_URL` is configured with or without the version suffix.
 */
describe('resolveApiBaseUrl', () => {
  let originalValue: string | undefined;

  beforeEach(() => {
    originalValue = process.env.NESTJS_API_URL;
  });

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.NESTJS_API_URL;
    } else {
      process.env.NESTJS_API_URL = originalValue;
    }
  });

  it('appends /api/v1 when the configured URL lacks the version suffix', () => {
    process.env.NESTJS_API_URL = 'https://api.somosriff.cl';
    expect(resolveApiBaseUrl()).toBe('https://api.somosriff.cl/api/v1');
  });

  it('keeps the URL unchanged when it already ends with /api/v1', () => {
    process.env.NESTJS_API_URL = 'https://api.somosriff.cl/api/v1';
    expect(resolveApiBaseUrl()).toBe('https://api.somosriff.cl/api/v1');
  });

  it('never duplicates the suffix (no /api/v1/api/v1)', () => {
    process.env.NESTJS_API_URL = 'https://api.somosriff.cl/api/v1';
    const resolved = resolveApiBaseUrl();
    expect(resolved).not.toContain('/api/v1/api/v1');
    expect(resolved).toBe('https://api.somosriff.cl/api/v1');
  });

  it('tolerates a trailing slash on a URL without the suffix', () => {
    process.env.NESTJS_API_URL = 'https://api.somosriff.cl/';
    expect(resolveApiBaseUrl()).toBe('https://api.somosriff.cl/api/v1');
  });

  it('tolerates a trailing slash on a URL that already has the suffix', () => {
    process.env.NESTJS_API_URL = 'https://api.somosriff.cl/api/v1/';
    expect(resolveApiBaseUrl()).toBe('https://api.somosriff.cl/api/v1');
  });

  it('falls back to the documented default when the variable is unset', () => {
    delete process.env.NESTJS_API_URL;
    expect(resolveApiBaseUrl()).toBe('http://localhost:3000/api/v1');
  });

  it('falls back to the documented default when the variable is empty or blank', () => {
    process.env.NESTJS_API_URL = '   ';
    expect(resolveApiBaseUrl()).toBe('http://localhost:3000/api/v1');
  });
});

/**
 * Contract tests for `normalizeApiBaseUrl`, the pure normalizer shared by the
 * Node build-time data clients and the browser-side form client.
 *
 * Documented behaviour, in the resolver's own terms: it only guarantees the
 * `/api/v1` suffix and trailing-slash tolerance. It does NOT validate the
 * scheme or the host — a scheme-less value is normalized mechanically, which
 * yields a relative result and therefore a broken URL for the browser. The
 * no-scheme case is asserted below to pin that limitation down rather than
 * leave it as an untested surprise.
 */
describe('normalizeApiBaseUrl', () => {
  it('appends /api/v1 when the value lacks the version suffix', () => {
    expect(normalizeApiBaseUrl('https://api.somosriff.cl')).toBe(
      'https://api.somosriff.cl/api/v1',
    );
  });

  it('does not duplicate the suffix when /api/v1 is already present', () => {
    expect(normalizeApiBaseUrl('https://api.somosriff.cl/api/v1')).toBe(
      'https://api.somosriff.cl/api/v1',
    );
    expect(normalizeApiBaseUrl('https://api.somosriff.cl/api/v1')).not.toContain(
      '/api/v1/api/v1',
    );
  });

  it('strips a trailing slash before appending or matching the suffix', () => {
    expect(normalizeApiBaseUrl('https://api.somosriff.cl/')).toBe(
      'https://api.somosriff.cl/api/v1',
    );
    expect(normalizeApiBaseUrl('https://api.somosriff.cl/api/v1/')).toBe(
      'https://api.somosriff.cl/api/v1',
    );
  });

  it('falls back to the documented default for empty or blank values', () => {
    expect(normalizeApiBaseUrl('')).toBe('http://localhost:3000/api/v1');
    expect(normalizeApiBaseUrl('   ')).toBe('http://localhost:3000/api/v1');
  });

  it('trims surrounding whitespace before normalizing', () => {
    expect(normalizeApiBaseUrl('  https://api.somosriff.cl  ')).toBe(
      'https://api.somosriff.cl/api/v1',
    );
  });

  it('returns the documented default unchanged (already normalized)', () => {
    expect(normalizeApiBaseUrl('http://localhost:3000/api/v1')).toBe(
      'http://localhost:3000/api/v1',
    );
  });

  it('does not validate the scheme: a scheme-less value stays relative', () => {
    // Known limitation, not a supported configuration. The normalizer is a
    // suffix normalizer, not a URL validator; callers must supply an absolute
    // base. Pinned so a future change to this behaviour is a deliberate one.
    expect(normalizeApiBaseUrl('api.somosriff.cl')).toBe(
      'api.somosriff.cl/api/v1',
    );
  });
});
