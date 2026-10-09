import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  initFormToast,
  FORM_RESULT_EVENT,
  TOAST_ROOT_SELECTOR,
  type FormResultDetail,
  type FormResultEventLike,
  type ToastClickEventLike,
  type ToastElementLike,
  type ToastOptions,
} from '@/lib/forms/formToastClient';
import { initFormSubmit } from '@/lib/forms/formSubmitClient';

/**
 * Fakes for the toast delegation module (`formToastClient.ts`). Pure `node`
 * environment (no jsdom), same style as the scroll-top tests: the module
 * receives an explicit `target` seam and never touches a real DOM/document.
 * The auto-close timer is driven with fake timers.
 */

type ToastEventLike = FormResultEventLike | ToastClickEventLike;
type AnyListener = (event: ToastEventLike) => void;

interface FakeTargetShape {
  addEventListener(type: string, listener: AnyListener): void;
  removeEventListener(type: string, listener: AnyListener): void;
  querySelector(selector: string): ToastElementLike | null;
  setRoot(root: ToastElementLike | null): void;
  dispatchResult(detail: FormResultDetail): void;
  dispatchClickOn(element: unknown): void;
  dispatchEvent(event: ToastEventLike): void;
  getListenerCount(): number;
  getResultListenerCount(): number;
}

function createFakeTarget(): FakeTargetShape {
  const listeners = new Set<AnyListener>();
  const resultListeners = new Set<AnyListener>();
  let root: ToastElementLike | null = null;
  return {
    addEventListener(type: string, listener: AnyListener): void {
      listeners.add(listener);
      if (type === FORM_RESULT_EVENT) resultListeners.add(listener);
    },
    removeEventListener(type: string, listener: AnyListener): void {
      listeners.delete(listener);
      if (type === FORM_RESULT_EVENT) resultListeners.delete(listener);
    },
    querySelector(selector: string): ToastElementLike | null {
      return selector === TOAST_ROOT_SELECTOR ? root : null;
    },
    setRoot(next: ToastElementLike | null): void {
      root = next;
    },
    dispatchResult(detail: FormResultDetail): void {
      listeners.forEach((listener) => listener({ detail }));
    },
    dispatchClickOn(element: unknown): void {
      listeners.forEach((listener) => listener({ target: element }));
    },
    dispatchEvent(event: ToastEventLike): void {
      listeners.forEach((listener) => listener(event));
    },
    getListenerCount(): number {
      return listeners.size;
    },
    getResultListenerCount(): number {
      return resultListeners.size;
    },
  };
}

interface FakeToastRootShape {
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  querySelector(selector: string): { textContent: string } | null;
  closest(selector: string): FakeToastRootShape | null;
  readonly hidden: boolean;
  readonly variant: string | undefined;
  readonly state: string | undefined;
  readonly role: string | undefined;
  readonly ariaLive: string | undefined;
  readonly message: string;
  readonly showCalls: number;
}

function createFakeToastRoot(): FakeToastRootShape {
  // Starts hidden, mirroring the SSG initial state of Toast.astro.
  const attrs = new Map<string, string>([['hidden', '']]);
  let message = '';
  let showCalls = 0;
  const root: FakeToastRootShape = {
    setAttribute(name: string, value: string): void {
      if (name === 'data-state' && value === 'visible') showCalls += 1;
      attrs.set(name, value);
    },
    removeAttribute(name: string): void {
      attrs.delete(name);
    },
    querySelector(selector: string): { textContent: string } | null {
      if (selector !== '[data-toast-message]') return null;
      return {
        get textContent(): string {
          return message;
        },
        set textContent(value: string) {
          message = value;
        },
      };
    },
    closest(selector: string): FakeToastRootShape | null {
      return selector === TOAST_ROOT_SELECTOR ? root : null;
    },
    get hidden(): boolean {
      return attrs.has('hidden');
    },
    get variant(): string | undefined {
      return attrs.get('data-variant');
    },
    get state(): string | undefined {
      return attrs.get('data-state');
    },
    get role(): string | undefined {
      return attrs.get('role');
    },
    get ariaLive(): string | undefined {
      return attrs.get('aria-live');
    },
    get message(): string {
      return message;
    },
    get showCalls(): number {
      return showCalls;
    },
  };
  return root;
}

/** A fake `[data-toast-close]` button inside the given toast root. */
function createFakeCloseTarget(root: FakeToastRootShape): ToastElementLike {
  const closeTarget: ToastElementLike = {
    closest(selector: string): ToastElementLike | null {
      if (selector === '[data-toast-close]') return closeTarget;
      return root.closest(selector);
    },
    setAttribute(): void {},
    removeAttribute(): void {},
    querySelector(): { readonly textContent: string } | null {
      return null;
    },
  };
  return closeTarget;
}

