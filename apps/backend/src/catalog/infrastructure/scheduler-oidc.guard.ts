import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import {
  CatalogRebuildConfig,
  CATALOG_REBUILD_CONFIG,
  EXPECTED_AUDIENCE_ENV,
  EXPECTED_SA_ENV,
  isSchedulerIdentityConfigured,
} from '../application/catalog-rebuild.config';

/** DI token for the Google OAuth2 client used to verify Scheduler OIDC tokens. */
export const GOOGLE_OAUTH2_CLIENT = 'GOOGLE_OAUTH2_CLIENT';

/**
 * App-side OIDC gate for `POST /internal/catalog-rebuild/flush` (change
 * `catalog-rebuild-flush-scheduler`).
 *
 * This guard is the REAL access control: the Cloud Run service is deployed
 * with `--allow-unauthenticated`, so the Scheduler service account's
 * `roles/run.invoker` never filters anything at the IAM level. The guard
 * verifies, with `google-auth-library`:
 *   1. the token is a Google-signed ID token (signature + exp via JWKS),
 *   2. `aud` equals `CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE`,
 *   3. `email` equals `CATALOG_REBUILD_FLUSH_EXPECTED_SA`,
 *   4. `email_verified` is true.
 *
 * Fail-closed: missing/malformed headers, invalid signatures, mismatched
 * claims — and an UNCONFIGURED expected identity — all reject with 401. The
 * token value never appears in logs (warnings name the failure category only).
 */
@Injectable()
export class SchedulerOidcGuard implements CanActivate {
  private readonly logger = new Logger(SchedulerOidcGuard.name);

  constructor(
    @Inject(GOOGLE_OAUTH2_CLIENT) private readonly oauthClient: OAuth2Client,
    @Inject(CATALOG_REBUILD_CONFIG) private readonly config: CatalogRebuildConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers?: Record<string, unknown> }>();
    const token = this.extractBearerToken(request?.headers);
    if (token === null) {
      throw new UnauthorizedException('Missing or malformed Scheduler identity');
    }
    if (!isSchedulerIdentityConfigured(this.config)) {
      this.logger.warn(
        `[catalog-rebuild-flush] OIDC gate not configured (missing ${EXPECTED_AUDIENCE_ENV}` +
          ` and/or ${EXPECTED_SA_ENV}); rejecting flush request (fail-closed)`,
      );
      throw new UnauthorizedException('Scheduler identity not configured');
    }
    try {
      const ticket = await this.oauthClient.verifyIdToken({
        idToken: token,
        audience: this.config.expectedAudience ?? undefined,
      });
      const payload = ticket.getPayload();
      if (!this.isExpectedScheduler(payload)) {
        throw new UnauthorizedException('Token claims do not match the expected Scheduler');
      }
      return true;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn(
        '[catalog-rebuild-flush] rejected flush request: invalid Scheduler OIDC token ' +
          `(${error instanceof Error ? error.name : 'unknown error'})`,
      );
      throw new UnauthorizedException('Invalid Scheduler identity');
    }
  }

  private extractBearerToken(headers: Record<string, unknown> | undefined): string | null {
    const raw = headers?.authorization;
    if (typeof raw !== 'string' || !raw.startsWith('Bearer ')) {
      return null;
    }
    const token = raw.slice('Bearer '.length).trim();
    return token === '' ? null : token;
  }

  private isExpectedScheduler(
    payload: {
      aud?: string | null;
      email?: string | null;
      email_verified?: boolean | string | null;
    } | undefined | null,
  ): boolean {
    if (!payload) {
      return false;
    }
    // Explicit aud check: defense-in-depth even though verifyIdToken({audience})
    // already enforces it (a mocked/stubbed client must not bypass the gate).
    if (payload.aud !== this.config.expectedAudience) {
      return false;
    }
    const verified = payload.email_verified === true || payload.email_verified === 'true';
    return (
      typeof payload.email === 'string' &&
      payload.email === this.config.expectedSa &&
      verified
    );
  }
}
