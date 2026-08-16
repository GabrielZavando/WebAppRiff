import { Injectable, Logger } from '@nestjs/common';
import {
  CategoryChangeEvent,
  ICategoryChangeNotifier,
} from '../domain/icategory-change-notifier';

const WEBHOOK_URL_ENV = 'CATEGORIES_WEBHOOK_URL';

/**
 * Concrete `ICategoryChangeNotifier` that notifies a configured HTTP endpoint
 * (e.g. a Coolify deploy webhook) whenever a category changes. This is what
 * triggers a rebuild of the static Astro site so the public search dropdown
 * picks up the new category list.
 *
 * Design notes:
 * - No-op when `CATEGORIES_WEBHOOK_URL` is unset, so local/dev never fails.
 * - Fire-and-forget: `notifyChange` returns synchronously and never throws; the
 *   actual HTTP request runs asynchronously and swallows transport errors.
 * - This keeps the category mutation (201/200/204) independent of webhook health.
 */
@Injectable()
export class WebhookCategoryChangeNotifier implements ICategoryChangeNotifier {
  private readonly logger = new Logger(WebhookCategoryChangeNotifier.name);

  notifyChange(event: CategoryChangeEvent): void {
    const url = process.env[WEBHOOK_URL_ENV];
    if (!url) {
      return;
    }
    void this.dispatch(url, event);
  }

  private async dispatch(url: string, event: CategoryChangeEvent): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      this.logger.warn(`Failed to notify category change webhook: ${String(error)}`);
    }
  }
}
