import { describe, it, expect } from 'vitest';
import {
  shouldBeCompact,
  initHeaderScrollState,
  DEFAULT_COMPACT_THRESHOLD,
} from '@/lib/scroll/createHeaderScrollState';

describe('shouldBeCompact', () => {
  it('returns false at the top (scrollY === 0)', () => {
    expect(shouldBeCompact(0)).toBe(false);
    expect(shouldBeCompact(0, 0)).toBe(false);
  });

  it('returns true once scrolled past the top', () => {
    expect(shouldBeCompact(1)).toBe(true);
    expect(shouldBeCompact(400)).toBe(true);
  });

  it('respects a custom threshold', () => {
    expect(shouldBeCompact(3, 4)).toBe(false);
    expect(shouldBeCompact(4, 4)).toBe(false); // strictly greater than threshold
    expect(shouldBeCompact(5, 4)).toBe(true);
  });

  it('exposes the default threshold constant (0)', () => {
    expect(DEFAULT_COMPACT_THRESHOLD).toBe(0);
  });
});

// Minimal host/target fakes so the wiring test runs under Vitest's `node`
// environment (no jsdom dependency). rAF runs the callback synchronously for
// deterministic assertions.
function createFakeHost(initialScrollY = 0) {
  let scrollY = initialScrollY;
  const listeners = new Set<() => void>();
  let rafId = 0;
  return {
    get scrollY() {
      return scrollY;
    },
    setScrollY(value: number) {
      scrollY = value;
    },
    addEventListener(_type: 'scroll', cb: () => void) {
      listeners.add(cb);
    },
    removeEventListener(_type: 'scroll', cb: () => void) {
      listeners.delete(cb);
    },
    requestAnimationFrame(cb: FrameRequestCallback) {
      rafId += 1;
      cb(rafId);
      return rafId;
    },
    dispatchScroll() {
      listeners.forEach((cb) => cb());
    },
  };
}

function createTargetMock() {
  const attrs: Record<string, string> = {};
  return {
    attrs,
    setAttribute(name: string, value: string) {
      attrs[name] = value;
    },
  };
}

describe('initHeaderScrollState', () => {
  it('sets data-scrolled="false" initially at the top and "true" when scrolled', () => {
    const host = createFakeHost(0);
    const target = createTargetMock();

    const cleanup = initHeaderScrollState({ host, target });

    // Initial state (update() ran with scrollY 0)
    expect(target.attrs['data-scrolled']).toBe('false');

    // Scroll down past the top
    host.setScrollY(400);
    host.dispatchScroll();
    expect(target.attrs['data-scrolled']).toBe('true');

    // Scroll back to the top -> reverts
    host.setScrollY(0);
    host.dispatchScroll();
    expect(target.attrs['data-scrolled']).toBe('false');

    // Cleanup removes the listener (no further updates)
    cleanup();
    host.setScrollY(800);
    host.dispatchScroll();
    expect(target.attrs['data-scrolled']).toBe('false');
  });

  it('reflects a custom threshold', () => {
    const host = createFakeHost(2);
    const target = createTargetMock();

    initHeaderScrollState({ host, target, threshold: 4 });

    // scrollY 2 < threshold 4 -> not compact
    expect(target.attrs['data-scrolled']).toBe('false');

    host.setScrollY(5);
    host.dispatchScroll();
    expect(target.attrs['data-scrolled']).toBe('true');
  });
});
