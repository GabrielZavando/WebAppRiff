/**
 * Port for dispatching the Coolify rebuild webhook on behalf of the scheduled
 * flush endpoint (change `catalog-rebuild-flush-scheduler`).
 *
 * Unlike `ICatalogChangeNotifier` (fire-and-forget buffering), this port is
 * REQUEST/RESPONSE: the caller (flush service) MUST know whether the dispatch
 * succeeded to resolve the claim (clear the state on success, schedule bounded
 * backoff on failure). Implementations MUST NOT throw; failures are returned
 * as structured results. Secrets (Bearer token) MUST never appear in results
 * or logs — logging is owned by the caller.
 */
export interface CatalogRebuildWebhookPayload {
  /** Start of the dispatched batch (ISO-8601). */
  readonly firstChangeAt: string;
  /** Last catalog change included in the dispatched batch (ISO-8601). */
  readonly lastChangeAt: string;
}

export type CatalogRebuildWebhookDispatchResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: 'not-configured' | 'http-error' | 'timeout' | 'transport';
      /** HTTP status when reason is 'http-error'. */
      readonly status?: number;
    };

export const I_CATALOG_REBUILD_WEBHOOK_CLIENT = 'I_CATALOG_REBUILD_WEBHOOK_CLIENT';

export interface ICatalogRebuildWebhookClient {
  dispatch(payload: CatalogRebuildWebhookPayload): Promise<CatalogRebuildWebhookDispatchResult>;
}
