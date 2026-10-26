import { Inject, Injectable } from '@nestjs/common';
import { DocumentReference, Firestore, Transaction } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { FIRESTORE } from '../../infrastructure/firebase/firebase.tokens';
import { CatalogChangeEvent } from '../domain/icatalog-change-notifier';
import {
  computeBackoffMs,
  decideFlush,
  FlushDecisionWindows,
} from '../domain/flush-decision';
import {
  CatalogRebuildState,
  FlushClaim,
  FlushFailureResolution,
  FlushSuccessResolution,
  ICatalogRebuildStateStore,
} from '../domain/icatalog-rebuild-state-store';

const COLLECTION = 'catalog_rebuild_state';
const DOC_ID = 'global';

/** The subset of the transaction API the store uses (also satisfied by test fakes). */
interface StateTransaction {
  get(ref: DocumentReference): Promise<{ exists: boolean; data: () => unknown }>;
  set(ref: DocumentReference, data: Record<string, unknown>): unknown;
  delete(ref: DocumentReference): unknown;
}

/**
 * Maps a raw Firestore document to the domain state. Firestore timestamps
 * (with `toDate()`) and plain Dates (tests) are both accepted.
 */
function toState(data: unknown): CatalogRebuildState | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const doc = data as Record<string, unknown>;
  return {
    firstChangeAt: toDate(doc.firstChangeAt),
    lastChangeAt: toDate(doc.lastChangeAt),
    claimedAt: toDate(doc.claimedAt),
    claimId: typeof doc.claimId === 'string' ? doc.claimId : null,
    failureCount: typeof doc.failureCount === 'number' ? doc.failureCount : 0,
    lastFailureAt: toDate(doc.lastFailureAt),
    nextAttemptAt: toDate(doc.nextAttemptAt),
    lastEntityType: toEntityType(doc.lastEntityType),
    lastAction: toAction(doc.lastAction),
  };
}

/** Full-replace document: null/absent fields are simply not written. */
function toDocument(state: CatalogRebuildState): Record<string, unknown> {
  const doc: Record<string, unknown> = {};
  if (state.firstChangeAt) doc.firstChangeAt = state.firstChangeAt;
  if (state.lastChangeAt) doc.lastChangeAt = state.lastChangeAt;
  if (state.claimedAt) doc.claimedAt = state.claimedAt;
  if (state.claimId) doc.claimId = state.claimId;
  doc.failureCount = state.failureCount;
  if (state.lastFailureAt) doc.lastFailureAt = state.lastFailureAt;
  if (state.nextAttemptAt) doc.nextAttemptAt = state.nextAttemptAt;
  if (state.lastEntityType) doc.lastEntityType = state.lastEntityType;
  if (state.lastAction) doc.lastAction = state.lastAction;
  return doc;
}

/** Baseline used to normalize absent documents before merging changes. */
const EMPTY_STATE: CatalogRebuildState = {
  firstChangeAt: null,
  lastChangeAt: null,
  claimedAt: null,
  claimId: null,
  failureCount: 0,
  lastFailureAt: null,
  nextAttemptAt: null,
  lastEntityType: null,
  lastAction: null,
};

function orEmpty(current: CatalogRebuildState | null): CatalogRebuildState {
  return current ?? EMPTY_STATE;
}

/** Opens a batch on clean state; accumulates into it otherwise. */
function mergeRecordedChange(
  current: CatalogRebuildState | null,
  event: CatalogChangeEvent,
): CatalogRebuildState {
  const base = orEmpty(current);
  const occurredAt = new Date(event.occurredAt);
  return {
    ...base,
    firstChangeAt: base.firstChangeAt ?? occurredAt,
    lastChangeAt: occurredAt,
    lastEntityType: event.entityType,
    lastAction: event.action,
  };
}

/** Takes a claim on the current state (keeps every other field). */
function withClaim(
  current: CatalogRebuildState | null,
  now: Date,
  claimId: string,
): CatalogRebuildState {
  return {
    ...orEmpty(current),
    claimedAt: now,
    claimId,
  };
}

/** Whether catalog edits arrived after the claim was taken. */
function hasEditsDuringFlight(state: CatalogRebuildState): boolean {
  return (
    state.claimedAt !== null && state.lastChangeAt !== null && state.lastChangeAt > state.claimedAt
  );
}

/** Residual batch after a successful dispatch: max-wait clock restarts at the claim. */
function resetBatchAfterClaim(state: CatalogRebuildState): CatalogRebuildState {
  return {
    ...state,
    firstChangeAt: state.claimedAt ?? state.firstChangeAt,
    claimedAt: null,
    claimId: null,
  };
}

