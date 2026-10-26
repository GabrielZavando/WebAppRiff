import { CoolifyRebuildWebhookClient } from './coolify-rebuild-webhook.client';
import { CatalogRebuildWebhookPayload } from '../domain/icatalog-rebuild-webhook-client';

const ORIGINAL_ENV = process.env;
const ORIGINAL_FETCH = global.fetch;

const URL = 'https://hooks.example.com/catalog-rebuild';
const TOKEN = 'super-secret-token-123';

const PAYLOAD: CatalogRebuildWebhookPayload = {
  firstChangeAt: '2026-01-15T11:58:00.000Z',
  lastChangeAt: '2026-01-15T11:59:30.000Z',
};

describe('CoolifyRebuildWebhookClient', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock as unknown as typeof fetch;
    process.env = { ...ORIGINAL_ENV };
    process.env.CATALOG_REBUILD_WEBHOOK_URL = URL;
    process.env.CATALOG_REBUILD_WEBHOOK_TOKEN = TOKEN;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    global.fetch = ORIGINAL_FETCH;
    jest.restoreAllMocks();
  });

  it('POSTs to the configured URL with Bearer auth and a JSON payload', async () => {
    const client = new CoolifyRebuildWebhookClient();

    const result = await client.dispatch(PAYLOAD);

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(URL);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual(
      expect.objectContaining({
        authorization: `Bearer ${TOKEN}`,
        'content-type': 'application/json',
      }),
    );
    expect(JSON.parse(String(init.body))).toEqual(PAYLOAD);
  });

  it('aborts the request after a timeout via AbortSignal', async () => {
    const client = new CoolifyRebuildWebhookClient();

    await client.dispatch(PAYLOAD);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('reports a non-OK HTTP status without throwing (no silent failure)', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const client = new CoolifyRebuildWebhookClient();

    const result = await client.dispatch(PAYLOAD);

    expect(result).toEqual({ ok: false, reason: 'http-error', status: 500 });
  });

  it('reports a timeout as a timeout reason', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new Error('The operation was aborted'), { name: 'TimeoutError' }),
    );
    const client = new CoolifyRebuildWebhookClient();

    const result = await client.dispatch(PAYLOAD);

    expect(result).toEqual({ ok: false, reason: 'timeout' });
  });

  it('reports transport failures without throwing', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const client = new CoolifyRebuildWebhookClient();

    const result = await client.dispatch(PAYLOAD);

    expect(result).toEqual({ ok: false, reason: 'transport' });
  });

  it('reports not-configured without fetching when the URL or token is unset', async () => {
    delete process.env.CATALOG_REBUILD_WEBHOOK_URL;
    const client = new CoolifyRebuildWebhookClient();

    const result = await client.dispatch(PAYLOAD);

    expect(result).toEqual({ ok: false, reason: 'not-configured' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