/** A fake unrelated click target (no `[data-toast-close]` ancestor). */
function createUnrelatedClickTarget(): ToastElementLike {
  return {
    closest(): null {
      return null;
    },
    setAttribute(): void {},
    removeAttribute(): void {},
    querySelector(): { readonly textContent: string } | null {
      return null;
    },
  };
}

/**
 * Test isolation: the module-level `bound` flag persists across tests in this
 * file, and an assertion failing mid-test would skip the inline `cleanup()`
 * call and leave the flag bound (cascading failures). Every test binds through
 * this helper, which stores the FIRST returned cleanup (the real one; later
 * no-op cleanups never overwrite it) and a file-level `afterEach` always runs
 * it.
 */
let pendingCleanup: (() => void) | undefined;

function bindFirst(options: ToastOptions = {}): () => void {
  const cleanup = initFormToast(options);
  if (!pendingCleanup) pendingCleanup = cleanup;
  return cleanup;
}

afterEach(() => {
  pendingCleanup?.();
  pendingCleanup = undefined;
});

describe('initFormToast — document-level delegation (design D6)', () => {
  it('shows the toast with the success variant, message, and status semantics from the event detail', () => {
    const target = createFakeTarget();
    const root = createFakeToastRoot();
    target.setRoot(root);

    const cleanup = bindFirst({ target });
    target.dispatchResult({ kind: 'success', message: '¡Gracias! Mensaje enviado' });

    expect(root.variant).toBe('success');
    expect(root.role).toBe('status');
    expect(root.ariaLive).toBe('polite');
    expect(root.state).toBe('visible');
    expect(root.hidden).toBe(false);
    expect(root.message).toBe('¡Gracias! Mensaje enviado');
    expect(root.showCalls).toBe(1);

    cleanup();
  });

  it('shows the toast with the error variant and alert semantics (role=alert, aria-live=assertive)', () => {
    const target = createFakeTarget();
    const root = createFakeToastRoot();
    target.setRoot(root);

    const cleanup = bindFirst({ target });
    target.dispatchResult({ kind: 'error', message: 'Ocurrió un error, reintenta.' });

    expect(root.variant).toBe('error');
    expect(root.role).toBe('alert');
    expect(root.ariaLive).toBe('assertive');
    expect(root.state).toBe('visible');
    expect(root.hidden).toBe(false);
    expect(root.message).toBe('Ocurrió un error, reintenta.');
    expect(root.showCalls).toBe(1);

    cleanup();
  });

  it('switches the semantics along with the variant on a new result', () => {
    const target = createFakeTarget();
    const root = createFakeToastRoot();
    target.setRoot(root);

    const cleanup = bindFirst({ target });
    target.dispatchResult({ kind: 'success', message: 'ok' });
    expect(root.role).toBe('status');
    expect(root.ariaLive).toBe('polite');

    target.dispatchResult({ kind: 'error', message: 'fallo' });
    expect(root.variant).toBe('error');
    expect(root.role).toBe('alert');
    expect(root.ariaLive).toBe('assertive');
    expect(root.message).toBe('fallo');

    cleanup();
  });
});

describe('initFormToast — auto-close timer (design D7)', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.useRealTimers();
    pendingCleanup = undefined;
  });

  function setup(): { target: FakeTargetShape; root: FakeToastRootShape } {
    const target = createFakeTarget();
    const root = createFakeToastRoot();
    target.setRoot(root);
    cleanup = bindFirst({ target });
    return { target, root };
  }

  it('auto-closes after 5 seconds by default', () => {
    const { target, root } = setup();
    target.dispatchResult({ kind: 'success', message: 'ok' });
    expect(root.hidden).toBe(false);

    vi.advanceTimersByTime(4_999);
    expect(root.hidden).toBe(false);

    vi.advanceTimersByTime(1);
    expect(root.hidden).toBe(true);
    expect(root.state).toBe('hidden');
  });

  it('honours the timeoutMs override', () => {
    const target = createFakeTarget();
    const root = createFakeToastRoot();
    target.setRoot(root);
    cleanup = bindFirst({ target, timeoutMs: 50 });

    target.dispatchResult({ kind: 'success', message: 'ok' });
    vi.advanceTimersByTime(49);
    expect(root.hidden).toBe(false);

    vi.advanceTimersByTime(1);
    expect(root.hidden).toBe(true);
  });

  it('a new result restarts the auto-close timer (cancels the pending one)', () => {
    const { target, root } = setup();
    target.dispatchResult({ kind: 'success', message: 'primero' });
    vi.advanceTimersByTime(4_000);

    // A second result within the window: the pending close from the FIRST
    // result is cancelled and a new 5s window starts from the latest result.
    target.dispatchResult({ kind: 'success', message: 'segundo' });
    expect(root.message).toBe('segundo');

    vi.advanceTimersByTime(4_000);
    // 8s in total: the original 5s window already elapsed — without the
    // restart the toast would be hidden by now.
    expect(root.hidden).toBe(false);

    vi.advanceTimersByTime(1_000);
    expect(root.hidden).toBe(true);
  });

  it('clicking X hides the toast and cancels the pending auto-close', () => {
    const { target, root } = setup();
    const closeTarget = createFakeCloseTarget(root);

    target.dispatchResult({ kind: 'success', message: 'ok' });
    vi.advanceTimersByTime(4_000);
    expect(root.hidden).toBe(false);

    target.dispatchClickOn(closeTarget);
    expect(root.hidden).toBe(true);
    expect(root.state).toBe('hidden');

    // The pending auto-close was cancelled: no further hide fires.
    vi.advanceTimersByTime(10_000);
    expect(root.hidden).toBe(true);
  });

  it('ignores clicks on elements without a [data-toast-close] ancestor', () => {
    const { target, root } = setup();
    const unrelated = createUnrelatedClickTarget();

    target.dispatchResult({ kind: 'success', message: 'ok' });
    target.dispatchClickOn(unrelated);
    // Non-element click targets (e.g. text nodes) are ignored as well.
    target.dispatchClickOn('some-text-node');

    expect(root.hidden).toBe(false);
  });
});

