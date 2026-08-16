import { WebhookCategoryChangeNotifier } from './webhook-category-change-notifier';

const ORIGINAL_ENV = process.env;
const ORIGINAL_FETCH = global.fetch;

const SAMPLE_EVENT = {
  id: 'c1',
  action: 'created' as const,
  occurredAt: new Date().toISOString(),
};

describe('WebhookCategoryChangeNotifier', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock as unknown as typeof fetch;
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    global.fetch = ORIGINAL_FETCH;
    jest.restoreAllMocks();
  });

  it('POSTs to the configured webhook URL with the event payload', async () => {
    process.env.CATEGORIES_WEBHOOK_URL = 'https://hooks.example.com/deploy';
    const notifier = new WebhookCategoryChangeNotifier();
    notifier.notifyChange(SAMPLE_EVENT);
    // Fire-and-forget: wait a tick for the async dispatch to settle.
    await new Promise((resolve) => setImmediate(resolve));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://hooks.example.com/deploy');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual(SAMPLE_EVENT);
  });

  it('does not send a request when the webhook URL is unset', () => {
    delete process.env.CATEGORIES_WEBHOOK_URL;
    const notifier = new WebhookCategoryChangeNotifier();
    notifier.notifyChange(SAMPLE_EVENT);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not throw when the webhook request fails', async () => {
    process.env.CATEGORIES_WEBHOOK_URL = 'https://hooks.example.com/deploy';
    fetchMock.mockRejectedValue(new Error('network down'));
    const notifier = new WebhookCategoryChangeNotifier();

    expect(() => notifier.notifyChange(SAMPLE_EVENT)).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
