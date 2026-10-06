import { normalizeApiBaseUrl } from '@/lib/api/apiBaseUrl';

/**
 * Client-side submission for the public lead-capture forms (`/contacto` and
 * `/cotizacion`). Progressive enhancement over the native HTML POST:
 * - Native HTML5 constraint validation still runs first (the `submit` event
 *   only fires for valid forms).
 * - The form is serialized to JSON: checkbox/radio groups become arrays
 *   (matching `areasDeInteres: string[]`), text inputs/textarea become strings.
 * - The payload is POSTed with `fetch` to the backend API base URL resolved
 *   from `PUBLIC_API_URL` (default `http://localhost:3000/api/v1`) plus the
 *   form's API path — NOT to the relative `action` (a static site has no
 *   `/api/*` behind its own origin in production).
 * - The submit button is disabled while the request is in flight.
 * - The result is rendered in an inline `[role="status"]` region (aria-live):
 *   confirmation + `form.reset()` on 2xx, clear error keeping the fields on
 *   failure.
 *
 * The success/error copy can come from the options object or from
 * `data-success-message` / `data-error-message` attributes on the `<form>`.
 * The honeypot `website` field travels in the payload as an empty string for
 * real users; the backend rejects bot submissions silently.
 */
export interface FormSubmitOptions {
  readonly successMessage?: string;
  readonly errorMessage?: string;
  /** API base URL override (defaults to `PUBLIC_API_URL`). For tests. */
  readonly apiBaseUrl?: string;
}

const DEFAULT_SUCCESS_MESSAGE = 'Mensaje enviado correctamente';
const DEFAULT_ERROR_MESSAGE =
  'No pudimos enviar el mensaje. Inténtalo nuevamente.';
const API_VERSION_SUFFIX = '/api/v1';

/**
 * Resolves the absolute endpoint URL for a form submission.
 *
 * - An already-absolute `action` is used as-is.
 * - Otherwise the relative `action` (`/api/v1/contacts`) is joined onto the
 *   resolved API base (`PUBLIC_API_URL`, default `http://localhost:3000/api/v1`),
 *   stripping any `/api/v1` prefix so it is never duplicated.
 */
export function resolveFormSubmitUrl(
  action: string,
  apiBaseUrlOverride?: string,
): string {
  if (action === '') return '';
  if (/^https?:\/\//i.test(action)) return action;

  const rawBase =
    apiBaseUrlOverride ??
    (import.meta.env.PUBLIC_API_URL as string | undefined) ??
    '';
  const base = normalizeApiBaseUrl(rawBase);
  const path = action.startsWith(API_VERSION_SUFFIX)
    ? action.slice(API_VERSION_SUFFIX.length)
    : action;
  return `${base}${path}`;
}

export function serializeForm(form: HTMLFormElement): Record<string, unknown> {
  const elements = Array.from(form.elements);
  const payload: Record<string, unknown> = {};

  for (const element of elements) {
    const input = element as HTMLInputElement;
    const name = input.name;
    if (name === '' || input.disabled) continue;

    if (input.type === 'checkbox' || input.type === 'radio') {
      if (!input.checked) continue;
      const values = payload[name];
      if (Array.isArray(values)) {
        values.push(input.value);
      } else {
        payload[name] = [input.value];
      }
    } else if (element.tagName === 'SELECT') {
      const select = element as HTMLSelectElement;
      if (select.multiple) {
        payload[name] = Array.from(select.selectedOptions).map((o) => o.value);
      } else {
        payload[name] = select.value;
      }
    } else {
      payload[name] = input.value;
    }
  }

  return payload;
}

export function initFormSubmit(
  form: HTMLFormElement,
  options: FormSubmitOptions = {},
): () => void {
  const action = form.getAttribute('action') ?? '';
  const url = resolveFormSubmitUrl(action, options.apiBaseUrl);
  const successMessage =
    options.successMessage ??
    form.getAttribute('data-success-message') ??
    DEFAULT_SUCCESS_MESSAGE;
  const errorMessage =
    options.errorMessage ??
    form.getAttribute('data-error-message') ??
    DEFAULT_ERROR_MESSAGE;
  const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const statusEl = form.querySelector<HTMLElement>('[role="status"]');

  function setStatus(message: string, kind: 'success' | 'error'): void {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove('text-success', 'text-error');
    statusEl.classList.add(kind === 'success' ? 'text-success' : 'text-error');
  }

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (submitButton) submitButton.disabled = true;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(serializeForm(form)),
      });
      if (!response.ok) {
        setStatus(errorMessage, 'error');
        return;
      }
      setStatus(successMessage, 'success');
      form.reset();
    } catch {
      setStatus(errorMessage, 'error');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  }

  form.addEventListener('submit', handleSubmit);
  return () => form.removeEventListener('submit', handleSubmit);
}