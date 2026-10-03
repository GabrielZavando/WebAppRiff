import { describe, it, expect } from 'vitest';
import { initScrollTopButton, type ScrollTopClickEvent } from '@/lib/scroll/createScrollTopButton';

/**
 * Fakes for the scroll-top delegation module (`createScrollTopButton.ts`).
 * Pure `node` environment (no jsdom), same style as the header-scroll tests:
 * the module receives explicit `host`/`target` seams and never touches a real
 * DOM/window.
 */

function createFakeHost() {
  const calls: Array<{ top: number; behavior: string }> = [];
  return {
    get calls() {
      return calls;
    },
    scrollTo(options: { top: number; behavior: string }) {
      calls.push(options);
    },
  };
}

function createFakeEventTarget() {
  const listeners = new Set<(event: ScrollTopClickEvent) => void>();
  return {
    addEventListener(_type: 'click', listener: (event: ScrollTopClickEvent) => void) {
      listeners.add(listener);
    },
    removeEventListener(_type: 'click', listener: (event: ScrollTopClickEvent) => void) {
      listeners.delete(listener);
    },
    dispatch(event: ScrollTopClickEvent) {
      listeners.forEach((listener) => listener(event));
    },
  };
}

interface ElementLike {
  closest(selector: string): ElementLike | null;
}

/** A fake element carrying the `data-scroll-top` attribute. */
function createButton(): ElementLike {
  return {
    closest(selector: string): ElementLike | null {
      return selector === '[data-scroll-top]' ? this : null;
    },
  };
}

/** A fake descendant of the button (e.g. the lucide arrow-up `<svg>`). */
function createDescendant(button: ElementLike): ElementLike {
  return {
    closest(selector: string): ElementLike | null {
      return button.closest(selector);
    },
  };
}

/** A fake unrelated element (no `data-scroll-top` ancestor). */
function createUnrelatedElement(): ElementLike {
  return {
    closest(): ElementLike | null {
      return null;
    },
  };
}

describe('initScrollTopButton — document-level click delegation (design D2)', () => {
  it('[SC-106] scrolls smoothly to the top when the [data-scroll-top] button is clicked', () => {
    const host = createFakeHost();
    const target = createFakeEventTarget();
    const button = createButton();

    const cleanup = initScrollTopButton({ host, target });

    target.dispatch({ target: button });

    expect(host.calls).toEqual([{ top: 0, behavior: 'smooth' }]);

    cleanup();
  });

  it('[SC-106] scrolls smoothly to the top when a descendant of the button is clicked (icon click)', () => {
    const host = createFakeHost();
    const target = createFakeEventTarget();
    const button = createButton();
    const icon = createDescendant(button);

    initScrollTopButton({ host, target });
    target.dispatch({ target: icon });

    expect(host.calls).toEqual([{ top: 0, behavior: 'smooth' }]);
  });

  it('ignores clicks on elements without a [data-scroll-top] ancestor', () => {
    const host = createFakeHost();
    const target = createFakeEventTarget();
    const unrelated = createUnrelatedElement();

    initScrollTopButton({ host, target });
    target.dispatch({ target: unrelated });
    // Non-element click targets (e.g. a text node) are ignored as well.
    target.dispatch({ target: 'some-text-node' });

    expect(host.calls).toEqual([]);
  });

  it('[SC-104] keeps working after a client-side navigation (body swap) — delegation is attached to the persistent document, no re-init needed', () => {
    const host = createFakeHost();
    // `document` (the event target) persists across View Transitions; only the
    // body content is swapped, so the post-swap button is a NEW element.
    const documentTarget = createFakeEventTarget();

    initScrollTopButton({ host, target: documentTarget });

    // Simulate the swap: the pre-navigation button is gone, a new button
    // (post-swap body) is clicked through the same persistent `document`.
    const postSwapButton = createButton();
    documentTarget.dispatch({ target: postSwapButton });

    expect(host.calls).toEqual([{ top: 0, behavior: 'smooth' }]);
  });

  it('detaches the listener on cleanup (no scroll after cleanup)', () => {
    const host = createFakeHost();
    const target = createFakeEventTarget();
    const button = createButton();

    const cleanup = initScrollTopButton({ host, target });
    cleanup();

    target.dispatch({ target: button });

    expect(host.calls).toEqual([]);
  });
});