/**
 * Scroll-state controller for the compact site header.
 *
 * Pure, dependency-free and SSR-safe: it only reads `window`/`document` when
 * they exist and can be fully driven by injected `host`/`target`/`events`
 * fakes in a Node test environment (no jsdom dependency). The UI reacts to the
 * `data-scrolled` attribute toggled on `document.body` (see header-scroll.css).
 *
 * View-transitions resilience: besides the initial load, the compact state is
 * re-applied on Astro's `astro:page-load` lifecycle event (fired on
 * `document` after every client-side navigation), so it survives the body
 * swaps performed by the global `<ClientRouter />`. The `data-scrolled`
 * target is resolved lazily on every update (the CURRENT `document.body`, not
 * an init-time capture), because View Transitions replace the whole `<body>`
 * element on each navigation and a stale reference would silently break the
 * compact state on the destination page (SC-101/102/103, design D1).
 *
 * Why custom `host`/`target`/`events` seams: keeps `initHeaderScrollState`
 * testable without a DOM and avoids touching `window` during SSG render. The
 * Layout calls it with no arguments, so the browser defaults apply in
 * production.
 */

/** Scroll position (in px) above which the header enters its compact state. */
export const DEFAULT_COMPACT_THRESHOLD = 0;

/** Minimal surface of `window` required to observe scroll and schedule a frame. */
export interface ScrollStateHost {
  scrollY: number;
  addEventListener(
    type: 'scroll',
    listener: () => void,
    options?: AddEventListenerOptions,
  ): void;
  removeEventListener(type: 'scroll', listener: () => void, options?: EventListenerOptions): void;
  requestAnimationFrame(callback: FrameRequestCallback): number;
}

/** Minimal surface of the element that receives the `data-scrolled` attribute. */
export interface ScrollStateTarget {
  setAttribute(name: string, value: string): void;
}

/**
 * Minimal surface of the object that dispatches Astro lifecycle events.
 * Browser default: `document`, where Astro fires `astro:page-load` after every
 * client-side navigation (View Transitions). Injected as a seam in tests.
 */
export interface PageLoadEvents {
  addEventListener(type: 'astro:page-load', listener: () => void): void;
  removeEventListener(type: 'astro:page-load', listener: () => void): void;
}

export interface InitHeaderScrollStateOptions {
  /** Scroll threshold in px. Compact when `scrollY > threshold`. Default 0. */
  threshold?: number;
  /** Scroll host (defaults to `window` in the browser). Injected for tests. */
  host?: ScrollStateHost;
  /** Element that receives `data-scrolled` (defaults to `document.body`). */
  target?: ScrollStateTarget;
  /**
   * Astro lifecycle event source (defaults to `document`, where Astro fires
   * `astro:page-load` after every client-side navigation). Injected for tests.
   */
  events?: PageLoadEvents;
}

/**
 * Decides whether the header should be compact for a given scroll position.
 * Strictly greater than `threshold` so the top (scrollY === 0) is never compact.
 */
export function shouldBeCompact(scrollY: number, threshold: number = DEFAULT_COMPACT_THRESHOLD): boolean {
  return scrollY > threshold;
}

/**
 * Wires a passive, rAF-throttled scroll listener that toggles `data-scrolled`
 * (`"true"`/`"false"`) on the target based on the current scroll position.
 * Additionally re-applies the state on Astro's `astro:page-load` lifecycle
 * event (default source: `document`) so it survives client-side navigations
 * triggered by View Transitions.
 * Returns a cleanup function that detaches both listeners.
 */
export function initHeaderScrollState(options: InitHeaderScrollStateOptions = {}): () => void {
  const threshold = options.threshold ?? DEFAULT_COMPACT_THRESHOLD;

  const host =
    options.host ??
    (typeof window !== 'undefined' ? (window as unknown as ScrollStateHost) : undefined);
  if (!host) {
    throw new Error('initHeaderScrollState: no scroll host available (window is undefined).');
  }

  // Resolve the `data-scrolled` target lazily on every update: an explicit
  // `target` seam (tests) wins, otherwise the CURRENT `document.body` is read
  // at call time. View Transitions swap the whole `<body>` element on each
  // client-side navigation, so an init-time capture goes stale and the compact
  // state would silently die on the destination page (SC-101, SC-102, SC-103
  // — design D1). `document` itself persists across swaps, only its `body`
  // child is replaced, so re-reading `document.body` per update is correct.
  const resolveTarget = (): ScrollStateTarget | undefined =>
    options.target ??
    (typeof document !== 'undefined' ? (document.body as ScrollStateTarget) : undefined);

  // Fail fast on construction when no target is available anywhere, so a
  // misconfigured integration surfaces immediately (same contract as before).
  if (!resolveTarget()) {
    throw new Error('initHeaderScrollState: no scroll target available (document.body is undefined).');
  }

  const events =
    options.events ??
    (typeof document !== 'undefined' ? (document as unknown as PageLoadEvents) : undefined);

  let ticking = false;

  const update = (): void => {
    const target = resolveTarget();
    if (target) {
      const compact = shouldBeCompact(host.scrollY, threshold);
      target.setAttribute('data-scrolled', compact ? 'true' : 'false');
    }
    ticking = false;
  };

  const onScroll = (): void => {
    if (!ticking) {
      ticking = true;
      // Coalesce multiple scroll events into a single style update per frame.
      host.requestAnimationFrame(update);
    }
  };

  // A client-side navigation (View Transitions swap) changes the body content,
  // so the compact state must be recomputed from the current scroll position.
  // Direct (not rAF-throttled): `astro:page-load` fires once per navigation,
  // not in a continuous stream like scroll events.
  const onPageLoad = (): void => update();

  // Apply the initial state without waiting for the first scroll event.
  update();
  host.addEventListener('scroll', onScroll, { passive: true });
  events?.addEventListener('astro:page-load', onPageLoad);

  return () => {
    host.removeEventListener('scroll', onScroll);
    events?.removeEventListener('astro:page-load', onPageLoad);
  };
}
