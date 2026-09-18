import { UrlAccessibilityHttpAdapter } from './url-accessibility.adapter';

describe('UrlAccessibilityHttpAdapter', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function mockGlobalFetch(impl: jest.Mock): void {
    (global as unknown as { fetch: jest.Mock }).fetch = impl;
  }

  it('returns true when the HEAD request responds HTTP 200', async () => {
    mockGlobalFetch(
      jest.fn().mockResolvedValue({ ok: true, status: 200 }),
    );
    const adapter = new UrlAccessibilityHttpAdapter();
    await expect(adapter.isAccessible('http://host/img.webp')).resolves.toBe(true);
  });

  it('returns false when the URL responds HTTP 403', async () => {
    mockGlobalFetch(
      jest.fn().mockResolvedValue({ ok: false, status: 403 }),
    );
    const adapter = new UrlAccessibilityHttpAdapter();
    await expect(adapter.isAccessible('http://host/img.webp')).resolves.toBe(false);
  });

  it('returns false when the URL responds HTTP 404', async () => {
    mockGlobalFetch(
      jest.fn().mockResolvedValue({ ok: false, status: 404 }),
    );
    const adapter = new UrlAccessibilityHttpAdapter();
    await expect(adapter.isAccessible('http://host/img.webp')).resolves.toBe(false);
  });

  it('returns false without throwing when the request times out', async () => {
    mockGlobalFetch(
      jest.fn().mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError')),
    );
    const adapter = new UrlAccessibilityHttpAdapter();
    await expect(adapter.isAccessible('http://host/img.webp')).resolves.toBe(false);
  });

  it('returns false without throwing on a network error', async () => {
    mockGlobalFetch(jest.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const adapter = new UrlAccessibilityHttpAdapter();
    await expect(adapter.isAccessible('http://host/img.webp')).resolves.toBe(false);
  });

  it('issues a HEAD request with a timeout signal', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    mockGlobalFetch(fetchMock);
    const adapter = new UrlAccessibilityHttpAdapter();
    await adapter.isAccessible('http://host/img.webp');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://host/img.webp',
      expect.objectContaining({ method: 'HEAD', signal: expect.any(AbortSignal) }),
    );
  });
});