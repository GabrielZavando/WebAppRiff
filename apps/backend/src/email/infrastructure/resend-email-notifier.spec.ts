import { Logger } from '@nestjs/common';
import { ResendEmailNotifier } from './resend-email-notifier';
import { EmailMessage } from '../domain/iemail-notifier';

const ORIGINAL_ENV = process.env;
const ORIGINAL_FETCH = global.fetch;

const API_KEY = 're_secret-test-key-123';
const RESEND_API_URL = 'https://api.resend.com/emails';

const SAMPLE_MESSAGE: EmailMessage = {
  from: 'contacto@somosriff.cl',
  to: ['contacto@somosriff.cl'],
  subject: 'Nuevo contacto',
  text: 'Nombre: Juan\nEmail: juan@example.com',
};

describe('ResendEmailNotifier', () => {
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

  describe('no-op without RESEND_API_KEY', () => {
    it('never calls the API and logs a warning when the key is empty', async () => {
      delete process.env.RESEND_API_KEY;
      const notifier = new ResendEmailNotifier();
      await notifier.sendEmail(SAMPLE_MESSAGE);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = String(warnSpy.mock.calls[0][0]);
      expect(message).toContain('RESEND_API_KEY');
    });
  });

  describe('delivery', () => {
    it('POSTs a JSON payload to the Resend API with Bearer auth', async () => {
      process.env.RESEND_API_KEY = API_KEY;
      const notifier = new ResendEmailNotifier();
      await notifier.sendEmail(SAMPLE_MESSAGE);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(RESEND_API_URL);
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual(
        expect.objectContaining({
          authorization: `Bearer ${API_KEY}`,
          'content-type': 'application/json',
        }),
      );
      expect(JSON.parse(String(init.body))).toEqual({
        from: SAMPLE_MESSAGE.from,
        to: [...SAMPLE_MESSAGE.to],
        subject: SAMPLE_MESSAGE.subject,
        text: SAMPLE_MESSAGE.text,
      });
    });

    it('uses a bounded timeout via AbortSignal', async () => {
      process.env.RESEND_API_KEY = API_KEY;
      const notifier = new ResendEmailNotifier();
      await notifier.sendEmail(SAMPLE_MESSAGE);

      const [, init] = fetchMock.mock.calls[0];
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });

    it('resolves when the provider returns 2xx', async () => {
      process.env.RESEND_API_KEY = API_KEY;
      const notifier = new ResendEmailNotifier();
      await expect(notifier.sendEmail(SAMPLE_MESSAGE)).resolves.toBeUndefined();
    });
  });

  describe('failure semantics', () => {
    it('throws on a non-2xx provider response', async () => {
      process.env.RESEND_API_KEY = API_KEY;
      fetchMock.mockResolvedValue({ ok: false, status: 422 });
      const notifier = new ResendEmailNotifier();
      await expect(notifier.sendEmail(SAMPLE_MESSAGE)).rejects.toThrow(
        'HTTP 422',
      );
    });

    it('throws on network failure', async () => {
      process.env.RESEND_API_KEY = API_KEY;
      fetchMock.mockRejectedValue(new Error('network down'));
      const notifier = new ResendEmailNotifier();
      await expect(notifier.sendEmail(SAMPLE_MESSAGE)).rejects.toThrow(
        'Email delivery failed',
      );
    });

    it('never leaks the API key in thrown errors', async () => {
      process.env.RESEND_API_KEY = API_KEY;
      fetchMock.mockRejectedValue(new Error('network down'));
      const notifier = new ResendEmailNotifier();
      await expect(notifier.sendEmail(SAMPLE_MESSAGE)).rejects.toThrow(
        expect.not.stringContaining(API_KEY),
      );
    });
  });
});