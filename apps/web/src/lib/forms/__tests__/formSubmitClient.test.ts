import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initFormSubmit,
  serializeForm,
  resolveFormSubmitUrl,
} from '@/lib/forms/formSubmitClient';

/**
 * Fakes for the form-submit client. Pure `node` environment (no jsdom): the
 * module receives the `<form>` as a seam and only touches `fetch` on the
 * global, which is stubbed per test.
 */

interface FieldStub {
  name: string;
  value: string;
  type?: string;
  tagName?: string;
  disabled?: boolean;
  checked?: boolean;
  multiple?: boolean;
  selectedOptions?: Array<{ value: string }>;
}

function field(stub: FieldStub): HTMLInputElement {
  const base = { ...stub, disabled: stub.disabled ?? false, checked: stub.checked ?? false };
  return base as unknown as HTMLInputElement;
}

interface FakeFormShape {
  getAttribute: (name: string) => string | null;
  addEventListener: (type: string, cb: (e: SubmitEvent) => Promise<void>) => void;
  removeEventListener: (type: string, cb: (e: SubmitEvent) => Promise<void>) => void;
  dispatchEvent: (event: Event) => void;
  querySelector: (selector: string) => HTMLElement | HTMLButtonElement | null;
  reset: () => void;
  elements: HTMLInputElement[];
  submitHandlers: Array<(e: SubmitEvent) => Promise<void>>;
  dispatchedEvents: Event[];
}

function createFakeForm(options: {
  fields: FieldStub[];
  successMessage?: string;
  errorMessage?: string;
}) {
  const submitButton = { disabled: false } as HTMLButtonElement;
  const dispatchedEvents: Event[] = [];

  const form: FakeFormShape = {
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
      form.submitHandlers = form.submitHandlers.filter((h) => h !== cb);
    },
    dispatchEvent: (event: Event) => {
      dispatchedEvents.push(event);
    },
    querySelector: (selector: string) => {
      if (selector === 'button[type="submit"]') return submitButton;
      return null;
    },
    reset: vi.fn(),
    elements: options.fields.map(field),
    submitHandlers: [],
    dispatchedEvents,
  };

  return {
    form: form as unknown as HTMLFormElement,
    submitButton,
    dispatchedEvents,
  };
}

/** Narrowing helper for the dispatched result events. */
function getResultEvent(
  dispatchedEvents: Event[],
): CustomEvent<{ kind: string; message: string }> {
  const event = dispatchedEvents[0];
  if (!event) throw new Error('No result event was dispatched');
  return event as CustomEvent<{ kind: string; message: string }>;
}

async function dispatchSubmit(form: HTMLFormElement): Promise<void> {
  const handlers = (form as unknown as FakeFormShape).submitHandlers;
  if (!handlers || handlers.length === 0) throw new Error('No submit handler registered');
  const preventDefault = vi.fn();
  for (const handler of handlers) {
    await handler({ preventDefault } as unknown as SubmitEvent);
  }
}

const BASE_FIELDS: FieldStub[] = [
  { name: 'nombre', value: 'Juan', tagName: 'INPUT' },
  { name: 'email', value: 'juan@example.com', tagName: 'INPUT' },
  {
    name: 'areasDeInteres',
    value: 'medicion-fluidos',
    type: 'checkbox',
    tagName: 'INPUT',
    checked: true,
  },
  { name: 'website', value: '', tagName: 'INPUT' },
  { name: 'mensaje', value: 'Hola', tagName: 'TEXTAREA' },
];

describe('serializeForm', () => {
  it('serializes text inputs and textareas as strings and checkbox groups as arrays', () => {
    const { form } = createFakeForm({ fields: BASE_FIELDS });
    const payload = serializeForm(form);
    expect(payload).toEqual({
      nombre: 'Juan',
      email: 'juan@example.com',
      areasDeInteres: ['medicion-fluidos'],
      website: '',
      mensaje: 'Hola',
    });
  });

  it('collects multiple checked checkboxes with the same name into one array', () => {
    const { form } = createFakeForm({
      fields: [
        ...BASE_FIELDS,
        {
          name: 'areasDeInteres',
          value: 'tratamiento-agua',
          type: 'checkbox',
          tagName: 'INPUT',
          checked: true,
        },
      ],
    });
    const payload = serializeForm(form);
    expect(payload.areasDeInteres).toEqual(['medicion-fluidos', 'tratamiento-agua']);
  });

  it('skips unchecked checkboxes and disabled fields', () => {
    const { form } = createFakeForm({
      fields: [
        {
          name: 'areasDeInteres',
          value: 'no-chequeado',
          type: 'checkbox',
          tagName: 'INPUT',
          checked: false,
        },
        { name: 'website', value: '', tagName: 'INPUT', disabled: true },
      ],
    });
    const payload = serializeForm(form);
    expect(payload).toEqual({});
  });

  it('serializes single-select and multi-select fields', () => {
    const { form } = createFakeForm({
      fields: [
        { name: 'categoria', value: 'cat-fluidos', tagName: 'SELECT' },
        {
          name: 'multi',
          value: '',
          tagName: 'SELECT',
          multiple: true,
          selectedOptions: [{ value: 'a' }, { value: 'b' }],
        },
      ],
    });
    const payload = serializeForm(form);
    expect(payload).toEqual({ categoria: 'cat-fluidos', multi: ['a', 'b'] });
  });
});

