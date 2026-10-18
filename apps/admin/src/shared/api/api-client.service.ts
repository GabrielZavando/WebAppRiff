import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Standard backend response envelope (see `docs/api/api-spec.yml` and the
 * `response-envelope-meta` spec): every endpoint answers with
 * `{ data, error, meta }`; `meta` carries pagination stats when applicable.
 */
export interface ApiErrorBody {
  message?: string;
  code?: string;
  [key: string]: unknown;
}

export interface ApiEnvelope<T> {
  data: T;
  error: ApiErrorBody | null;
  meta: Record<string, unknown> | null;
}

/** Typed failure surface for admin panel API calls. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Backend HTTP client (task 1.4, design D4).
 *
 * Builds absolute URLs from `environment.apiBaseUrl`, unwraps the standard
 * envelope and normalizes failures into `ApiError`. Domain services
 * (ProfileService today; catalog/quotes/users in later changes) build on it.
 */
@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  get<T>(path: string): Observable<T> {
    return this.request<T>('GET', path);
  }

  /**
   * GET that exposes both `data` and `meta` (task 1.1, design D1). The plain
   * `get` unwraps `envelope.data` only, which is insufficient for the paginated
   * product list — its pagination stats ride on the envelope `meta`
   * (contract `api-products-pagination`).
   */
  getWithMeta<T>(
    path: string,
  ): Observable<{ data: T; meta: Record<string, unknown> | null }> {
    const url = `${this.baseUrl}/${path.replace(/^\//, '')}`;
    return this.http
      .request<ApiEnvelope<T>>('GET', url, { observe: 'response' })
      .pipe(
        map((response) => this.unwrapWithMeta<T>(response)),
        catchError((error: unknown) => throwError(() => this.toApiError(error))),
      );
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>('POST', path, body);
  }

  /**
   * POST with a raw `FormData` (multipart uploads, change `admin-uploads`).
   * Sends the form untouched so the browser applies the
   * `multipart/form-data; boundary=...` header itself; `authInterceptor` still
   * attaches the Bearer token. Same envelope unwrap / `toApiError` mapping.
   */
  postFormData<T>(path: string, formData: FormData): Observable<T> {
    const url = `${this.baseUrl}/${path.replace(/^\//, '')}`;
    return this.http
      .request<ApiEnvelope<T>>('POST', url, { body: formData, observe: 'response' })
      .pipe(
        map((response) => this.unwrap<T>(response)),
        catchError((error: unknown) => throwError(() => this.toApiError(error))),
      );
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>('PUT', path, body);
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.request<T>('DELETE', path);
  }

  private request<T>(
    method: string,
    path: string,
    body?: unknown,
    context?: HttpContext,
  ): Observable<T> {
    const url = `${this.baseUrl}/${path.replace(/^\//, '')}`;
    return this.http
      .request<ApiEnvelope<T>>(method, url, { body, context, observe: 'response' })
      .pipe(
        map((response) => this.unwrap<T>(response)),
        catchError((error: unknown) => throwError(() => this.toApiError(error))),
      );
  }

  private unwrap<T>(response: HttpResponse<ApiEnvelope<T>>): T {
    const envelope = response.body;
    if (envelope === null || envelope === undefined) {
      throw new ApiError('Empty response from backend', response.status, null);
    }
    if (envelope.error !== null && envelope.error !== undefined) {
      throw new ApiError(
        envelope.error.message ?? 'Unexpected backend error',
        response.status,
        envelope.error.code ?? null,
      );
    }
    return envelope.data;
  }

  /** Same envelope checks as `unwrap`, but hands `meta` to the caller too. */
  private unwrapWithMeta<T>(
    response: HttpResponse<ApiEnvelope<T>>,
  ): { data: T; meta: Record<string, unknown> | null } {
    const envelope = response.body;
    if (envelope === null || envelope === undefined) {
      throw new ApiError('Empty response from backend', response.status, null);
    }
    if (envelope.error !== null && envelope.error !== undefined) {
      throw new ApiError(
        envelope.error.message ?? 'Unexpected backend error',
        response.status,
        envelope.error.code ?? null,
      );
    }
    return { data: envelope.data, meta: envelope.meta };
  }

  private toApiError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }
    const httpError = error as { status?: number; error?: unknown };
    const status = httpError?.status ?? 0;
    const body = httpError?.error;
    // Backend failures carry the standard `{ data, error, meta }` envelope in
    // the (parsed) response body — prefer its structured message.
    if (isEnvelopeWithError(body)) {
      return new ApiError(
        body.error.message ?? `Request failed with status ${status}`,
        status,
        body.error.code ?? null,
      );
    }
    if (typeof body === 'string' && body.length > 0) {
      return new ApiError(body, status, null);
    }
    return new ApiError(`Request failed with status ${status}`, status, null);
  }
}

/** Type guard for failure responses that still carry the standard envelope. */
function isEnvelopeWithError(
  body: unknown,
): body is { error: { message?: string; code?: string } } {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as { error?: unknown }).error === 'object' &&
    (body as { error: unknown }).error !== null
  );
}
