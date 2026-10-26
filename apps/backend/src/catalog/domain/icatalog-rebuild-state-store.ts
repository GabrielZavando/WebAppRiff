import { CatalogChangeAction, CatalogChangeEvent, CatalogEntityType } from './icatalog-change-notifier';
import { FlushDecision, FlushDecisionInput, FlushDecisionWindows } from './flush-decision';

/**
 * Durable state of the catalog rebuild buffer (change
 * `catalog-rebuild-flush-scheduler`). Persisted as a single Firestore document
 * (`catalog_rebuild_state/global`) so pending changes survive scale-to-zero,
 * crashes and concurrent Cloud Run instances.
 */
export interface CatalogRebuildState extends FlushDecisionInput {
  /** Id of the flush that currently holds the claim, if any. */
  readonly claimId: string | null;
  /** Number of failed dispatch attempts for the pending batch. */
  readonly failureCount: number;
  /** When the last dispatch attempt failed, if any. */
  readonly lastFailureAt: Date | null;
  /** Entity type/action of the most recent change (for warning logs). */
  readonly lastEntityType: CatalogEntityType | null;
  readonly lastAction: CatalogChangeAction | null;
}

/**
 * Result of the transactional claim: either the pure decision blocked the
 * dispatch (`no_pending` | `in_flight` | `backoff` | `hold`) or the claim was
 * taken and the caller must dispatch the webhook and resolve the claim.
 */
export type FlushClaim =
  | { decision: Exclude<FlushDecision, 'claim'> }
  | { decision: 'claim'; claimId: string; state: CatalogRebuildState };

/** Outcome of resolving a claim after a successful webhook dispatch. */
export type FlushSuccessResolution = 'cleared' | 'residual' | 'not_owner';

/**
 * Outcome of resolving a claim after a FAILED webhook dispatch. `null` when
 * the claim no longer belongs to the caller (stolen/expired), in which case
 * the retry is owned by whoever holds it now.
 */
export interface FlushFailureResolution {
  /** failureCount AFTER the increment (1 for the first failure). */
  readonly failureCount: number;
  /** Earliest instant the next flush may retry the dispatch. */
  readonly nextAttemptAt: Date;
  /** Age of the pending batch (now - firstChangeAt), for log escalation. */
  readonly batchAgeMs: number;
}

export const I_CATALOG_REBUILD_STATE_STORE = 'I_CATALOG_REBUILD_STATE_STORE';

/**
 * Port for the durable rebuild-state document. Implementations MUST be
 * transactional for `claimForDispatch` / `resolveSuccess` / `resolveFailure`
 * (single-doc Firestore transactions) so concurrent flush instances can never
 * double-dispatch (spec scenario c), and `recordChange` MUST preserve
 * `firstChangeAt` across a batch (spec scenario: edits accumulate).
 */
export interface ICatalogRebuildStateStore {
  /**
   * Record a catalog change in the pending batch: sets `firstChangeAt` only
   * when the state was clean, updates `lastChangeAt` (and the last event's
   * type/action). MUST NOT touch claim or backoff fields.
   */
  recordChange(event: CatalogChangeEvent): Promise<void>;

  /**
   * Run the flush decision inside a transaction and, when it returns `claim`,
   * persist `claimedAt`/`claimId` so concurrent flushes serialize. The webhook
   * dispatch itself happens OUTSIDE the transaction (after this returns).
   */
  claimForDispatch(now: Date, windows: FlushDecisionWindows): Promise<FlushClaim>;

  /**
   * Resolve a claim after a SUCCESSFUL webhook dispatch (transaction,
   * conditioned on `claimId`): clears the state when no edits arrived during
   * the flight, otherwise keeps a residual batch restarting the max-wait clock
   * at `firstChangeAt = claimedAt`.
   */
  resolveSuccess(claimId: string): Promise<FlushSuccessResolution>;

  /**
   * Resolve a claim after a FAILED webhook dispatch (transaction, conditioned
   * on `claimId`): keeps the pending batch with its original `firstChangeAt`
   * and the freshest `lastChangeAt`, releasing the claim and scheduling the
   * retry with bounded backoff. Returns null when the claim is not ours.
   */
  resolveFailure(claimId: string, now: Date): Promise<FlushFailureResolution | null>;
}
