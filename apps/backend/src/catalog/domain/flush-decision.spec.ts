import {
  computeBackoffMs,
  decideFlush,
  FlushDecisionInput,
  FlushDecisionWindows,
} from './flush-decision';

const WINDOWS: FlushDecisionWindows = {
  silenceMs: 60_000,
  maxWaitMs: 300_000,
  claimTtlMs: 60_000,
};

const NOW = new Date('2026-01-15T12:00:00.000Z');

function buildState(overrides: Partial<FlushDecisionInput>): FlushDecisionInput {
  return {
    firstChangeAt: new Date(NOW.getTime() - 120_000),
    lastChangeAt: new Date(NOW.getTime() - 120_000),
    claimedAt: null,
    nextAttemptAt: null,
    ...overrides,
  };
}

describe('decideFlush', () => {
  describe('no-op decisions (2.1)', () => {
    it('returns no_pending when there is no state', () => {
      expect(decideFlush(null, NOW, WINDOWS)).toBe('no_pending');
    });

    it('returns no_pending when the state has no firstChangeAt', () => {
      const state = buildState({ firstChangeAt: null, lastChangeAt: null });
      expect(decideFlush(state, NOW, WINDOWS)).toBe('no_pending');
    });

    it('returns in_flight when a claim is still valid', () => {
      const state = buildState({
        claimedAt: new Date(NOW.getTime() - 10_000),
      });
      expect(decideFlush(state, NOW, WINDOWS)).toBe('in_flight');
    });

    it('returns in_flight even when the silence window is met (claim wins)', () => {
      const state = buildState({
        lastChangeAt: new Date(NOW.getTime() - 120_000),
        claimedAt: new Date(NOW.getTime() - 10_000),
      });
      expect(decideFlush(state, NOW, WINDOWS)).toBe('in_flight');
    });

    it('returns backoff while nextAttemptAt is in the future', () => {
      const state = buildState({
        lastChangeAt: new Date(NOW.getTime() - 120_000),
        nextAttemptAt: new Date(NOW.getTime() + 30_000),
      });
      expect(decideFlush(state, NOW, WINDOWS)).toBe('backoff');
    });

    it('returns backoff even when the claim is expired but backoff is not', () => {
      const state = buildState({
        claimedAt: new Date(NOW.getTime() - 120_000),
        nextAttemptAt: new Date(NOW.getTime() + 30_000),
      });
      expect(decideFlush(state, NOW, WINDOWS)).toBe('backoff');
    });

    it('returns hold when a batch is pending but neither window is met', () => {
      const state = buildState({
        firstChangeAt: new Date(NOW.getTime() - 30_000),
        lastChangeAt: new Date(NOW.getTime() - 10_000),
      });
      expect(decideFlush(state, NOW, WINDOWS)).toBe('hold');
    });
  });

  describe('dispatch decisions (2.2)', () => {
    it('claims when the silence window is met', () => {
      const state = buildState({
        firstChangeAt: new Date(NOW.getTime() - 130_000),
        lastChangeAt: new Date(NOW.getTime() - 60_000),
      });
      expect(decideFlush(state, NOW, WINDOWS)).toBe('claim');
    });

    it('claims at the exact silence boundary (>= comparison)', () => {
      const state = buildState({
        lastChangeAt: new Date(NOW.getTime() - 60_000),
      });
      expect(decideFlush(state, NOW, WINDOWS)).toBe('claim');
    });

    it('claims when the max-wait is reached even without silence (scenario b)', () => {
      const state = buildState({
        firstChangeAt: new Date(NOW.getTime() - 300_000),
        lastChangeAt: new Date(NOW.getTime() - 10_000),
      });
      expect(decideFlush(state, NOW, WINDOWS)).toBe('claim');
    });

    it('claims at the exact max-wait boundary (>= comparison)', () => {
      const state = buildState({
        firstChangeAt: new Date(NOW.getTime() - 300_000),
        lastChangeAt: new Date(NOW.getTime()),
      });
      expect(decideFlush(state, NOW, WINDOWS)).toBe('claim');
    });
  });

  describe('expired claim reclaim (2.3 / scenario g)', () => {
    it('reclaims an expired claim when the silence window is met', () => {
      const state = buildState({
        claimedAt: new Date(NOW.getTime() - 61_000),
      });
      expect(decideFlush(state, NOW, WINDOWS)).toBe('claim');
    });

    it('reclaims an expired claim when the max-wait is met', () => {
      const state = buildState({
        firstChangeAt: new Date(NOW.getTime() - 300_000),
        lastChangeAt: new Date(NOW.getTime() - 5_000),
        claimedAt: new Date(NOW.getTime() - 61_000),
      });
      expect(decideFlush(state, NOW, WINDOWS)).toBe('claim');
    });

    it('holds on an expired claim when no dispatch condition is met', () => {
      const state = buildState({
        firstChangeAt: new Date(NOW.getTime() - 30_000),
        lastChangeAt: new Date(NOW.getTime() - 10_000),
        claimedAt: new Date(NOW.getTime() - 61_000),
      });
      expect(decideFlush(state, NOW, WINDOWS)).toBe('hold');
    });
  });
});

describe('computeBackoffMs', () => {
  it('starts at 60s for the first failure', () => {
    expect(computeBackoffMs(0)).toBe(60_000);
  });

  it('doubles per prior failure', () => {
    expect(computeBackoffMs(1)).toBe(120_000);
    expect(computeBackoffMs(2)).toBe(240_000);
    expect(computeBackoffMs(3)).toBe(480_000);
  });

  it('caps at 15 minutes without a permanent dead-letter', () => {
    expect(computeBackoffMs(4)).toBe(900_000);
    expect(computeBackoffMs(10)).toBe(900_000);
    expect(computeBackoffMs(100)).toBe(900_000);
  });
});
