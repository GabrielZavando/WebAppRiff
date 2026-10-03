/**
 * Scroll-to-top click delegation for the site footer button.
 *
 * Pure, dependency-free and SSR-safe: it only reads `window`/`document` when
 * they exist and can be fully driven by injected `host`/`target` fakes in a
 * Node test environment (no jsdom dependency).
 *
 * View-transitions resilience: the click listener is attached ONCE to the
 * `document` object (the `target` seam), which — unlike `document.body` —
 * persists across the `<body>` swaps performed by Astro's `<ClientRouter />`.
 * Clicks on the post-navigation button (a brand-new element in the swapped
 * body) are still caught by the same listener, so no re-binding on
 * `astro:page-load` is needed (SC-104, SC-105, SC-106 — design D2).
 *
 * Why custom `host`/`target` seams: keeps `initScrollTopButton` testable
 * without a DOM and avoids touching `window` during SSG render. The Layout
 * calls it with no arguments, so the browser defaults apply in production.
 */

/** Options accepted by `window.scrollTo` for a smooth jump to the top. */
export interface ScrollToOptions {
  top: number;
  behavior: 'auto' | 'smooth';
}

/** Minimal surface of `window` required to scroll. */
export interface ScrollTopHost {
  scrollTo(options: ScrollToOptions): void;
}

/** Minimal surface of a click event: the element the click landed on. */
export interface ScrollTopClickEvent {
  readonly target: unknown;
}

/**
 * Minimal surface of the object that receives the click listener.
 * Browser default: `document`, where the delegation persists across View
 * Transitions body swaps. Injected as a seam in tests.
 */
export interface ScrollTopEventTarget {
  addEventListener(type: 'click', listener: (event: ScrollTopClickEvent) => void): void;
  removeEventListener(type: 'click', listener: (event: ScrollTopClickEvent) => void): void;
}

export interface ScrollTopButtonOptions {
  /** Scroll host (defaults to `window` in the browser). Injected for tests. */
  host?: ScrollTopHost;
  /**
   * Event target that receives the click listener (defaults to `document` in
   * the browser). Injected for tests.
   */
  target?: ScrollTopEventTarget;
}

/** The attribute that marks a scroll-to-top trigger (see Footer.astro). */
export const SCROLL_TOP_SELECTOR = '[data-scroll-top]';

/** Minimal surface of a DOM element supporting `closest`. */
interface ElementLike {
  closest(selector: string): ElementLike | null;
}

function isElementLike(value: unknown): value is ElementLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ElementLike).closest === 'function'
  );
}

/**
 * Attaches one persistent click listener on the event target (`document` by
 * default) that delegates clicks to the nearest `[data-scroll-top]` element,
 * scrolling the window to the top with `behavior: 'smooth'`. Because the
 * listener lives on `document` (never swapped by View Transitions), it keeps
 * working after every client-side navigation without re-binding.
 * Returns a cleanup function that detaches the listener.
 */
export function initScrollTopButton(options: ScrollTopButtonOptions = {}): () => void {
  const host =
    options.host ??
    (typeof window !== 'undefined' ? (window as unknown as ScrollTopHost) : undefined);
  if (!host) {
    throw new Error('initScrollTopButton: no scroll host available (window is undefined).');
  }

  const target =
    options.target ??
    (typeof document !== 'undefined' ? (document as unknown as ScrollTopEventTarget) : undefined);
  if (!target) {
    throw new Error('initScrollTopButton: no event target available (document is undefined).');
  }

  const onClick = (event: ScrollTopClickEvent): void => {
    // The click may land on the button itself or on a descendant (e.g. the
    // lucide arrow-up `<svg>`); `closest` resolves the `data-scroll-top`
    // ancestor in both cases.
    const element = event.target;
    if (isElementLike(element) && element.closest(SCROLL_TOP_SELECTOR)) {
      host.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  target.addEventListener('click', onClick);

  return () => {
    target.removeEventListener('click', onClick);
  };
}