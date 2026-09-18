import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RebuildNotifierHttpAdapter } from './rebuild-notifier.adapter';
import { REBUILD_NOTIFIER_PORT } from './ports';

const URL_ENV = 'CATALOG_REBUILD_WEBHOOK_URL';
const WEBHOOK_URL = 'https://hooks.example.com/catalog-rebuild';

describe('RebuildNotifierHttpAdapter', () => {
  let config: { get: jest.Mock };
  let fetchMock: jest.Mock;
  let warnSpy: jest.SpyInstance;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    jest.clearAllMocks();
    config = { get: jest.fn() };
    config.get.mockImplementation((key: string) =>
      key === URL_ENV ? WEBHOOK_URL : undefined,
    );
    fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock as unknown as typeof fetch;
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    warnSpy.mockRestore();
  });

  it('is bound to the REBUILD_NOTIFIER_PORT token', () => {
    expect(REBUILD_NOTIFIER_PORT).toBe('REBUILD_NOTIFIER_PORT');
  });

  it('returns ok:true and POSTs to the configured URL when the webhook responds 200', async () => {
    const adapter = new RebuildNotifierHttpAdapter(config as unknown as ConfigService);
    const result = await adapter.notifyRebuild();
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      WEBHOOK_URL,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('returns ok:false without throwing when the webhook responds a non-2xx status', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const adapter = new RebuildNotifierHttpAdapter(config as unknown as ConfigService);
    const result = await adapter.notifyRebuild();
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/500/);
  });

  it('returns ok:false without throwing on timeout and logs a warning', async () => {
    fetchMock.mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));
    const adapter = new RebuildNotifierHttpAdapter(config as unknown as ConfigService);
    const result = await adapter.notifyRebuild();
    expect(result.ok).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('returns ok:false without throwing on a network error and logs a warning', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const adapter = new RebuildNotifierHttpAdapter(config as unknown as ConfigService);
    const result = await adapter.notifyRebuild();
    expect(result.ok).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('sends no request and reports a failure when the URL is not configured', async () => {
    config.get.mockReturnValue(undefined);
    const adapter = new RebuildNotifierHttpAdapter(config as unknown as ConfigService);
    const result = await adapter.notifyRebuild();
    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});