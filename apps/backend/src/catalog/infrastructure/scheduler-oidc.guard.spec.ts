import { Logger, UnauthorizedException } from '@nestjs/common';
import { SchedulerOidcGuard } from './scheduler-oidc.guard';
import { CatalogRebuildConfig } from '../application/catalog-rebuild.config';

interface TestRequest {
  headers?: Record<string, string | string[]>;
}

function makeContext(request: TestRequest) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as Parameters<SchedulerOidcGuard['canActivate']>[0];
}

function buildConfig(overrides: Partial<CatalogRebuildConfig> = {}): CatalogRebuildConfig {
  return {
    silenceSeconds: 60,
    maxWaitSeconds: 300,
    claimTtlSeconds: 60,
    expectedAudience: 'https://api.example.com',
    expectedSa: 'flusher@example.iam.gserviceaccount.com',
    ...overrides,
  };
}

const VALID_TOKEN = 'valid-oidc-token';

function makePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    aud: 'https://api.example.com',
    email: 'flusher@example.iam.gserviceaccount.com',
    email_verified: true,
    sub: '1234',
    ...overrides,
  };
}

describe('SchedulerOidcGuard', () => {
  let verifyIdToken: jest.Mock;
  let warnSpy: jest.SpyInstance;
  let guard: SchedulerOidcGuard;

  beforeEach(() => {
    verifyIdToken = jest.fn();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    guard = new SchedulerOidcGuard(
      { verifyIdToken } as never,
      buildConfig(),
    );
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('rejects calls without the Scheduler identity (scenario f, 5.1)', () => {
    it('rejects 401 when the Authorization header is missing', async () => {
      await expect(guard.canActivate(makeContext({ headers: {} }))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(verifyIdToken).not.toHaveBeenCalled();
    });

    it('rejects 401 when the header is not a Bearer token', async () => {
      const request: TestRequest = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
      await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(verifyIdToken).not.toHaveBeenCalled();
    });

    it('rejects 401 when the token is not a valid Google-issued ID token', async () => {
      verifyIdToken.mockRejectedValue(new Error('invalid token signature'));
      const request: TestRequest = { headers: { authorization: `Bearer ${VALID_TOKEN}` } };

      await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(verifyIdToken).toHaveBeenCalledWith({
        idToken: VALID_TOKEN,
        audience: 'https://api.example.com',
      });
    });
  });

  describe('rejects valid signatures with wrong claims (5.2)', () => {
    it('rejects when aud differs from the expected audience', async () => {
      verifyIdToken.mockResolvedValue({ getPayload: () => makePayload({ aud: 'other' }) });
      const request: TestRequest = { headers: { authorization: `Bearer ${VALID_TOKEN}` } };

      await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when the email differs from the expected service account', async () => {
      verifyIdToken.mockResolvedValue({
        getPayload: () => makePayload({ email: 'other@example.iam.gserviceaccount.com' }),
      });
      const request: TestRequest = { headers: { authorization: `Bearer ${VALID_TOKEN}` } };

      await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when email_verified is false', async () => {
      verifyIdToken.mockResolvedValue({
        getPayload: () => makePayload({ email_verified: false }),
      });
      const request: TestRequest = { headers: { authorization: `Bearer ${VALID_TOKEN}` } };

      await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when the payload has no email at all', async () => {
      verifyIdToken.mockResolvedValue({
        getPayload: () => makePayload({ email: undefined, email_verified: undefined }),
      });
      const request: TestRequest = { headers: { authorization: `Bearer ${VALID_TOKEN}` } };

      await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('never leaks the token in the rejection', async () => {
      verifyIdToken.mockRejectedValue(new Error('invalid token signature'));
      const request: TestRequest = { headers: { authorization: `Bearer ${VALID_TOKEN}` } };

      await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      const messages = warnSpy.mock.calls.map((call) => String(call[0])).join('\n');
      expect(messages).not.toContain(VALID_TOKEN);
    });
  });

  describe('accepts a valid Scheduler identity (5.3)', () => {
    it('allows the request when signature, aud, email and email_verified match', async () => {
      verifyIdToken.mockResolvedValue({ getPayload: () => makePayload() });
      const request: TestRequest = { headers: { authorization: `Bearer ${VALID_TOKEN}` } };

      await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
      expect(verifyIdToken).toHaveBeenCalledWith({
        idToken: VALID_TOKEN,
        audience: 'https://api.example.com',
      });
    });
  });

  describe('fail-closed configuration (5.3)', () => {
    it('rejects every request with a warning when the expected identity is unset', async () => {
      const unconfigured = new SchedulerOidcGuard(
        { verifyIdToken } as never,
        buildConfig({ expectedAudience: null, expectedSa: null }),
      );
      const request: TestRequest = { headers: { authorization: `Bearer ${VALID_TOKEN}` } };

      await expect(unconfigured.canActivate(makeContext(request))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(verifyIdToken).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = String(warnSpy.mock.calls[0][0]);
      expect(message).toContain('CATALOG_REBUILD_FLUSH_EXPECTED');
      expect(message).not.toContain(VALID_TOKEN);
    });
  });
});
