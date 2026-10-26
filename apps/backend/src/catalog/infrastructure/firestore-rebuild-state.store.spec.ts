import { FirestoreRebuildStateStore } from './firestore-rebuild-state.store';
import { FlushDecisionWindows } from '../domain/flush-decision';

const WINDOWS: FlushDecisionWindows = {
  silenceMs: 60_000,
  maxWaitMs: 300_000,
  claimTtlMs: 60_000,
};

const NOW = new Date('2026-01-15T12:00:00.000Z');
const EVENT = {
  entityType: 'product' as const,
  id: 'p1',
  action: 'updated' as const,
  occurredAt: new Date(NOW.getTime() - 120_000).toISOString(),
};

// ---------------------------------------------------------------------------
// Minimal transactional fake of the Firestore surface the store uses:
// firestore.runTransaction(fn) with tx.get(ref) / tx.set(ref, data) / tx.delete(ref).
// Transactions are serialized with an async mutex, mirroring Firestore's
// serializable single-document semantics (spec scenario c).
// ---------------------------------------------------------------------------

interface FakeDocData {
  [field: string]: unknown;
}

class FakeTransaction {
  readonly ops: Array<{ type: 'set' | 'delete'; path: string; data?: FakeDocData }> = [];

  constructor(private readonly db: FakeFirestore) {}

  async get(ref: { path: string }): Promise<{ exists: boolean; data: () => FakeDocData | undefined }> {
    const data = this.db.docs.get(ref.path);
    return { exists: data !== undefined, data: () => data };
  }

  set(ref: { path: string }, data: FakeDocData): void {
    this.ops.push({ type: 'set', path: ref.path, data });
  }

  delete(ref: { path: string }): void {
    this.ops.push({ type: 'delete', path: ref.path });
  }
}

class FakeFirestore {
  readonly docs = new Map<string, FakeDocData>();
  private tail: Promise<unknown> = Promise.resolve();

  collection(name: string): { doc: (id: string) => { path: string } } {
    return { doc: (id: string) => ({ path: `${name}/${id}` }) };
  }

  runTransaction<T>(fn: (tx: FakeTransaction) => Promise<T>): Promise<T> {
    // Serializable execution: each transaction runs to completion (read →
    // decide → buffered ops → commit) before the next one starts.
    const run = this.tail.then(async () => {
      const tx = new FakeTransaction(this);
      const result = await fn(tx);
      for (const op of tx.ops) {
        if (op.type === 'set') {
          this.docs.set(op.path, op.data as FakeDocData);
        } else {
          this.docs.delete(op.path);
        }
      }
      return result;
    });
    this.tail = run.catch(() => undefined);
    return run;
  }
}

const DOC_PATH = 'catalog_rebuild_state/global';

function seedDoc(data: FakeDocData): FakeFirestore {
  const db = new FakeFirestore();
  db.docs.set(DOC_PATH, data);
  return db;
}

function createStore(db: FakeFirestore): FirestoreRebuildStateStore {
  return new FirestoreRebuildStateStore(db as never);
}