describe('initFormToast — idempotency: no listener accumulation (design D6)', () => {
  it('registers the result listener at most once: double initialization triggers a single handling', () => {
    const target = createFakeTarget();
    const root = createFakeToastRoot();
    target.setRoot(root);

    const cleanup1 = bindFirst({ target });
    const cleanup2 = bindFirst({ target });

    expect(target.getResultListenerCount()).toBe(1);

    target.dispatchResult({ kind: 'success', message: 'ok' });
    expect(root.showCalls).toBe(1);

    cleanup1();
    cleanup2();
  });

  it('re-initialization after cleanup does not accumulate listeners across round trips', () => {
    const target = createFakeTarget();
    const root = createFakeToastRoot();
    target.setRoot(root);

    for (let round = 0; round < 3; round += 1) {
      const cleanup = bindFirst({ target });
      expect(target.getResultListenerCount()).toBe(1);
      cleanup();
      expect(target.getResultListenerCount()).toBe(0);
    }

    // After the round trips the toast still reacts when re-initialized.
    const cleanup = bindFirst({ target });
    target.dispatchResult({ kind: 'error', message: 'fallo' });
    expect(root.showCalls).toBe(1);
    expect(root.variant).toBe('error');
    cleanup();
  });

  it('returns a no-op cleanup on subsequent calls without detaching the first listener', () => {
    const target = createFakeTarget();
    const root = createFakeToastRoot();
    target.setRoot(root);

    const cleanup1 = bindFirst({ target });
    const cleanup2 = bindFirst({ target });

    cleanup2();
    expect(target.getResultListenerCount()).toBe(1);
    target.dispatchResult({ kind: 'success', message: 'ok' });
    expect(root.showCalls).toBe(1);

    cleanup1();
    expect(target.getResultListenerCount()).toBe(0);
    target.dispatchResult({ kind: 'success', message: 'ok' });
    expect(root.showCalls).toBe(1);
  });
});

describe('initFormToast — cleanup and no-toast edge cases', () => {
  it('detaches the listeners on cleanup: the toast no longer reacts to results', () => {
    const target = createFakeTarget();
    const root = createFakeToastRoot();
    target.setRoot(root);

    const cleanup = bindFirst({ target });
    cleanup();

    target.dispatchResult({ kind: 'success', message: 'ok' });
    expect(root.showCalls).toBe(0);
    expect(root.hidden).toBe(true);
  });

  it('is a no-op when no [data-form-toast] root exists in the DOM', () => {
    const target = createFakeTarget();
    target.setRoot(null);

    const cleanup = bindFirst({ target });

    expect(() => target.dispatchResult({ kind: 'success', message: 'ok' })).not.toThrow();

    cleanup();
  });
});

