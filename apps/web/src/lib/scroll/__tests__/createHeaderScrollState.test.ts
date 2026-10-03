import { describe, it, expect, vi } from 'vitest';
import {
  shouldBeCompact,
  initHeaderScrollState,
  DEFAULT_COMPACT_THRESHOLD,
  type InitHeaderScrollStateOptions,
  type ScrollStateTarget,
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

// --- body swap across View Transitions (SC-101, SC-102, SC-103 — design D1) ---

/**
 * Minimal fake of the global `document` whose `body` can be swapped, mimicking
 * how Astro's View Transitions (`<ClientRouter />`) replaces the whole `<body>`
 * element on every client-side navigation (the `document` object persists, the
 * body element does not). Used through `vi.stubGlobal` so the production
 * default path (`document.body`) is exercised in the `node` environment
 * (no jsdom), keeping this file's pure-fake style.
 *
 * Design D1: the lib must resolve the `data-scrolled` target lazily at each
 * update; capturing `document.body` once at init is the bug these tests pin
 * (task 1.1 RED, fixed in task 1.2).
 */
interface FakeSwappableDocument {
  readonly body: ScrollStateTarget;
}

function createFakeSwappableDocument(
  initialBody: ScrollStateTarget,
): FakeSwappableDocument & { swapBody(nextBody: ScrollStateTarget): void } {
  let currentBody: ScrollStateTarget = initialBody;
  return {
    get body(): ScrollStateTarget {
      return currentBody;
    },
    swapBody(nextBody: ScrollStateTarget): void {
      currentBody = nextBody;
    },
  };
}

describe('initHeaderScrollState — body swap across View Transitions (lazy target, D1)', () => {
  it('[SC-101] sets data-scrolled="true" on the current body — not the init-time one — when scrolled after a <body> swap', () => {
    const host = createFakeHost(0);
    const events = createFakeEvents();
    // `targetA` is the body present at init (resolved via the production
    // default `document.body`, no explicit `target` seam); `targetB` replaces
    // it, exactly as View Transitions swaps `<body>` on every client-side
    // navigation.
    const targetA = createTargetMock();
    const targetB = createTargetMock();
    const fakeDocument = createFakeSwappableDocument(targetA);
    vi.stubGlobal('document', fakeDocument);

    try {
      initHeaderScrollState({ host, events });

      // Initial state lands on the body present at init.
      expect(targetA.attrs['data-scrolled']).toBe('false');
      expect(targetB.attrs['data-scrolled']).toBeUndefined();

      // View Transitions swap: the effective target becomes `targetB`.
      fakeDocument.swapBody(targetB);

      // GIVEN the post-swap page, WHEN the user scrolls past the threshold…
      host.setScrollY(400);
      host.dispatchScroll();
      // …THEN `data-scrolled` lands on the CURRENT body (`targetB`)…
      expect(targetB.attrs['data-scrolled']).toBe('true');
      // …and the stale pre-navigation body is never written again.
      expect(targetA.attrs['data-scrolled']).toBe('false');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('[SC-102] re-applies the shrink/grow cycle (true→false) to the current body after a <body> swap', () => {
    const host = createFakeHost(0);
    const events = createFakeEvents();
    const targetA = createTargetMock();
    const targetB = createTargetMock();
    const fakeDocument = createFakeSwappableDocument(targetA);
    vi.stubGlobal('document', fakeDocument);

    try {
      initHeaderScrollState({ host, events });

      // View Transitions swap before any user interaction.
      fakeDocument.swapBody(targetB);

      // WHEN the user scrolls down and then returns to `scrollY === 0`…
      host.setScrollY(400);
      host.dispatchScroll();
      host.setScrollY(0);
      host.dispatchScroll();
      // …THEN the compact-state driver on the CURRENT body (`targetB`)
      // completes the shrink ("true") and grow-back ("false") cycle, so the
      // logo shrink/grow survives the client-side navigation.
      expect(targetB.attrs['data-scrolled']).toBe('false');
      // The stale pre-swap body never receives an update.
      expect(targetA.attrs['data-scrolled']).toBe('false');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('[SC-103] re-applies the compact state to the current body on astro:page-load after a <body> swap', () => {
    const host = createFakeHost(0);
    const events = createFakeEvents();
    const targetA = createTargetMock();
    const targetB = createTargetMock();
    const fakeDocument = createFakeSwappableDocument(targetA);
    vi.stubGlobal('document', fakeDocument);

    try {
      initHeaderScrollState({ host, events });

      // Client-side navigation: View Transitions swap `<body>` and Astro fires
      // `astro:page-load` on `document` afterwards. The Layout `<script>` does
      // not re-run after a swap, so the lifecycle event must write the state
      // to the post-swap body.
      fakeDocument.swapBody(targetB);

      // GIVEN the post-swap page at scrollY 400, WHEN `astro:page-load` fires…
      host.setScrollY(400);
      events.dispatch();
      // …THEN the compact state is re-applied to the CURRENT body (`targetB`).
      expect(targetB.attrs['data-scrolled']).toBe('true');
      // The stale pre-navigation body is never written again.
      expect(targetA.attrs['data-scrolled']).toBe('false');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
