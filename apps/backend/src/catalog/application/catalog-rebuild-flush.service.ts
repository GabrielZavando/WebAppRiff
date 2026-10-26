import { Inject, Injectable, Logger } from '@nestjs/common';
import { CatalogRebuildConfig, CATALOG_REBUILD_CONFIG } from './catalog-rebuild.config';
import {
  FlushDecision,
  FlushDecisionWindows,
} from '../domain/flush-decision';
import {
  CatalogRebuildState,
  ICatalogRebuildStateStore,
  I_CATALOG_REBUILD_STATE_STORE,
} from '../domain/icatalog-rebuild-state-store';
import {
  CatalogRebuildWebhookPayload,
  CatalogRebuildWebhookDispatchResult,
  ICatalogRebuildWebhookClient,
  I_CATALOG_REBUILD_WEBHOOK_CLIENT,
} from '../domain/icatalog-rebuild-webhook-client';

/** Status reported by the flush endpoint (always 2xx; retries are owned by the backoff). */
export type CatalogRebuildFlushStatus =
  | 'dispatched'
  | 'dispatch-failed'
  | 'no-pending'
  | 'in-flight'
  | 'backoff'
  | 'hold';

/** Maps a non-claim flush decision to the endpoint status vocabulary. */
const DECISION_STATUS: Record<Exclude<FlushDecision, 'claim'>, CatalogRebuildFlushStatus> = {
  no_pending: 'no-pending',
  in_flight: 'in-flight',
  backoff: 'backoff',
  hold: 'hold',
};

export interface CatalogRebuildFlushOutcome {
  readonly status: CatalogRebuildFlushStatus;
}

/** failures after which dispatch-failure logs escalate from warning to error. */
const ESCALATION_FAILURE_COUNT = 10;
/** batch age (ms) after which dispatch-failure logs escalate to error (24 h). */
const ESCALATION_BATCH_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Application service for `POST /internal/catalog-rebuild/flush` (change
 * `catalog-rebuild-flush-scheduler`).
 *
 * Flow (design D4):
 *  1. transactional decision + claim via the state store (`decideFlush` runs
 *     inside the Firestore transaction);
 *  2. the webhook dispatch happens OUTSIDE the transaction, after the claim
 *     commit;
 *  3. resolution in a second transaction conditioned on the claim id:
 *     success clears the state (or keeps a residual batch), failure keeps the
 *     pending batch with bounded backoff. There is NO dead-letter: retries are
 *     owned by the backoff (`nextAttemptAt`), never delegated to the Scheduler.
 */
@Injectable()
export class CatalogRebuildFlushService {
  private readonly logger = new Logger(CatalogRebuildFlushService.name);

  constructor(
    @Inject(I_CATALOG_REBUILD_STATE_STORE)
    private readonly store: ICatalogRebuildStateStore,
    @Inject(I_CATALOG_REBUILD_WEBHOOK_CLIENT)
    private readonly webhookClient: ICatalogRebuildWebhookClient,
    @Inject(CATALOG_REBUILD_CONFIG)
    private readonly config: CatalogRebuildConfig,
  ) {}

  async flush(): Promise<CatalogRebuildFlushOutcome> {
    const claim = await this.store.claimForDispatch(new Date(), this.windows());
    if (claim.decision !== 'claim') {
      return { status: DECISION_STATUS[claim.decision] };
    }

    const { claimId, state } = claim;
    const result = await this.webhookClient.dispatch(this.toPayload(state));

    if (result.ok) {
      await this.store.resolveSuccess(claimId);
      return { status: 'dispatched' };
    }

    const failure = await this.store.resolveFailure(claimId, new Date());
    this.logDispatchFailure(result, state);
    if (failure) {
      this.escalateIfNeeded(failure.failureCount, failure.batchAgeMs);
    }
    return { status: 'dispatch-failed' };
  }
  private windows(): FlushDecisionWindows {
    return {
      silenceMs: this.config.silenceSeconds * 1000,
      maxWaitMs: this.config.maxWaitSeconds * 1000,
      claimTtlMs: this.config.claimTtlSeconds * 1000,
    };
  }

  private toPayload(state: CatalogRebuildState): CatalogRebuildWebhookPayload {
    const firstChangeAt = state.firstChangeAt ?? new Date(0);
    const lastChangeAt = state.lastChangeAt ?? firstChangeAt;
    return {
      firstChangeAt: firstChangeAt.toISOString(),
      lastChangeAt: lastChangeAt.toISOString(),
    };
  }

  private logDispatchFailure(
    result: Exclude<CatalogRebuildWebhookDispatchResult, { ok: true }>,
    state: CatalogRebuildState,
  ): void {
    if (result.reason === 'not-configured') {
      this.logger.warn(
        '[catalog-rebuild-flush] rebuild webhook not configured (missing ' +
          'CATALOG_REBUILD_WEBHOOK_URL and/or CATALOG_REBUILD_WEBHOOK_TOKEN); ' +
          'dispatch skipped and batch kept pending',
      );
      return;
    }
    const detail =
      result.reason === 'http-error' ? `HTTP ${result.status ?? 'unknown'}` : result.reason;
    this.logger.warn(
      `[catalog-rebuild-flush] dispatch failed (${detail}) for ` +
        `${state.lastEntityType ?? 'catalog'}/${state.lastAction ?? 'changed'}`,
    );
  }

  private escalateIfNeeded(failureCount: number, batchAgeMs: number): void {
    if (failureCount < ESCALATION_FAILURE_COUNT && batchAgeMs < ESCALATION_BATCH_AGE_MS) {
      return;
    }
    this.logger.error(
      `[catalog-rebuild-flush] dispatch keeps failing (failureCount=${failureCount}, ` +
        `batchAgeMs=${batchAgeMs}); the batch stays pending (no dead-letter) — ` +
        'check the Coolify webhook availability',
    );
  }
}
