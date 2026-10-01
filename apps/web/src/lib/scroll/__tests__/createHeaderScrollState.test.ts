import { describe, it, expect } from 'vitest';
import {
  shouldBeCompact,
  initHeaderScrollState,
  DEFAULT_COMPACT_THRESHOLD,
  type InitHeaderScrollStateOptions,
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

// --- astro:page-load re-initialization (view-transitions spec) ---

/** Minimal surface of the object that dispatches Astro lifecycle events
 * (browser default: `document`; Astro fires `astro:page-load` on the document
 * after every client-side navigation). Contract for task 5.2: the lib will
 * accept this `events` seam so the re-init is testable without a DOM. */
interface PageLoadEvents {
  addEventListener(type: 'astro:page-load', listener: () => void): void;
  removeEventListener(type: 'astro:page-load', listener: () => void): void;
}

function createFakeEvents(): PageLoadEvents & {
  listenerTypes: () => string[];
  dispatch: () => void;
} {
  const listeners = new Set<() => void>();
  const types: string[] = [];
  return {
    addEventListener(type: 'astro:page-load', listener: () => void) {
      types.push(type);
      listeners.add(listener);
    },
    removeEventListener(_type: 'astro:page-load', listener: () => void) {
      listeners.delete(listener);
    },
    listenerTypes: () => [...types],
    dispatch: () => {
      listeners.forEach((listener) => listener());
    },
  };
}

describe('initHeaderScrollState — astro:page-load re-initialization (view-transitions)', () => {
  it('subscribes to astro:page-load and re-applies the compact state on dispatch', () => {
    const host = createFakeHost(0);
    const target = createTargetMock();
    const events = createFakeEvents();
    // `events` becomes part of InitHeaderScrollStateOptions in task 5.2
    // (browser default `document`); the intersection keeps this test fully
    // typed until the option lands in the lib.
    const options: InitHeaderScrollStateOptions & { events: PageLoadEvents } = {
      host,
      target,
      events,
    };

    const cleanup = initHeaderScrollState(options);

    // The initial page load applies the state immediately…
    expect(target.attrs['data-scrolled']).toBe('false');
    // …and the function also subscribes to Astro's client-side navigation
    // lifecycle event (the Layout <script> does not re-run after a swap).
    expect(events.listenerTypes()).toContain('astro:page-load');

    // A client-side navigation (View Transitions swap) re-fires the event;
    // the compact state must be re-applied from the current scroll position.
    host.setScrollY(400);
    events.dispatch();
    expect(target.attrs['data-scrolled']).toBe('true');

    // Cleanup detaches the lifecycle listener as well.
    cleanup();
    host.setScrollY(0);
    events.dispatch();
    expect(target.attrs['data-scrolled']).toBe('true');
  });
});
