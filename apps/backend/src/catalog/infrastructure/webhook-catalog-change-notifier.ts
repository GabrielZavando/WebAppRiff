import { Injectable, Logger } from '@nestjs/common';
import {
  CatalogChangeEvent,
  ICatalogChangeNotifier,
} from '../domain/icatalog-change-notifier';

const REBUILD_URL_ENV = 'CATALOG_REBUILD_WEBHOOK_URL';
const REBUILD_TOKEN_ENV = 'CATALOG_REBUILD_WEBHOOK_TOKEN';
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Concrete `ICatalogChangeNotifier` that notifies a configured HTTP endpoint
 * (e.g. a Coolify deploy webhook) whenever any public catalog entity changes
 * (category, subcategory, product), triggering a rebuild of the static Astro site.
 *
 * Design notes:
 * - Reads `CATALOG_REBUILD_WEBHOOK_URL` and `CATALOG_REBUILD_WEBHOOK_TOKEN`.
 * - No-op when the URL or the token is unset, so local/dev never fails.
 * - Fire-and-forget: `notifyChange` returns synchronously and never throws; the
 *   actual HTTP request runs asynchronously and swallows transport errors.
 * - Authenticates with `Authorization: Bearer <token>` and a time-bounded
 *   `POST` (`AbortSignal.timeout`), keeping the catalog mutation independent of
 *   webhook health.
 * - Errors are logged as warnings with `String(error)` and only the entity
 *   type/action — never the token or the URL.
 */
@Injectable()
export class WebhookCatalogChangeNotifier implements ICatalogChangeNotifier {
  private readonly logger = new Logger(WebhookCatalogChangeNotifier.name);

  notifyChange(event: CatalogChangeEvent): void {
    const url = process.env[REBUILD_URL_ENV];
    const token = process.env[REBUILD_TOKEN_ENV];
    if (!url || !token) {
      return;
    }
    void this.dispatch(url, token, event);
  }

  private async dispatch(
    url: string,
    token: string,
    event: CatalogChangeEvent,
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn(
          `[catalog-rebuild] HTTP ${response.status} for ${event.entityType}/${event.action}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `[catalog-rebuild] failed for ${event.entityType}/${event.action}: ${String(error)}`,
      );
    }
  }
}