import { Logger } from '@nestjs/common';
import { CatalogRebuildFlushService } from './catalog-rebuild-flush.service';
import { CatalogRebuildConfig } from './catalog-rebuild.config';
import {
  CatalogRebuildState,
  FlushClaim,
  FlushFailureResolution,
  FlushSuccessResolution,
  ICatalogRebuildStateStore,
} from '../domain/icatalog-rebuild-state-store';
import {
  CatalogRebuildWebhookDispatchResult,
  CatalogRebuildWebhookPayload,
  ICatalogRebuildWebhookClient,
} from '../domain/icatalog-rebuild-webhook-client';

const CONFIG: CatalogRebuildConfig = {
  silenceSeconds: 60,
  maxWaitSeconds: 300,
  claimTtlSeconds: 60,
  expectedAudience: 'https://api.example.com',
  expectedSa: 'flusher@example.iam.gserviceaccount.com',
};

const CLAIMED_STATE: CatalogRebuildState = {
  firstChangeAt: new Date('2026-01-15T11:55:00.000Z'),
  lastChangeAt: new Date('2026-01-15T11:58:30.000Z'),
  claimedAt: new Date('2026-01-15T11:59:00.000Z'),
  claimId: 'claim-1',
  failureCount: 0,
  lastFailureAt: null,
  nextAttemptAt: null,
  lastEntityType: 'product',
  lastAction: 'updated',
};

class InMemoryStore implements ICatalogRebuildStateStore {
  public claimResult: FlushClaim = { decision: 'no_pending' };
  public successResult: FlushSuccessResolution = 'cleared';
  public failureResult: FlushFailureResolution | null = null;
  public resolvedSuccessWith: string[] = [];
  public resolvedFailureWith: string[] = [];

  async recordChange(): Promise<void> {
    // not used by the service
  }

  async claimForDispatch(): Promise<FlushClaim> {
    return this.claimResult;
  }

  async resolveSuccess(claimId: string): Promise<FlushSuccessResolution> {
    this.resolvedSuccessWith.push(claimId);
    return this.successResult;
  }

  async resolveFailure(claimId: string): Promise<FlushFailureResolution | null> {
    this.resolvedFailureWith.push(claimId);
    return this.failureResult;
  }
}

class StubClient implements ICatalogRebuildWebhookClient {
  public result: CatalogRebuildWebhookDispatchResult = { ok: true };
  public payloads: CatalogRebuildWebhookPayload[] = [];

  async dispatch(payload: CatalogRebuildWebhookPayload): Promise<CatalogRebuildWebhookDispatchResult> {
    this.payloads.push(payload);
    return this.result;
  }
}

function buildFixtures() {
  const store = new InMemoryStore();
  const client = new StubClient();
  const service = new CatalogRebuildFlushService(store, client, CONFIG);
  return { store, client, service };
}

