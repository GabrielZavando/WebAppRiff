import { describe, it, expect } from 'vitest';
import {
  formatStatNumber,
  animateCounter,
  createVisibilityObserver,
  initCounterAnimation,
} from '@/lib/anim/createCounterAnimation';

/**
 * Unit tests for the counter animation utility (panel-home-design-enhancements,
 * task 3.1). All browser-only surfaces (requestAnimationFrame,
 * cancelAnimationFrame, IntersectionObserver, matchMedia) are injected so the
 * tests run under Vitest's node environment without jsdom.
 */

// ── Fakes ──────────────────────────────────────────────────────────────────

/** rAF that advances a virtual clock by `step` ms and runs callbacks synchronously. */
function makeRaf(step = 120) {
  let clock = 0;
  return (cb: FrameRequestCallback): number => {
    clock += step;
    cb(clock);
    return clock;
  };
}

const noopCancel = (): void => {};

/** Minimal element double with a mutable textContent + dataset. */
function makeEl(target: string): HTMLElement {
  return {
    textContent: '',
    dataset: { target } as DOMStringMap,
  } as unknown as HTMLElement;
}

/** Fake IntersectionObserver that exposes its callback so tests can trigger it. */
class FakeIntersectionObserver {
  cb: IntersectionObserverCallback;
  disconnected = false;
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    this.disconnected = true;
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  trigger(entries: Partial<IntersectionObserverEntry>[]): void {
    this.cb(
      entries as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }
}

// ── formatStatNumber ───────────────────────────────────────────────────────

describe('formatStatNumber', () => {
  it('formats 30000 as "30.000+" (es-ES thousands + suffix)', () => {
    expect(formatStatNumber(30000)).toBe('30.000+');
  });
  it('formats 40 as "40+"', () => {
    expect(formatStatNumber(40)).toBe('40+');
  });
  it('formats 5 as "5+" and 9 as "9+"', () => {
    expect(formatStatNumber(5)).toBe('5+');
    expect(formatStatNumber(9)).toBe('9+');
  });
});

// ── animateCounter ─────────────────────────────────────────────────────────

describe('animateCounter', () => {
  it('writes the final formatted value when the animation completes', () => {
    const el = makeEl('40');
    const cleanup = animateCounter(
      el,
      0,
      40,
      1000,
      formatStatNumber,
      makeRaf(120),
      noopCancel,
    );
    expect(typeof cleanup).toBe('function');
    expect(el.textContent).toBe('40+');
  });

  it('writes intermediate values before reaching the target', () => {
    const frames: string[] = [];
    const el = makeEl('40');
    const spyFormat = (n: number): string => {
      const s = formatStatNumber(n);
      frames.push(s);
      return s;
    };
    animateCounter(el, 0, 40, 1000, spyFormat, makeRaf(120), noopCancel);
    // More than one frame is rendered, the last one is the final value,
    // and at least one frame differs from the final (i.e. an intermediate).
    expect(frames.length).toBeGreaterThan(1);
    expect(frames[frames.length - 1]).toBe('40+');
    expect(frames.some((f) => f !== '40+')).toBe(true);
    expect(el.textContent).toBe('40+');
  });

  it('returns a no-op cleanup that does not throw', () => {
    const el = makeEl('9');
    const cleanup = animateCounter(
      el,
      0,
      9,
      1000,
      formatStatNumber,
      makeRaf(2000),
      noopCancel,
    );
    expect(() => cleanup()).not.toThrow();
    expect(el.textContent).toBe('9+');
  });
});

// ── createVisibilityObserver (one-shot) ─────────────────────────────────────

describe('createVisibilityObserver', () => {
  it('fires the callback exactly once even on repeated intersections', () => {
    let calls = 0;
    const obs = createVisibilityObserver(
      () => {
        calls += 1;
      },
      FakeIntersectionObserver as unknown as typeof IntersectionObserver,
    );
    (obs as unknown as FakeIntersectionObserver).trigger([
      { isIntersecting: true },
    ]);
    (obs as unknown as FakeIntersectionObserver).trigger([
      { isIntersecting: true },
    ]);
    (obs as unknown as FakeIntersectionObserver).trigger([
      { isIntersecting: false },
    ]);
    expect(calls).toBe(1);
  });
});

// ── initCounterAnimation (integration, injected fakes) ──────────────────────

describe('initCounterAnimation', () => {
  it('animates each element to its data-target when scrolled into view (normal motion)', () => {
    const els = [makeEl('40'), makeEl('30000'), makeEl('5'), makeEl('9')];
    // Capture the observer's trigger callback (without aliasing `this` to a
    // variable, which would violate `@typescript-eslint/no-this-alias`).
    let trigger:
      | ((entries: ReadonlyArray<{ isIntersecting: boolean }>) => void)
      | null = null;
    let wasDisconnected = false;
    class LocalFake extends FakeIntersectionObserver {
      constructor(cb: IntersectionObserverCallback) {
        super(cb);
        trigger = (entries) =>
          cb(
            entries as unknown as IntersectionObserverEntry[],
            this as unknown as IntersectionObserver,
          );
      }
      observe(): void {}
      disconnect(): void {
        wasDisconnected = true;
      }
    }
    initCounterAnimation({
      elements: els,
      raf: makeRaf(120),
      cancelRaf: noopCancel,
      matchMedia: () => ({ matches: false }) as MediaQueryList,
      IntersectionObserver: LocalFake as unknown as typeof IntersectionObserver,
    });
    // Trigger intersection.
    trigger!([{ isIntersecting: true }]);
    expect(els[0]!.textContent).toBe('40+');
    expect(els[1]!.textContent).toBe('30.000+');
    expect(els[2]!.textContent).toBe('5+');
    expect(els[3]!.textContent).toBe('9+');
    // One-shot: observer disconnected after first intersection.
    expect(wasDisconnected).toBe(true);
  });

  it('skips animation under prefers-reduced-motion and leaves content untouched', () => {
    const els = [makeEl('40')];
    const spy = { observed: false };
    class ReducedFake extends FakeIntersectionObserver {
      observe(): void {
        spy.observed = true;
      }
    }
    initCounterAnimation({
      elements: els,
      raf: makeRaf(120),
      cancelRaf: noopCancel,
      matchMedia: () => ({ matches: true }) as MediaQueryList,
      IntersectionObserver: ReducedFake as unknown as typeof IntersectionObserver,
    });
    // No observer should have been created/observed (animation skipped).
    expect(spy.observed).toBe(false);
    expect(els[0]!.textContent).toBe('');
  });

  it('is SSR-safe: returns a no-op without throwing when browser globals are absent', () => {
    const els = [makeEl('40')];
    expect(() =>
      initCounterAnimation({ elements: els }),
    ).not.toThrow();
  });
});