describe('resolveFormSubmitUrl', () => {
  it('joins the relative action onto the default API base without duplicating /api/v1', () => {
    expect(resolveFormSubmitUrl('/api/v1/contacts')).toBe(
      'http://localhost:3000/api/v1/contacts',
    );
    expect(resolveFormSubmitUrl('/api/v1/quotes')).toBe(
      'http://localhost:3000/api/v1/quotes',
    );
  });

  it('uses the configured base (with or without the /api/v1 suffix)', () => {
    expect(
      resolveFormSubmitUrl('/api/v1/contacts', 'https://api.riff.cl/api/v1'),
    ).toBe('https://api.riff.cl/api/v1/contacts');
    expect(resolveFormSubmitUrl('/api/v1/contacts', 'https://api.riff.cl')).toBe(
      'https://api.riff.cl/api/v1/contacts',
    );
    expect(
      resolveFormSubmitUrl('/api/v1/contacts', 'https://api.riff.cl/'),
    ).toBe('https://api.riff.cl/api/v1/contacts');
  });

  it('keeps a path that does not carry the version prefix intact', () => {
    expect(resolveFormSubmitUrl('/contacts', 'https://api.riff.cl/api/v1')).toBe(
      'https://api.riff.cl/api/v1/contacts',
    );
  });

  it('passes an already-absolute action through untouched', () => {
    expect(resolveFormSubmitUrl('https://api.riff.cl/api/v1/quotes')).toBe(
      'https://api.riff.cl/api/v1/quotes',
    );
    expect(resolveFormSubmitUrl('http://localhost:3000/api/v1/quotes')).toBe(
      'http://localhost:3000/api/v1/quotes',
    );
  });

  it('returns an empty string when the form has no action', () => {
    expect(resolveFormSubmitUrl('')).toBe('');
  });
});

