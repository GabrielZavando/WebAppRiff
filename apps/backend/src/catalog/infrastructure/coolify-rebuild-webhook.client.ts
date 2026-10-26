import { Injectable } from '@nestjs/common';
import {
  CatalogRebuildWebhookDispatchResult,
  CatalogRebuildWebhookPayload,
  ICatalogRebuildWebhookClient,
} from '../domain/icatalog-rebuild-webhook-client';

const REBUILD_URL_ENV = 'CATALOG_REBUILD_WEBHOOK_URL';
const REBUILD_TOKEN_ENV = 'CATALOG_REBUILD_WEBHOOK_TOKEN';
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Concrete `ICatalogRebuildWebhookClient` that dispatches the Coolify deploy
 * webhook (`CATALOG_REBUILD_WEBHOOK_URL`) on behalf of the scheduled flush
 * endpoint (change `catalog-rebuild-flush-scheduler`).
 *
 * Unlike the old fire-and-forget notifier, the client REPORTS the outcome so
 * the flush service can resolve the claim (clear on success, backoff on
 * failure). It never throws: failures are returned as a structured result and
 * logged upstream by the service, which owns the warning/error policy and
 * never logs the token or the URL.
 */
@Injectable()
export class CoolifyRebuildWebhookClient implements ICatalogRebuildWebhookClient {
  async dispatch(
    payload: CatalogRebuildWebhookPayload,
  ): Promise<CatalogRebuildWebhookDispatchResult> {
    const url = process.env[REBUILD_URL_ENV];
    const token = process.env[REBUILD_TOKEN_ENV];
    if (!url || !token) {
      return { ok: false, reason: 'not-configured' };
    }
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        return { ok: false, reason: 'http-error', status: response.status };
      }
      return { ok: true };
    } catch (error: unknown) {
      const aborted =
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError');
      return { ok: false, reason: aborted ? 'timeout' : 'transport' };
    }
  }
}
