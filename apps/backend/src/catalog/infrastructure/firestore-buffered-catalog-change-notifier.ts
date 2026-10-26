import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CatalogChangeEvent,
  ICatalogChangeNotifier,
} from '../domain/icatalog-change-notifier';
import {
  ICatalogRebuildStateStore,
  I_CATALOG_REBUILD_STATE_STORE,
} from '../domain/icatalog-rebuild-state-store';

const REBUILD_URL_ENV = 'CATALOG_REBUILD_WEBHOOK_URL';
const REBUILD_TOKEN_ENV = 'CATALOG_REBUILD_WEBHOOK_TOKEN';

/**
 * Concrete `ICatalogChangeNotifier` that BUFFERS catalog changes into the
 * durable Firestore rebuild-state document instead of firing the Coolify
 * webhook immediately (change `catalog-rebuild-flush-scheduler`). The webhook
 * is dispatched later by the internal flush endpoint invoked by Cloud
 * Scheduler, so bursts of edits coalesce into a single deploy.
 *
 * Design notes:
 * - Reads `CATALOG_REBUILD_WEBHOOK_URL` and `CATALOG_REBUILD_WEBHOOK_TOKEN`.
 *   Without a destination there is nothing to buffer for: the notification is
 *   an observable no-op (explicit warning naming the missing variable) and no
 *   state is written.
 * - Fire-and-forget: `notifyChange` returns synchronously and never throws;
 *   state-store failures are logged as warnings without leaking secrets.
 * - Does NOT touch claim or backoff fields (owned by the flush flow).
 */
@Injectable()
export class FirestoreBufferedCatalogChangeNotifier implements ICatalogChangeNotifier {
  private readonly logger = new Logger(FirestoreBufferedCatalogChangeNotifier.name);

  constructor(
    @Inject(I_CATALOG_REBUILD_STATE_STORE)
    private readonly store: ICatalogRebuildStateStore,
  ) {}

  notifyChange(event: CatalogChangeEvent): void {
    const url = process.env[REBUILD_URL_ENV];
    const token = process.env[REBUILD_TOKEN_ENV];
    if (!url || !token) {
      const missing = [
        !url ? REBUILD_URL_ENV : null,
        !token ? REBUILD_TOKEN_ENV : null,
      ].filter((name): name is string => name !== null);
      this.logger.warn(
        `[catalog-rebuild] not configured (missing ${missing.join(', ')}); ` +
          `skipping rebuild notification for ${event.entityType}/${event.action}`,
      );
      return;
    }
    void this.store
      .recordChange(event)
      .catch((error: unknown) => {
        this.logger.warn(
          `[catalog-rebuild] failed to buffer ${event.entityType}/${event.action}: ${String(error)}`,
        );
      });
  }
}