describe('initFormSubmit ↔ initFormToast — event contract end-to-end (task 4.3)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  interface IntegrationFormShape {
    getAttribute: (name: string) => string | null;
    addEventListener: (type: string, cb: (e: SubmitEvent) => Promise<void>) => void;
    removeEventListener: (type: string, cb: (e: SubmitEvent) => Promise<void>) => void;
    dispatchEvent: (event: Event) => void;
    querySelector: (selector: string) => HTMLButtonElement | null;
    reset: () => void;
    elements: unknown[];
    submitHandlers: Array<(e: SubmitEvent) => Promise<void>>;
  }

  /**
   * Fake form that forwards its dispatched events through the given hook —
   * standing in for the real bubbling dispatch towards `document`, where the
   * toast delegation listens.
   */
  function createIntegrationForm(options: {
    successMessage?: string;
    errorMessage?: string;
    onDispatch: (event: Event) => void;
  }): HTMLFormElement {
    const submitButton = { disabled: false } as HTMLButtonElement;
    const form: IntegrationFormShape = {
      getAttribute: (name: string) => {
        if (name === 'action') return '/api/v1/contacts';
        if (name === 'data-success-message') return options.successMessage ?? null;
        if (name === 'data-error-message') return options.errorMessage ?? null;
        return null;
      },
      addEventListener: (_type: string, cb) => {
        form.submitHandlers.push(cb);
      },
      removeEventListener: (_type: string, cb) => {
        const index = form.submitHandlers.indexOf(cb);
        if (index >= 0) form.submitHandlers.splice(index, 1);
      },
      dispatchEvent: (event: Event) => {
        options.onDispatch(event);
      },
      querySelector: (selector: string) => {
        if (selector === 'button[type="submit"]') return submitButton;
        return null;
      },
      reset: vi.fn(),
      elements: [],
      submitHandlers: [],
    };
    return form as unknown as HTMLFormElement;
  }

  async function dispatchSubmit(form: HTMLFormElement): Promise<void> {
    const handlers = (form as unknown as IntegrationFormShape).submitHandlers;
    if (handlers.length === 0) throw new Error('No submit handler registered');
    for (const handler of handlers) {
      await handler({ preventDefault: vi.fn() } as unknown as SubmitEvent);
    }
  }

  it('shows the success toast on a 2xx response and resets the form', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const target = createFakeTarget();
    const root = createFakeToastRoot();
    target.setRoot(root);

    const form = createIntegrationForm({
      successMessage: 'Solicitud enviada',
      onDispatch: (event) => target.dispatchEvent(event as ToastEventLike),
    });

    initFormSubmit(form);
    const cleanupToast = bindFirst({ target });
    await dispatchSubmit(form);

    expect(root.variant).toBe('success');
    expect(root.message).toBe('Solicitud enviada');
    expect(root.hidden).toBe(false);
    expect(root.role).toBe('status');
    expect(root.ariaLive).toBe('polite');
    expect(form.reset).toHaveBeenCalledTimes(1);

    // Auto-close after the 5s window.
    vi.advanceTimersByTime(5_000);
    expect(root.hidden).toBe(true);

    cleanupToast();
  });

  it('shows the error toast on a non-2xx response and keeps the fields (no reset)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 502 });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const target = createFakeTarget();
    const root = createFakeToastRoot();
    target.setRoot(root);

    const form = createIntegrationForm({
      errorMessage: 'No pudimos enviar la solicitud',
      onDispatch: (event) => target.dispatchEvent(event as ToastEventLike),
    });

    initFormSubmit(form);
    const cleanupToast = bindFirst({ target });
    await dispatchSubmit(form);

    expect(root.variant).toBe('error');
    expect(root.message).toBe('No pudimos enviar la solicitud');
    expect(root.role).toBe('alert');
    expect(root.ariaLive).toBe('assertive');
    expect(root.hidden).toBe(false);
    expect(form.reset).not.toHaveBeenCalled();

    cleanupToast();
  });

  it('works without a toast in the DOM: the submission publishes the event regardless', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const target = createFakeTarget();
    target.setRoot(null);

    const form = createIntegrationForm({
      onDispatch: (event) => target.dispatchEvent(event as ToastEventLike),
    });

    initFormSubmit(form);
    const cleanupToast = bindFirst({ target });
    await dispatchSubmit(form);

    expect(form.reset).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    cleanupToast();
  });
});

describe('initFormToast wiring in the pages (source contract, task 4.4)', () => {
  const WEB_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));

  function readPageSource(name: string): string {
    return readFileSync(join(WEB_ROOT, 'src', 'pages', name), 'utf-8');
  }

  for (const page of ['contacto.astro', 'cotizacion.astro'] as const) {
    it(`${page} imports and invokes initFormToast once per session, outside astro:page-load`, () => {
      const src = readPageSource(page);
      expect(src).toContain("from '@/lib/forms/formToastClient'");
      // Invoked exactly once, at top level (module-level guard makes repeated
      // invocations a no-op; registering inside astro:page-load would re-bind).
      expect(src.match(/initFormToast\(\);/g)).toHaveLength(1);
      // The astro:page-load callback wires only the submit handler, not the toast.
      const pageLoad = src.match(
        /document\.addEventListener\('astro:page-load', \(\) => \{[\s\S]*?\}\);/,
      );
      expect(pageLoad).toBeTruthy();
      expect(pageLoad![0]).not.toContain('initFormToast');
    });
  }
});
