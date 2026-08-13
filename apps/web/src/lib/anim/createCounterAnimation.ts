/**
 * Counter animation for the PanelHome stats strip.
 *
 * Each stat counts up from 0 to its target exactly once, the first time the
 * strip scrolls into view. The count-up is skipped under prefers-reduced-motion,
 * leaving the server-rendered text untouched.
 *
 * All browser-only surfaces (requestAnimationFrame, cancelAnimationFrame,
 * IntersectionObserver, matchMedia) are injected so the pure logic can be unit
 * tested under Vitest's node environment. Mirrors lib/scroll/createHeaderScrollState.ts.
 */

export const STAT_SUFFIX = '+';

const esNumberFormatter = new Intl.NumberFormat('es-ES');

export function formatStatNumber(n: number): string {
  return esNumberFormatter.format(n) + STAT_SUFFIX;
}

export type Raf = (cb: FrameRequestCallback) => number;
export type CancelRaf = (id: number) => void;

export interface VisibilityObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * Observe `target` and fire `onIntersect` once, the first time it becomes
 * visible. After firing, the observer disconnects itself so the animation is
 * never replayed.
 */
export function createVisibilityObserver(
  onIntersect: (disconnect: () => void) => void,
  ObserverCtor: typeof IntersectionObserver,
  options: VisibilityObserverOptions = {},
): IntersectionObserver {
  let fired = false;
  const observer = new ObserverCtor(
    (entries) => {
      if (fired) return;
      const isVisible = entries.some((entry) => entry.isIntersecting);
      if (!isVisible) return;
      fired = true;
      onIntersect(() => observer.disconnect());
    },
    {
      root: options.root ?? null,
      rootMargin: options.rootMargin ?? '0px',
      threshold: options.threshold ?? 0.25,
    },
  );
  return observer;
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * Animate `el.textContent` from `from` to `to` over `durationMs`, formatting
 * each frame with `format`. Returns a cleanup that cancels the in-flight frame.
 */
export function animateCounter(
  el: HTMLElement,
  from: number,
  to: number,
  durationMs: number,
  format: (n: number) => string,
  raf: Raf,
  cancelRaf: CancelRaf,
): () => void {
  if (to === from) {
    el.textContent = format(to);
    return () => {};
  }

  let rafId = 0;
  let startTime = 0;

  const step = (now: number): void => {
    if (startTime === 0) startTime = now;
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    const eased = easeOutCubic(progress);
    const current = Math.round(from + (to - from) * eased);
    el.textContent = format(current);
    if (progress < 1) {
      rafId = raf(step);
    }
  };

  rafId = raf(step);
  return () => cancelRaf(rafId);
}

export interface CounterAnimationOptions {
  elements?: HTMLElement[];
  raf?: Raf;
  cancelRaf?: CancelRaf;
  matchMedia?: (query: string) => MediaQueryList;
  IntersectionObserver?: typeof IntersectionObserver;
  durationMs?: number;
  formatNumber?: (n: number) => string;
}

interface ResolvedCounterSurface {
  raf: Raf;
  cancelRaf: CancelRaf;
  ObserverCtor: typeof IntersectionObserver;
  matchMedia?: (query: string) => MediaQueryList;
  durationMs: number;
  formatNumber: (n: number) => string;
  elements: HTMLElement[];
}

function getGlobalRaf(): Raf | undefined {
  return typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame
    : undefined;
}

function getGlobalCancelRaf(): CancelRaf | undefined {
  return typeof cancelAnimationFrame !== 'undefined'
    ? cancelAnimationFrame
    : undefined;
}

function getGlobalIntersectionObserver(): typeof IntersectionObserver | undefined {
  return typeof globalThis !== 'undefined'
    ? (globalThis as { IntersectionObserver?: typeof IntersectionObserver })
        .IntersectionObserver
    : undefined;
}

function getGlobalMatchMedia(): ((query: string) => MediaQueryList) | undefined {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia.bind(window)
    : undefined;
}

function prefersReducedMotion(
  matchMedia: (query: string) => MediaQueryList,
): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Merge injected browser surfaces with their global fallbacks. */
function resolveCounterDefaults(
  options: CounterAnimationOptions,
): {
  raf?: Raf;
  cancelRaf?: CancelRaf;
  ObserverCtor?: typeof IntersectionObserver;
  matchMedia?: (query: string) => MediaQueryList;
  durationMs: number;
  formatNumber: (n: number) => string;
} {
  return {
    raf: options.raf ?? getGlobalRaf(),
    cancelRaf: options.cancelRaf ?? getGlobalCancelRaf(),
    ObserverCtor: options.IntersectionObserver ?? getGlobalIntersectionObserver(),
    matchMedia: options.matchMedia ?? getGlobalMatchMedia(),
    durationMs: options.durationMs ?? 1200,
    formatNumber: options.formatNumber ?? formatStatNumber,
  };
}

/** Resolve and validate surfaces + elements, or null if anything is missing. */
function resolveCounterSurface(
  options: CounterAnimationOptions,
): ResolvedCounterSurface | null {
  const defaults = resolveCounterDefaults(options);
  const elements = options.elements ?? [];
  if (
    !defaults.raf ||
    !defaults.cancelRaf ||
    !defaults.ObserverCtor ||
    elements.length === 0
  ) {
    return null;
  }
  return {
    raf: defaults.raf,
    cancelRaf: defaults.cancelRaf,
    ObserverCtor: defaults.ObserverCtor,
    matchMedia: defaults.matchMedia,
    durationMs: defaults.durationMs,
    formatNumber: defaults.formatNumber,
    elements,
  };
}

/**
 * Wire up the one-shot counter animation for every element carrying a
 * `data-target`. SSR-safe: returns a no-op if any browser primitive is missing.
 */
export function initCounterAnimation(
  options: CounterAnimationOptions = {},
): () => void {
  const surface = resolveCounterSurface(options);
  if (!surface) {
    return () => {};
  }

  if (surface.matchMedia && prefersReducedMotion(surface.matchMedia)) {
    return () => {};
  }

  const observer = createVisibilityObserver(
    (disconnect) => {
      for (const el of surface.elements) {
        const target = Number(el.dataset.target ?? '0');
        animateCounter(
          el,
          0,
          target,
          surface.durationMs,
          surface.formatNumber,
          surface.raf,
          surface.cancelRaf,
        );
        el.dataset.animated = 'true';
      }
      disconnect();
    },
    surface.ObserverCtor,
    { threshold: 0.25 },
  );

  for (const el of surface.elements) {
    observer.observe(el);
  }

  return () => observer.disconnect();
}