describe('FirestoreRebuildStateStore.recordChange', () => {
  it('opens a batch on clean state: sets firstChangeAt, lastChangeAt and the last event (3.2)', async () => {
    const db = new FakeFirestore();
    const store = createStore(db);

    await store.recordChange(EVENT);

    const doc = db.docs.get(DOC_PATH);
    const occurredAt = new Date(EVENT.occurredAt);
    expect(doc).toMatchObject({
      firstChangeAt: occurredAt,
      lastChangeAt: occurredAt,
      lastEntityType: 'product',
      lastAction: 'updated',
    });
    expect(doc?.claimedAt).toBeUndefined();
    expect(doc?.nextAttemptAt).toBeUndefined();
  });

  it('accumulates edits into the same batch without touching firstChangeAt, claim or backoff (3.2)', async () => {
    const firstChangeAt = new Date(NOW.getTime() - 300_000);
    const claimedAt = new Date(NOW.getTime() - 20_000);
    const nextAttemptAt = new Date(NOW.getTime() + 60_000);
    const db = seedDoc({
      firstChangeAt,
      lastChangeAt: new Date(NOW.getTime() - 200_000),
      claimedAt,
      claimId: 'claim-1',
      failureCount: 2,
      lastFailureAt: new Date(NOW.getTime() - 30_000),
      nextAttemptAt,
      lastEntityType: 'category',
      lastAction: 'created',
    });
    const store = createStore(db);

    await store.recordChange({
      entityType: 'product',
      id: 'p2',
      action: 'published',
      occurredAt: new Date(NOW.getTime() - 5_000).toISOString(),
    });

    const doc = db.docs.get(DOC_PATH);
    expect(doc?.firstChangeAt).toEqual(firstChangeAt);
    expect(doc?.lastChangeAt).toEqual(new Date(NOW.getTime() - 5_000));
    expect(doc?.lastEntityType).toBe('product');
    expect(doc?.lastAction).toBe('published');
    expect(doc?.claimedAt).toEqual(claimedAt);
    expect(doc?.claimId).toBe('claim-1');
    expect(doc?.nextAttemptAt).toEqual(nextAttemptAt);
    expect(doc?.failureCount).toBe(2);
  });
});

describe('FirestoreRebuildStateStore.claimForDispatch', () => {
  it('serializes concurrent claims: exactly one dispatch claim (scenario c, 3.3)', async () => {
    const db = seedDoc({
      firstChangeAt: new Date(NOW.getTime() - 300_000),
      lastChangeAt: new Date(NOW.getTime() - 120_000),
      failureCount: 0,
    });
    const store = createStore(db);

    const [first, second] = await Promise.all([
      store.claimForDispatch(NOW, WINDOWS),
      store.claimForDispatch(NOW, WINDOWS),
    ]);

    const claims = [first, second].filter(
      (claim): claim is Extract<typeof claim, { decision: 'claim' }> =>
        claim.decision === 'claim',
    );
    expect(claims).toHaveLength(1);
    const claimed = claims[0];
    const doc = db.docs.get(DOC_PATH);
    expect(doc?.claimId).toBe(claimed.claimId);
    expect(doc?.claimedAt).toEqual(NOW);
    expect([first.decision, second.decision]).toContain('in_flight');
  });

  it('returns the claimed state so the caller can log and build the payload', async () => {
    const firstChangeAt = new Date(NOW.getTime() - 130_000);
    const lastChangeAt = new Date(NOW.getTime() - 60_000);
    const db = seedDoc({
      firstChangeAt,
      lastChangeAt,
      failureCount: 0,
      lastEntityType: 'product',
      lastAction: 'updated',
    });
    const store = createStore(db);

    const claim = await store.claimForDispatch(NOW, WINDOWS);

    if (claim.decision !== 'claim') {
      throw new Error(`expected claim, got ${claim.decision}`);
    }
    expect(claim.state.firstChangeAt).toEqual(firstChangeAt);
    expect(claim.state.lastChangeAt).toEqual(lastChangeAt);
    expect(claim.state.lastEntityType).toBe('product');
    expect(claim.state.lastAction).toBe('updated');
  });

  it('returns no_pending without touching Firestore when there is no batch', async () => {
    const db = new FakeFirestore();
    const store = createStore(db);

    const claim = await store.claimForDispatch(NOW, WINDOWS);

    expect(claim).toEqual({ decision: 'no_pending' });
  });
});