/** Releases the claim and schedules the bounded retry after a failed dispatch. */
function withFailure(
  state: CatalogRebuildState,
  now: Date,
  failureCount: number,
  nextAttemptAt: Date,
): CatalogRebuildState {
  return {
    ...state,
    claimedAt: null,
    claimId: null,
    failureCount,
    lastFailureAt: now,
    nextAttemptAt,
  };
}

function batchAgeMs(state: CatalogRebuildState, now: Date): number {
  return state.firstChangeAt !== null ? now.getTime() - state.firstChangeAt.getTime() : 0;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return value;
  }
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

function toEntityType(value: unknown): CatalogRebuildState['lastEntityType'] {
  return value === 'category' || value === 'subcategory' || value === 'product'
    ? value
    : null;
}

function toAction(value: unknown): CatalogRebuildState['lastAction'] {
  return value === 'created' ||
    value === 'updated' ||
    value === 'deleted' ||
    value === 'published' ||
    value === 'unpublished'
    ? value
    : null;
}

/**
 * Firestore-backed `ICatalogRebuildStateStore`: the durable rebuild buffer of
 * the scheduled flush (change `catalog-rebuild-flush-scheduler`).
 *
 * A single fixed-id document (`catalog_rebuild_state/global`) accessed via the
 * Admin SDK (bypasses security rules; single-doc transactions need no index).
 * All decision mutations run inside Firestore transactions so concurrent
 * Cloud Run instances serialize: exactly one flush can hold a claim (scenario
 * c) and a crash after the claim is recovered when the claim TTL expires
 * (scenario g). The webhook dispatch itself happens OUTSIDE any transaction —
 * the flush service calls `resolveSuccess`/`resolveFailure` afterwards.
 *
 * Documents are written with full-replace `set` (never field-level deletes):
 * every resolution computes the complete next document, which keeps test fakes
 * and the real store semantics identical.
 */
@Injectable()
export class FirestoreRebuildStateStore implements ICatalogRebuildStateStore {
  constructor(@Inject(FIRESTORE) private readonly firestore: Firestore) {}

  async recordChange(event: CatalogChangeEvent): Promise<void> {
    await this.runInTransaction(async (tx, ref) => {
      const current = await this.readState(tx, ref);
      tx.set(ref, toDocument(mergeRecordedChange(current, event)));
    });
  }

  async claimForDispatch(now: Date, windows: FlushDecisionWindows): Promise<FlushClaim> {
    return this.runInTransaction(async (tx, ref) => {
      const current = await this.readState(tx, ref);
      const decision = decideFlush(current, now, windows);
      if (decision !== 'claim') {
        return { decision };
      }
      const claimId = randomUUID();
      const claimed = withClaim(current, now, claimId);
      tx.set(ref, toDocument(claimed));
      return { decision: 'claim', claimId, state: claimed };
    });
  }

  async resolveSuccess(claimId: string): Promise<FlushSuccessResolution> {
    return this.runInTransaction(async (tx, ref) => {
      const current = await this.readState(tx, ref);
      if (!current) {
        return 'cleared';
      }
      if (current.claimId !== claimId) {
        return 'not_owner';
      }
      if (hasEditsDuringFlight(current)) {
        tx.set(ref, toDocument(resetBatchAfterClaim(current)));
        return 'residual';
      }
      tx.delete(ref);
      return 'cleared';
    });
  }

  async resolveFailure(claimId: string, now: Date): Promise<FlushFailureResolution | null> {
    return this.runInTransaction(async (tx, ref) => {
      const current = await this.readState(tx, ref);
      if (!current || current.claimId !== claimId) {
        return null;
      }
      const failureCount = current.failureCount + 1;
      const nextAttemptAt = new Date(now.getTime() + computeBackoffMs(current.failureCount));
      tx.set(ref, toDocument(withFailure(current, now, failureCount, nextAttemptAt)));
      return { failureCount, nextAttemptAt, batchAgeMs: batchAgeMs(current, now) };
    });
  }

  /** Runs `work` inside a Firestore transaction over the fixed state document. */
  private runInTransaction<T>(
    work: (tx: StateTransaction, ref: DocumentReference) => Promise<T>,
  ): Promise<T> {
    const ref = this.firestore.collection(COLLECTION).doc(DOC_ID);
    return this.firestore.runTransaction(async (tx: Transaction) => work(tx as StateTransaction, ref));
  }

  private async readState(
    tx: StateTransaction,
    ref: DocumentReference,
  ): Promise<CatalogRebuildState | null> {
    const snapshot = await tx.get(ref);
    return snapshot.exists ? toState(snapshot.data()) : null;
  }
}
