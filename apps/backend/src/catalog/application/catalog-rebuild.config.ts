/**
 * Environment contract for the scheduled catalog-rebuild flush
 * (`generalize-catalog-rebuild-webhook` change delta).
 *
 * Window variables have documented defaults (silence 60 s, max-wait 300 s,
 * claim TTL 60 s) so local/dev work with zero configuration. The Scheduler
 * identity variables (`CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE` /
 * `CATALOG_REBUILD_FLUSH_EXPECTED_SA`) are OPTIONAL: when either is missing the
 * OIDC guard is fail-closed (every flush request is rejected with 401) and a
 * warning names the missing variable — the same observable no-op policy as the
 * rebuild webhook itself.
 */

export const SILENCE_SECONDS_ENV = 'CATALOG_REBUILD_SILENCE_SECONDS';
export const MAX_WAIT_SECONDS_ENV = 'CATALOG_REBUILD_MAX_WAIT_SECONDS';
export const CLAIM_TTL_SECONDS_ENV = 'CATALOG_REBUILD_CLAIM_TTL_SECONDS';
export const EXPECTED_AUDIENCE_ENV = 'CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE';
export const EXPECTED_SA_ENV = 'CATALOG_REBUILD_FLUSH_EXPECTED_SA';

export const DEFAULT_SILENCE_SECONDS = 60;
export const DEFAULT_MAX_WAIT_SECONDS = 300;
export const DEFAULT_CLAIM_TTL_SECONDS = 60;

/** Full runtime configuration for the catalog-rebuild flush subsystem. */
export interface CatalogRebuildConfig {
  /** Quiet period after the last change before the flush may dispatch. */
  readonly silenceSeconds: number;
  /** Upper bound a batch may wait since its first change before dispatching. */
  readonly maxWaitSeconds: number;
  /** How long a flush claim stays valid before another flush may steal it. */
  readonly claimTtlSeconds: number;
  /** Expected OIDC `aud` of the Cloud Scheduler token (service URL). */
  readonly expectedAudience: string | null;
  /** Expected OIDC `email` of the Scheduler service account. */
  readonly expectedSa: string | null;
}

/** DI token for the catalog-rebuild flush configuration. */
export const CATALOG_REBUILD_CONFIG = 'CATALOG_REBUILD_CONFIG';

type EnvSource = Record<string, string | undefined>;

function readPositiveInt(source: EnvSource, name: string, fallback: number): number {
  const raw = source[name]?.trim();
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function readOptionalToken(source: EnvSource, name: string): string | null {
  const raw = source[name]?.trim();
  return raw ? raw : null;
}

/**
 * Builds the flush configuration from an environment-like source. Pure and
 * environment-agnostic so tests can inject values without re-importing.
 */
export function buildCatalogRebuildConfig(source: EnvSource): CatalogRebuildConfig {
  return {
    silenceSeconds: readPositiveInt(source, SILENCE_SECONDS_ENV, DEFAULT_SILENCE_SECONDS),
    maxWaitSeconds: readPositiveInt(source, MAX_WAIT_SECONDS_ENV, DEFAULT_MAX_WAIT_SECONDS),
    claimTtlSeconds: readPositiveInt(source, CLAIM_TTL_SECONDS_ENV, DEFAULT_CLAIM_TTL_SECONDS),
    expectedAudience: readOptionalToken(source, EXPECTED_AUDIENCE_ENV),
    expectedSa: readOptionalToken(source, EXPECTED_SA_ENV),
  };
}

/**
 * Whether the OIDC gate has its expected Scheduler identity configured. When
 * false, the guard rejects every request (fail-closed) with an explicit warning.
 */
export function isSchedulerIdentityConfigured(config: CatalogRebuildConfig): boolean {
  return config.expectedAudience !== null && config.expectedSa !== null;
}