describe('initFormSubmit', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('intercepts submit and POSTs a JSON payload with the honeypot to the resolved API URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { form } = createFakeForm({ fields: BASE_FIELDS });

    initFormSubmit(form);
    await dispatchSubmit(form);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('http://localhost:3000/api/v1/contacts');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'content-type': 'application/json' });
    expect(JSON.parse(String(init.body))).toEqual({
      nombre: 'Juan',
      email: 'juan@example.com',
      areasDeInteres: ['medicion-fluidos'],
      website: '',
      mensaje: 'Hola',
    });
  });

  it('honours the apiBaseUrl override', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { form } = createFakeForm({ fields: BASE_FIELDS });

    initFormSubmit(form, { apiBaseUrl: 'https://api.riff.cl/api/v1' });
    await dispatchSubmit(form);

    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.riff.cl/api/v1/contacts');
  });

  it('disables the submit button while in flight and re-enables it afterwards', async () => {
    let resolveFetch: (response: { ok: boolean }) => void;
    const fetchMock = vi.fn(
      () =>
        new Promise<{ ok: boolean }>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { form, submitButton } = createFakeForm({ fields: BASE_FIELDS });

    initFormSubmit(form);
    const handler = (form as unknown as FakeFormShape).submitHandlers[0]!;
    const pending = handler({ preventDefault: vi.fn() } as unknown as SubmitEvent);
    expect(submitButton.disabled).toBe(true);

    resolveFetch!({ ok: true });
    await pending;
    expect(submitButton.disabled).toBe(false);
  });

  it('publishes the success result as a custom event and resets the form on a 2xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { form, dispatchedEvents } = createFakeForm({
      fields: BASE_FIELDS,
      successMessage: '¡Gracias! Mensaje enviado',
    });

    initFormSubmit(form);
    await dispatchSubmit(form);

    expect(dispatchedEvents).toHaveLength(1);
    const event = getResultEvent(dispatchedEvents);
    expect(event.type).toBe('riff:form-result');
    expect(event.detail.kind).toBe('success');
    expect(event.detail.message).toBe('¡Gracias! Mensaje enviado');
    expect(form.reset).toHaveBeenCalledTimes(1);
  });

  it('publishes the error result as a custom event and keeps the fields on a non-2xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 502 });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { form, dispatchedEvents } = createFakeForm({
      fields: BASE_FIELDS,
      errorMessage: 'Ocurrió un error, reintenta.',
    });

    initFormSubmit(form);
    await dispatchSubmit(form);

    const event = getResultEvent(dispatchedEvents);
    expect(event.type).toBe('riff:form-result');
    expect(event.detail.kind).toBe('error');
    expect(event.detail.message).toBe('Ocurrió un error, reintenta.');
    expect(form.reset).not.toHaveBeenCalled();
  });

  it('publishes the error result and keeps the fields on a network failure, re-enabling the button', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { form, dispatchedEvents, submitButton } = createFakeForm({
      fields: BASE_FIELDS,
      errorMessage: 'Fallo de red',
    });

    initFormSubmit(form);
    await dispatchSubmit(form);

    const event = getResultEvent(dispatchedEvents);
    expect(event.detail.kind).toBe('error');
    expect(event.detail.message).toBe('Fallo de red');
    expect(form.reset).not.toHaveBeenCalled();
    expect(submitButton.disabled).toBe(false);
  });

  it('re-enables the submit button after a non-2xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 502 });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { form, submitButton } = createFakeForm({ fields: BASE_FIELDS });

    initFormSubmit(form);
    const handler = (form as unknown as FakeFormShape).submitHandlers[0]!;
    let resolveFetch: (response: { ok: boolean; status: number }) => void;
    globalThis.fetch = vi.fn(
      () =>
        new Promise<{ ok: boolean; status: number }>((resolve) => {
          resolveFetch = resolve;
        }),
    ) as unknown as typeof fetch;
    const pending = handler({ preventDefault: vi.fn() } as unknown as SubmitEvent);
    expect(submitButton.disabled).toBe(true);

    resolveFetch!({ ok: false, status: 502 });
    await pending;
    expect(submitButton.disabled).toBe(false);
  });

  it('falls back to the default messages in the published event when none are configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { form, dispatchedEvents } = createFakeForm({ fields: BASE_FIELDS });

    initFormSubmit(form);
    await dispatchSubmit(form);
    const event = getResultEvent(dispatchedEvents);
    expect(event.detail.kind).toBe('error');
    expect(event.detail.message).toBe(
      'No pudimos enviar el mensaje. Inténtalo nuevamente.',
    );
  });

  it('returns a cleanup function that detaches the submit handler', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { form } = createFakeForm({ fields: BASE_FIELDS });

    const cleanup = initFormSubmit(form);
    cleanup();
    expect((form as unknown as FakeFormShape).submitHandlers).toHaveLength(0);
  });

  describe('idempotency', () => {
    it('is idempotent: double initialization registers a single listener and triggers a single fetch', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      globalThis.fetch = fetchMock as unknown as typeof fetch;
      const { form } = createFakeForm({ fields: BASE_FIELDS });

      initFormSubmit(form);
      initFormSubmit(form);

      expect((form as unknown as FakeFormShape).submitHandlers).toHaveLength(1);
      await dispatchSubmit(form);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns a no-op cleanup on subsequent calls without detaching the listener from the first call', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      globalThis.fetch = fetchMock as unknown as typeof fetch;
      const { form } = createFakeForm({ fields: BASE_FIELDS });

      const cleanup1 = initFormSubmit(form);
      const cleanup2 = initFormSubmit(form);

      cleanup2();
      expect((form as unknown as FakeFormShape).submitHandlers).toHaveLength(1);
      await dispatchSubmit(form);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      cleanup1();
      expect((form as unknown as FakeFormShape).submitHandlers).toHaveLength(0);
    });

    it('allows re-initialization after the primary cleanup is invoked', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      globalThis.fetch = fetchMock as unknown as typeof fetch;
      const { form } = createFakeForm({ fields: BASE_FIELDS });

      const cleanup1 = initFormSubmit(form);
      cleanup1();
      expect((form as unknown as FakeFormShape).submitHandlers).toHaveLength(0);

      const cleanup2 = initFormSubmit(form);
      expect((form as unknown as FakeFormShape).submitHandlers).toHaveLength(1);
      await dispatchSubmit(form);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      cleanup2();
      expect((form as unknown as FakeFormShape).submitHandlers).toHaveLength(0);
    });
  });

  describe('timeout', () => {
    it('cancels the submission and publishes the error event when fetch times out via AbortSignal', async () => {
      const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;
          if (signal) {
            signal.addEventListener('abort', () => {
              reject(signal.reason ?? new DOMException('The operation was aborted', 'AbortError'));
            });
          }
        });
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;
      const { form, dispatchedEvents, submitButton } = createFakeForm({
        fields: BASE_FIELDS,
        errorMessage: 'Tiempo de espera agotado',
      });

      initFormSubmit(form, { timeoutMs: 50 });
      await dispatchSubmit(form);

      const event = getResultEvent(dispatchedEvents);
      expect(event.detail.kind).toBe('error');
      expect(event.detail.message).toBe('Tiempo de espera agotado');
      expect(form.reset).not.toHaveBeenCalled();
      expect(submitButton.disabled).toBe(false);
    });

    it('does not interfere with the happy path when fetch completes before timeout', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      globalThis.fetch = fetchMock as unknown as typeof fetch;
      const { form, dispatchedEvents } = createFakeForm({ fields: BASE_FIELDS });

      initFormSubmit(form, { timeoutMs: 50 });
      await dispatchSubmit(form);

      const event = getResultEvent(dispatchedEvents);
      expect(event.detail.kind).toBe('success');
      expect(event.detail.message).toBe('Mensaje enviado correctamente');
      expect(form.reset).toHaveBeenCalledTimes(1);
    });
  });
});