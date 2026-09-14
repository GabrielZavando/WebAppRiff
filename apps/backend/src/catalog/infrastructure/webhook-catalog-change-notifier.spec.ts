import { Logger } from '@nestjs/common';
import { WebhookCatalogChangeNotifier } from './webhook-catalog-change-notifier';
import { CatalogChangeEvent } from '../domain/icatalog-change-notifier';

const ORIGINAL_ENV = process.env;
const ORIGINAL_FETCH = global.fetch;

const URL = 'https://hooks.example.com/catalog-rebuild';
const TOKEN = 'super-secret-token-123';

const SAMPLE_EVENT: CatalogChangeEvent = {
  entityType: 'category',
  id: 'c1',
  action: 'created',
  occurredAt: new Date().toISOString(),
};

describe('WebhookCatalogChangeNotifier', () => {
  let fetchMock: jest.Mock;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock as unknown as typeof fetch;
    process.env = { ...ORIGINAL_ENV };
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    global.fetch = ORIGINAL_FETCH;
    warnSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('SC-006 unset URL/token is a no-op', () => {
    it('sends nothing when the URL is unset', () => {
      delete process.env.CATALOG_REBUILD_WEBHOOK_URL;
      process.env.CATALOG_REBUILD_WEBHOOK_TOKEN = TOKEN;
      const notifier = new WebhookCatalogChangeNotifier();
      notifier.notifyChange(SAMPLE_EVENT);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('sends nothing when the token is unset', () => {
      process.env.CATALOG_REBUILD_WEBHOOK_URL = URL;
      delete process.env.CATALOG_REBUILD_WEBHOOK_TOKEN;
      const notifier = new WebhookCatalogChangeNotifier();
      notifier.notifyChange(SAMPLE_EVENT);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('SC-004 authenticated request', () => {
    it('POSTs to the configured URL with Bearer auth and JSON payload', async () => {
      process.env.CATALOG_REBUILD_WEBHOOK_URL = URL;
      process.env.CATALOG_REBUILD_WEBHOOK_TOKEN = TOKEN;
      const notifier = new WebhookCatalogChangeNotifier();
      notifier.notifyChange(SAMPLE_EVENT);
      // Fire-and-forget: wait a tick for the async dispatch to settle.
      await new Promise((resolve) => setImmediate(resolve));

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(URL);
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual(
        expect.objectContaining({
          authorization: `Bearer ${TOKEN}`,
          'content-type': 'application/json',
        }),
      );
      expect(JSON.parse(String(init.body))).toEqual(SAMPLE_EVENT);
    });

    it('aborts the request after a timeout via AbortSignal', async () => {
      process.env.CATALOG_REBUILD_WEBHOOK_URL = URL;
      process.env.CATALOG_REBUILD_WEBHOOK_TOKEN = TOKEN;
      const notifier = new WebhookCatalogChangeNotifier();
      notifier.notifyChange(SAMPLE_EVENT);
      await new Promise((resolve) => setImmediate(resolve));

      const [, init] = fetchMock.mock.calls[0];
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('SC-008 logs never leak token or URL', () => {
    it('logs a warning with entity type/action only, without token or URL', async () => {
      process.env.CATALOG_REBUILD_WEBHOOK_URL = URL;
      process.env.CATALOG_REBUILD_WEBHOOK_TOKEN = TOKEN;
      fetchMock.mockRejectedValue(new Error('boom'));
      const notifier = new WebhookCatalogChangeNotifier();
      notifier.notifyChange(SAMPLE_EVENT);
      await new Promise((resolve) => setImmediate(resolve));

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = String(warnSpy.mock.calls[0][0]);
      expect(message).toContain('category');
      expect(message).toContain('created');
      expect(message).not.toContain(TOKEN);
      expect(message).not.toContain(URL);
    });
  });

  describe('SC-007 webhook failure does not fail the mutation', () => {
    it('never throws and logs a warning on transport failure', async () => {
      process.env.CATALOG_REBUILD_WEBHOOK_URL = URL;
      process.env.CATALOG_REBUILD_WEBHOOK_TOKEN = TOKEN;
      fetchMock.mockRejectedValue(new Error('network down'));
      const notifier = new WebhookCatalogChangeNotifier();

      expect(() => notifier.notifyChange(SAMPLE_EVENT)).not.toThrow();
      await new Promise((resolve) => setImmediate(resolve));

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('SC-011 non-OK HTTP status is logged (no silent failure)', () => {
    it('logs a warning with the HTTP status and type/action, without secrets', async () => {
      process.env.CATALOG_REBUILD_WEBHOOK_URL = URL;
      process.env.CATALOG_REBUILD_WEBHOOK_TOKEN = TOKEN;
      fetchMock.mockResolvedValue({ ok: false, status: 500 });
      const notifier = new WebhookCatalogChangeNotifier();

      expect(() => notifier.notifyChange(SAMPLE_EVENT)).not.toThrow();
      await new Promise((resolve) => setImmediate(resolve));

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalled();
      const message = String(warnSpy.mock.calls[0][0]);
      expect(message).toContain('500');
      expect(message).toContain('category');
      expect(message).toContain('created');
      expect(message).not.toContain(TOKEN);
      expect(message).not.toContain(URL);
    });

    it('does not log a warning on a 2xx response', async () => {
      process.env.CATALOG_REBUILD_WEBHOOK_URL = URL;
      process.env.CATALOG_REBUILD_WEBHOOK_TOKEN = TOKEN;
      fetchMock.mockResolvedValue({ ok: true, status: 200 });
      const notifier = new WebhookCatalogChangeNotifier();

      notifier.notifyChange(SAMPLE_EVENT);
      await new Promise((resolve) => setImmediate(resolve));

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});