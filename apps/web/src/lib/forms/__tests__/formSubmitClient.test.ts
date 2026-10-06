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
  querySelector: (selector: string) => HTMLElement | HTMLButtonElement | null;
  reset: () => void;
  elements: HTMLInputElement[];
  submitHandler?: (e: SubmitEvent) => Promise<void>;
}

type MockClassList = {
  remove: ReturnType<typeof vi.fn>;
  add: ReturnType<typeof vi.fn>;
};

function createFakeForm(options: {
  fields: FieldStub[];
  successMessage?: string;
  errorMessage?: string;
}) {
  const submitButton = { disabled: false } as HTMLButtonElement;
  const statusEl = {
    textContent: '',
    classList: { remove: vi.fn(), add: vi.fn() } as MockClassList,
  } as unknown as HTMLElement;

  const form: FakeFormShape = {
    getAttribute: (name: string) => {
      if (name === 'action') return '/api/v1/contacts';
      if (name === 'data-success-message') return options.successMessage ?? null;
      if (name === 'data-error-message') return options.errorMessage ?? null;
      return null;
    },
    addEventListener: (_type: string, cb) => {
      form.submitHandler = cb;
    },
    removeEventListener: (_type: string, cb) => {
      if (form.submitHandler === cb) form.submitHandler = undefined;
    },
    querySelector: (selector: string) => {
      if (selector === 'button[type="submit"]') return submitButton;
      if (selector === '[role="status"]') return statusEl;
      return null;
    },
    reset: vi.fn(),
    elements: options.fields.map(field),
  };

  return {
    form: form as unknown as HTMLFormElement,
    submitButton,
    statusEl,
    getStatusClassCalls: () =>
      (statusEl.classList.add as unknown as { mock: { calls: string[][] } }).mock
        .calls,
  };
}

async function dispatchSubmit(form: HTMLFormElement): Promise<void> {
  const handler = (form as unknown as FakeFormShape).submitHandler;
  if (!handler) throw new Error('No submit handler registered');
  const preventDefault = vi.fn();
  await handler({ preventDefault } as unknown as SubmitEvent);
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
    const handler = (form as unknown as FakeFormShape).submitHandler!;
    const pending = handler({ preventDefault: vi.fn() } as unknown as SubmitEvent);
    expect(submitButton.disabled).toBe(true);

    resolveFetch!({ ok: true });
    await pending;
    expect(submitButton.disabled).toBe(false);
  });

  it('shows a confirmation and resets the form on a 2xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { form, statusEl, getStatusClassCalls } = createFakeForm({
      fields: BASE_FIELDS,
      successMessage: '¡Gracias! Mensaje enviado',
    });

    initFormSubmit(form);
    await dispatchSubmit(form);

    expect(statusEl.textContent).toBe('¡Gracias! Mensaje enviado');
    expect(getStatusClassCalls()).toContainEqual(['text-success']);
    expect(form.reset).toHaveBeenCalledTimes(1);
  });

  it('shows a clear error and keeps the fields on a non-2xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 502 });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { form, statusEl, getStatusClassCalls } = createFakeForm({
      fields: BASE_FIELDS,
      errorMessage: 'Ocurrió un error, reintenta.',
    });

    initFormSubmit(form);
    await dispatchSubmit(form);

    expect(statusEl.textContent).toBe('Ocurrió un error, reintenta.');
    expect(getStatusClassCalls()).toContainEqual(['text-error']);
    expect(form.reset).not.toHaveBeenCalled();
  });

  it('shows a clear error and keeps the fields on a network failure, re-enabling the button', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { form, statusEl, submitButton } = createFakeForm({
      fields: BASE_FIELDS,
      errorMessage: 'Fallo de red',
    });

    initFormSubmit(form);
    await dispatchSubmit(form);

    expect(statusEl.textContent).toBe('Fallo de red');
    expect(form.reset).not.toHaveBeenCalled();
    expect(submitButton.disabled).toBe(false);
  });

  it('re-enables the submit button after a non-2xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 502 });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { form, submitButton } = createFakeForm({ fields: BASE_FIELDS });

    initFormSubmit(form);
    const handler = (form as unknown as FakeFormShape).submitHandler!;
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

  it('falls back to defaults when no messages are configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { form, statusEl } = createFakeForm({ fields: BASE_FIELDS });

    initFormSubmit(form);
    await dispatchSubmit(form);
    expect(statusEl.textContent).toBe(
      'No pudimos enviar el mensaje. Inténtalo nuevamente.',
    );
  });

  it('returns a cleanup function that detaches the submit handler', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { form } = createFakeForm({ fields: BASE_FIELDS });

    const cleanup = initFormSubmit(form);
    cleanup();
    expect((form as unknown as FakeFormShape).submitHandler).toBeUndefined();
  });
});