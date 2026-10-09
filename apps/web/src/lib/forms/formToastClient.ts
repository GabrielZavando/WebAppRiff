/**
 * Document-level delegation for the form-result toast (`Toast.astro`).
 *
 * Pure, dependency-free and SSR-safe: it only reads `document` when it exists
 * and can be fully driven by an injected `target` fake in a Node test
 * environment (no jsdom dependency).
 *
 * The form runtime (`initFormSubmit`) publishes each submission result as a
 * custom event (`riff:form-result`) on the `<form>`; this module listens at the
 * `document` level (delegation), resolves the `[data-form-toast]` root at event
 * time and applies the variant/message/ARIA semantics from the event detail.
 *
 * One-time module-level guard (design.md D6): the toast script is a bundled
 * module the browser executes once per session, so the flag survives
 * View Transitions round trips (the module never re-executes) and listener
 * accumulation across navigations is impossible. Double initialization is a
 * no-op (returns a no-op cleanup, same pattern as `initFormSubmit`) and the
 * cleanup resets the flag to allow re-initialization. This is the same class of
 * bug the `boundForms` WeakSet solved for per-form-node submit binding,
 * adapted to a single global binding (the toast listens on `document`, not on a
 * form node).
 *
 * Auto-close timer (design.md D7): each result clears any pending timer,
 * shows the toast and schedules a new close, so a new submission always
 * restarts the window; the explicit close control (X) cancels the pending
 * timer and hides immediately. A timer surviving a View Transitions swap hides
 * a detached node (harmless no-op); the root is resolved at event time for the
 * next result.
 */

/** The custom event the form runtime publishes on the `<form>` (bubbles). */
export const FORM_RESULT_EVENT = 'riff:form-result';

/** The attribute that marks the toast root (see Toast.astro). */
export const TOAST_ROOT_SELECTOR = '[data-form-toast]';

const TOAST_CLOSE_SELECTOR = '[data-toast-close]';
const TOAST_MESSAGE_SELECTOR = '[data-toast-message]';
const DEFAULT_AUTO_CLOSE_MS = 5_000;

export type ToastKind = 'success' | 'error';

/** Shape of the published event `detail`. */
export interface FormResultDetail {
  readonly kind: ToastKind;
  readonly message: string;
}

export interface FormResultEventLike {
  readonly detail: FormResultDetail | null;
}

export interface ToastClickEventLike {
  readonly target: unknown;
}

/** Minimal surface of a toast element (root, close target, message wrapper). */
export interface ToastElementLike {
  closest(selector: string): ToastElementLike | null;
  setAttribute(qualifiedName: string, value: string): void;
  removeAttribute(qualifiedName: string): void;
  querySelector(selector: string): { textContent: string } | null;
}

/**
 * Minimal surface of the object that receives the delegation listeners.
 * Browser default: `document`, where the delegation persists across View
 * Transitions body swaps. Injected as a seam in tests.
 */
export interface ToastEventTarget {
  addEventListener(
    type: 'riff:form-result' | 'click',
    listener: (event: FormResultEventLike | ToastClickEventLike) => void,
  ): void;
  removeEventListener(
    type: 'riff:form-result' | 'click',
    listener: (event: FormResultEventLike | ToastClickEventLike) => void,
  ): void;
  querySelector(selector: string): ToastElementLike | null;
}

export interface ToastOptions {
  /** Auto-close delay in milliseconds (defaults to 5_000). For tests. */
  readonly timeoutMs?: number;
  /**
   * Event target that receives the delegation listeners (defaults to
   * `document` in the browser). Injected for tests.
   */
  readonly target?: ToastEventTarget;
}

const ROLE_BY_KIND: Record<ToastKind, string> = {
  success: 'status',
  error: 'alert',
};

const LIVE_BY_KIND: Record<ToastKind, string> = {
  success: 'polite',
  error: 'assertive',
};

/** One-time module-level guard (design.md D6). */
let bound = false;

function isToastElementLike(value: unknown): value is ToastElementLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ToastElementLike).closest === 'function'
  );
}

/**
 * Attaches the document-level delegation listeners (result + close click) once,
 * resolving the `[data-form-toast]` root at event time. Because the listeners
 * live on `document` (never swapped by View Transitions) and the module-level
 * guard prevents re-binding, they keep working after every client-side
 * navigation without listener accumulation.
 * Returns a cleanup function that detaches the listeners and allows
 * re-initialization.
 */
export function initFormToast(options: ToastOptions = {}): () => void {
  if (bound) {
    return () => {};
  }
  bound = true;

  const maybeTarget =
    options.target ??
    (typeof document !== 'undefined'
      ? (document as unknown as ToastEventTarget)
      : undefined);
  if (!maybeTarget) {
    bound = false;
    throw new Error(
      'initFormToast: no event target available (document is undefined).',
    );
  }
  const target: ToastEventTarget = maybeTarget;

  const timeoutMs = options.timeoutMs ?? DEFAULT_AUTO_CLOSE_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function clearPendingTimer(): void {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  }

  function hide(root: ToastElementLike): void {
    root.setAttribute('hidden', '');
    root.setAttribute('data-state', 'hidden');
  }

  function show(root: ToastElementLike, kind: ToastKind, message: string): void {
    // The semantics (role/aria-live) are updated along with the variant BEFORE
    // the content changes, and the region is pre-declared (empty) in the SSG
    // HTML, so screen readers announce the change reliably (design.md D8).
    root.setAttribute('data-variant', kind);
    root.setAttribute('data-state', 'visible');
    root.setAttribute('role', ROLE_BY_KIND[kind]);
    root.setAttribute('aria-live', LIVE_BY_KIND[kind]);
    root.removeAttribute('hidden');
    const messageEl = root.querySelector(TOAST_MESSAGE_SELECTOR);
    if (messageEl) messageEl.textContent = message;
  }

  function handleResult(
    event: FormResultEventLike | ToastClickEventLike,
  ): void {
    if (!('detail' in event)) return;
    const detail = event.detail;
    const kind = detail?.kind === 'error' ? 'error' : 'success';
    const message = typeof detail?.message === 'string' ? detail.message : '';
    const root = target.querySelector(TOAST_ROOT_SELECTOR);
    if (!root) return;
    clearPendingTimer();
    show(root, kind, message);
    timer = setTimeout(() => {
      timer = undefined;
      hide(root);
    }, timeoutMs);
  }

  function handleCloseClick(
    event: FormResultEventLike | ToastClickEventLike,
  ): void {
    if (!('target' in event)) return;
    const element = event.target;
    if (!isToastElementLike(element)) return;
    // The click may land on the close button or on a descendant (e.g. the
    // lucide X `<svg>`); `closest` resolves the `[data-toast-close]` element
    // in both cases, then the `[data-form-toast]` root above it.
    const closeEl = element.closest(TOAST_CLOSE_SELECTOR);
    if (!closeEl) return;
    const root = closeEl.closest(TOAST_ROOT_SELECTOR);
    if (!root) return;
    clearPendingTimer();
    hide(root);
  }

  target.addEventListener(FORM_RESULT_EVENT, handleResult);
  target.addEventListener('click', handleCloseClick);

  return () => {
    target.removeEventListener(FORM_RESULT_EVENT, handleResult);
    target.removeEventListener('click', handleCloseClick);
    clearPendingTimer();
    bound = false;
  };
}