describe('CatalogRebuildFlushService', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('decision short-circuits (no dispatch, no claim resolution)', () => {
    it.each([
      ['no_pending', 'no-pending'],
      ['in_flight', 'in-flight'],
      ['backoff', 'backoff'],
      ['hold', 'hold'],
    ] as const)('maps %s to status %s without contacting the webhook', async (decision, status) => {
      const { store, client, service } = buildFixtures();
      store.claimResult = { decision };

      const outcome = await service.flush();

      expect(outcome).toEqual({ status });
      expect(client.payloads).toHaveLength(0);
      expect(store.resolvedSuccessWith).toHaveLength(0);
      expect(store.resolvedFailureWith).toHaveLength(0);
    });
  });

  describe('claim → dispatch → resolve (outside the transaction)', () => {
    it('dispatches the claimed batch and clears the state on success (scenarios a/b, 6.1)', async () => {
      const { store, client, service } = buildFixtures();
      store.claimResult = {
        decision: 'claim',
        claimId: 'claim-1',
        state: CLAIMED_STATE,
      };

      const outcome = await service.flush();

      expect(outcome).toEqual({ status: 'dispatched' });
      expect(client.payloads).toHaveLength(1);
      expect(client.payloads[0]).toEqual({
        firstChangeAt: CLAIMED_STATE.firstChangeAt?.toISOString(),
        lastChangeAt: CLAIMED_STATE.lastChangeAt?.toISOString(),
      });
      expect(store.resolvedSuccessWith).toEqual(['claim-1']);
      expect(store.resolvedFailureWith).toHaveLength(0);
    });

    it('resolves the claim with backoff on failure and warns without secrets (scenario d, 6.1)', async () => {
      const { store, client, service } = buildFixtures();
      store.claimResult = {
        decision: 'claim',
        claimId: 'claim-1',
        state: CLAIMED_STATE,
      };
      client.result = { ok: false, reason: 'http-error', status: 500 };
      store.failureResult = {
        failureCount: 1,
        nextAttemptAt: new Date('2026-01-15T12:01:00.000Z'),
        batchAgeMs: 300_000,
      };

      const outcome = await service.flush();

      expect(outcome).toEqual({ status: 'dispatch-failed' });
      expect(store.resolvedSuccessWith).toHaveLength(0);
      expect(store.resolvedFailureWith).toEqual(['claim-1']);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = String(warnSpy.mock.calls[0][0]);
      expect(message).toContain('500');
      expect(message).toContain('product');
      expect(message).toContain('updated');
      expect(message).not.toContain('https://hooks');
      expect(message).not.toContain('Bearer');
    });

    it('warns explicitly when the webhook is not configured', async () => {
      const { store, client, service } = buildFixtures();
      store.claimResult = { decision: 'claim', claimId: 'claim-1', state: CLAIMED_STATE };
      client.result = { ok: false, reason: 'not-configured' };
      store.failureResult = {
        failureCount: 1,
        nextAttemptAt: new Date('2026-01-15T12:01:00.000Z'),
        batchAgeMs: 300_000,
      };

      await service.flush();

      const message = String(warnSpy.mock.calls[0][0]);
      expect(message).toContain('not configured');
    });

    it('still resolves the claim when the failure resolution is null (claim lost)', async () => {
      const { store, client, service } = buildFixtures();
      store.claimResult = { decision: 'claim', claimId: 'claim-1', state: CLAIMED_STATE };
      client.result = { ok: false, reason: 'transport' };
      store.failureResult = null;

      const outcome = await service.flush();

      expect(outcome).toEqual({ status: 'dispatch-failed' });
      expect(store.resolvedFailureWith).toEqual(['claim-1']);
    });
  });

  describe('crash after the claim is retried by the next cycle (scenario g, 6.2)', () => {
    it('re-claims the expired batch in the next flush and dispatches again', async () => {
      const { store, client, service } = buildFixtures();
      // Cycle 1: claim taken, instance dies before resolving (no resolution call).
      store.claimResult = { decision: 'claim', claimId: 'claim-1', state: CLAIMED_STATE };
      client.result = { ok: true };
      await service.flush();
      expect(store.resolvedSuccessWith).toEqual(['claim-1']);

      // Cycle 2 (simulated after crash + claim TTL expiry): the store hands out
      // a NEW claim id for the same batch; the service must dispatch and
      // resolve with the NEW id.
      store.claimResult = {
        decision: 'claim',
        claimId: 'claim-2',
        state: { ...CLAIMED_STATE, claimId: 'claim-2' },
      };

      const outcome = await service.flush();

      expect(outcome).toEqual({ status: 'dispatched' });
      expect(client.payloads).toHaveLength(2);
      expect(store.resolvedSuccessWith).toEqual(['claim-1', 'claim-2']);
    });
  });

  describe('log escalation without dead-letter (6.6)', () => {
    function failureFixture(failureCount: number, batchAgeMs: number) {
      const fixtures = buildFixtures();
      fixtures.store.claimResult = {
        decision: 'claim',
        claimId: 'claim-1',
        state: CLAIMED_STATE,
      };
      fixtures.client.result = { ok: false, reason: 'http-error', status: 503 };
      fixtures.store.failureResult = { failureCount, nextAttemptAt: new Date(), batchAgeMs };
      return fixtures;
    }

    it('escalates to an error log when failureCount reaches 10', async () => {
      const { service } = failureFixture(10, 300_000);

      await service.flush();

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const message = String(errorSpy.mock.calls[0][0]);
      expect(message).toContain('failureCount=10');
    });

    it('escalates to an error log when the batch is older than 24h', async () => {
      const { service } = failureFixture(2, 25 * 60 * 60 * 1000);

      await service.flush();

      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('does not escalate below the thresholds', async () => {
      const { service } = failureFixture(3, 300_000);

      await service.flush();

      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });
});
