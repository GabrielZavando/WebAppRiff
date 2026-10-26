/**
 * Pure decision logic for the scheduled catalog-rebuild flush
 * (change `catalog-rebuild-flush-scheduler`).
 *
 * The flush endpoint runs this decision inside a Firestore transaction over the
 * single rebuild-state document. All inputs are plain values so the whole state
 * machine is unit-testable without Firestore (DIP: the Firestore adapter only
 * maps timestamps and executes the resulting action).
 *
 * Decision rules (in order):
 *  1. No pending batch (`firstChangeAt` absent)  → `no_pending`
 *  2. A claim is still valid (within its TTL)    → `in_flight`
 *  3. Backoff is active (`nextAttemptAt` future) → `backoff`
 *  4. Silence window met (now - lastChangeAt >= silenceMs)
 *     OR max-wait met (now - firstChangeAt >= maxWaitMs) → `claim`
 *  5. Otherwise the batch keeps accumulating     → `hold`
 *
 * An EXPIRED claim (older than claimTtlMs) is reclaimable: rule 2 only applies
 * while the claim is within its TTL, so a crash between the claim and the
 * webhook dispatch never strands a batch (scenario g).
 */

/** Outcome of the pure flush decision. */
export type FlushDecision = 'no_pending' | 'in_flight' | 'backoff' | 'hold' | 'claim';

/** The subset of the persisted rebuild state the decision needs. */
export interface FlushDecisionInput {
  /** When the pending batch started (null when there is no pending batch). */
  readonly firstChangeAt: Date | null;
  /** Last catalog change recorded for the pending batch. */
  readonly lastChangeAt: Date | null;
  /** When the current claim was taken, if any. */
  readonly claimedAt: Date | null;
  /** Earliest allowed retry after a failed dispatch, if any. */
  readonly nextAttemptAt: Date | null;
}

/** Configurable windows for the decision (seconds converted to ms upstream). */
export interface FlushDecisionWindows {
  readonly silenceMs: number;
  readonly maxWaitMs: number;
  readonly claimTtlMs: number;
}

/** Backoff base: first failed dispatch retries after 60 s. */
export const BACKOFF_BASE_MS = 60_000;
/** Backoff cap: retries never wait more than 15 minutes (no dead-letter). */
export const BACKOFF_CAP_MS = 900_000;

/**
 * Backoff delay after a failed dispatch given the number of PRIOR failures
 * (0 for the first failure): min(60s x 2^n, 15 min) → 60s, 120s, 240s, 480s,
 * then capped at 15 min. The state store increments `failureCount` and uses
 * the PRIOR count as the exponent so the first retry happens one minute later.
 */
export function computeBackoffMs(priorFailureCount: number): number {
  const exponential = BACKOFF_BASE_MS * 2 ** Math.max(0, priorFailureCount);
  return Math.min(exponential, BACKOFF_CAP_MS);
}

/** Pure decision: whether a flush at `now` may dispatch the pending batch. */
export function decideFlush(
  state: FlushDecisionInput | null,
  now: Date,
  windows: FlushDecisionWindows,
): FlushDecision {
  if (!state || !state.firstChangeAt || !state.lastChangeAt) {
    return 'no_pending';
  }

  const nowMs = now.getTime();

  if (state.claimedAt) {
    const claimAgeMs = nowMs - state.claimedAt.getTime();
    if (claimAgeMs < windows.claimTtlMs) {
      return 'in_flight';
    }
  }

  if (state.nextAttemptAt && nowMs < state.nextAttemptAt.getTime()) {
    return 'backoff';
  }

  const silenceMet = nowMs - state.lastChangeAt.getTime() >= windows.silenceMs;
  const maxWaitMet = nowMs - state.firstChangeAt.getTime() >= windows.maxWaitMs;
  if (silenceMet || maxWaitMet) {
    return 'claim';
  }

  return 'hold';
}
