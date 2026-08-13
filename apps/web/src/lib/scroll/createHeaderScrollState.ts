/**
 * Scroll-state controller for the compact site header.
 *
 * Pure, dependency-free and SSR-safe: it only reads `window`/`document` when
 * they exist and can be fully driven by injected `host`/`target` fakes in a
 * Node test environment (no jsdom dependency). The UI reacts to the
 * `data-scrolled` attribute toggled on `document.body` (see header-scroll.css).
 *
 * Why a custom `host`/`target` seam: keeps `initHeaderScrollState` testable
 * without a DOM and avoids touching `window` during SSG render. The Layout
 * calls it with no arguments, so the browser defaults apply in production.
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

export interface InitHeaderScrollStateOptions {
  /** Scroll threshold in px. Compact when `scrollY > threshold`. Default 0. */
  threshold?: number;
  /** Scroll host (defaults to `window` in the browser). Injected for tests. */
  host?: ScrollStateHost;
  /** Element that receives `data-scrolled` (defaults to `document.body`). */
  target?: ScrollStateTarget;
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
 * Returns a cleanup function that detaches the listener.
 */
export function initHeaderScrollState(options: InitHeaderScrollStateOptions = {}): () => void {
  const threshold = options.threshold ?? DEFAULT_COMPACT_THRESHOLD;

  const host =
    options.host ??
    (typeof window !== 'undefined' ? (window as unknown as ScrollStateHost) : undefined);
  if (!host) {
    throw new Error('initHeaderScrollState: no scroll host available (window is undefined).');
  }

  const target =
    options.target ??
    (typeof document !== 'undefined' ? (document.body as ScrollStateTarget) : undefined);
  if (!target) {
    throw new Error('initHeaderScrollState: no scroll target available (document.body is undefined).');
  }

  let ticking = false;

  const update = (): void => {
    const compact = shouldBeCompact(host.scrollY, threshold);
    target.setAttribute('data-scrolled', compact ? 'true' : 'false');
    ticking = false;
  };

  const onScroll = (): void => {
    if (!ticking) {
      ticking = true;
      // Coalesce multiple scroll events into a single style update per frame.
      host.requestAnimationFrame(update);
    }
  };

  // Apply the initial state without waiting for the first scroll event.
  update();
  host.addEventListener('scroll', onScroll, { passive: true });

  return () => host.removeEventListener('scroll', onScroll);
}