describe('FirestoreRebuildStateStore.resolveSuccess', () => {
  it('clears the document when no edits arrived during the flight (3.4)', async () => {
    const db = seedDoc({
      firstChangeAt: new Date(NOW.getTime() - 130_000),
      lastChangeAt: new Date(NOW.getTime() - 120_000),
      claimedAt: NOW,
      claimId: 'claim-1',
      failureCount: 0,
    });
    const store = createStore(db);

    const resolution = await store.resolveSuccess('claim-1');

    expect(resolution).toBe('cleared');
    expect(db.docs.has(DOC_PATH)).toBe(false);
  });

  it('keeps a residual batch with firstChangeAt = claimedAt when edits arrived during the flight (3.4)', async () => {
    const db = seedDoc({
      firstChangeAt: new Date(NOW.getTime() - 130_000),
      lastChangeAt: new Date(NOW.getTime() - 10_000),
      claimedAt: new Date(NOW.getTime() - 30_000),
      claimId: 'claim-1',
      failureCount: 0,
    });
    const store = createStore(db);

    const resolution = await store.resolveSuccess('claim-1');

    expect(resolution).toBe('residual');
    const doc = db.docs.get(DOC_PATH);
    expect(doc?.firstChangeAt).toEqual(new Date(NOW.getTime() - 30_000));
    expect(doc?.lastChangeAt).toEqual(new Date(NOW.getTime() - 10_000));
    expect(doc?.claimedAt).toBeUndefined();
    expect(doc?.claimId).toBeUndefined();
  });

  it('leaves the document untouched when the claim is not ours', async () => {
    const original = {
      firstChangeAt: new Date(NOW.getTime() - 130_000),
      lastChangeAt: new Date(NOW.getTime() - 120_000),
      claimedAt: NOW,
      claimId: 'claim-2',
      failureCount: 0,
    };
    const db = seedDoc({ ...original });
    const store = createStore(db);

    const resolution = await store.resolveSuccess('claim-1');

    expect(resolution).toBe('not_owner');
    expect(db.docs.get(DOC_PATH)).toEqual(original);
  });
});

describe('FirestoreRebuildStateStore.resolveFailure', () => {
  it('keeps the batch, releases the claim and schedules bounded backoff (scenarios d/h, 3.5)', async () => {
    const firstChangeAt = new Date(NOW.getTime() - 300_000);
    const lastChangeAt = new Date(NOW.getTime() - 15_000);
    const db = seedDoc({
      firstChangeAt,
      lastChangeAt,
      claimedAt: new Date(NOW.getTime() - 30_000),
      claimId: 'claim-1',
      failureCount: 0,
      lastEntityType: 'product',
      lastAction: 'updated',
    });
    const store = createStore(db);

    const resolution = await store.resolveFailure('claim-1', NOW);

    expect(resolution).not.toBeNull();
    expect(resolution?.failureCount).toBe(1);
    expect(resolution?.nextAttemptAt).toEqual(new Date(NOW.getTime() + 60_000));
    expect(resolution?.batchAgeMs).toBe(300_000);

    const doc = db.docs.get(DOC_PATH);
    expect(doc?.firstChangeAt).toEqual(firstChangeAt);
    expect(doc?.lastChangeAt).toEqual(lastChangeAt);
    expect(doc?.claimedAt).toBeUndefined();
    expect(doc?.claimId).toBeUndefined();
    expect(doc?.failureCount).toBe(1);
    expect(doc?.lastFailureAt).toEqual(NOW);
    expect(doc?.nextAttemptAt).toEqual(new Date(NOW.getTime() + 60_000));
  });

  it('applies the backoff cap on repeated failures', async () => {
    const db = seedDoc({
      firstChangeAt: new Date(NOW.getTime() - 900_000),
      lastChangeAt: new Date(NOW.getTime() - 60_000),
      claimedAt: new Date(NOW.getTime() - 30_000),
      claimId: 'claim-1',
      failureCount: 4,
      lastFailureAt: new Date(NOW.getTime() - 120_000),
      nextAttemptAt: new Date(NOW.getTime() - 10_000),
    });
    const store = createStore(db);

    const resolution = await store.resolveFailure('claim-1', NOW);

    expect(resolution?.failureCount).toBe(5);
    expect(resolution?.nextAttemptAt).toEqual(new Date(NOW.getTime() + 900_000));
  });

  it('returns null and leaves the document untouched when the claim is not ours', async () => {
    const original = {
      firstChangeAt: new Date(NOW.getTime() - 300_000),
      lastChangeAt: new Date(NOW.getTime() - 120_000),
      claimedAt: NOW,
      claimId: 'claim-2',
      failureCount: 0,
    };
    const db = seedDoc({ ...original });
    const store = createStore(db);

    const resolution = await store.resolveFailure('claim-1', NOW);

    expect(resolution).toBeNull();
    expect(db.docs.get(DOC_PATH)).toEqual(original);
  });
});
