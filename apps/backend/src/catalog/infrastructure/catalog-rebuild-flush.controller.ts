import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CatalogRebuildFlushService } from '../application/catalog-rebuild-flush.service';
import { SchedulerOidcGuard } from './scheduler-oidc.guard';

/**
 * Internal endpoint of the scheduled catalog-rebuild flush (change
 * `catalog-rebuild-flush-scheduler`).
 *
 * - Invoked by Cloud Scheduler every minute (`POST /internal/catalog-rebuild/flush`).
 * - Lives OUTSIDE the `/api/v1` global prefix, excluded in `main.ts` with the
 *   same mechanism as `/health` (it is infrastructure, not part of the public
 *   API surface).
 * - Protected by `SchedulerOidcGuard` — the app-side OIDC verification is the
 *   REAL gate (the service runs with `--allow-unauthenticated`).
 * - Always answers 2xx with the decision outcome; retries are owned by the
 *   service backoff, never by the Scheduler.
 */
@Controller('internal/catalog-rebuild')
@UseGuards(SchedulerOidcGuard)
export class CatalogRebuildFlushController {
  constructor(private readonly flushService: CatalogRebuildFlushService) {}

  @Post('flush')
  @HttpCode(HttpStatus.OK)
  async flush(): Promise<{ status: string }> {
    const outcome = await this.flushService.flush();
    return { status: outcome.status };
  }
}
