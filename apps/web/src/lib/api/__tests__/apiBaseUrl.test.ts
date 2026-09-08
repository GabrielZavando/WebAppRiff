import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveApiBaseUrl } from '@/lib/api/apiBaseUrl';

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
