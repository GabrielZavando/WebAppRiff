/**
 * Build-time environment contract for the Astro site's data clients
 * (`lib/api/*`): the shared API base URL resolver plus the `REQUIRE_API`
 * fail-fast gate for catalog sources (SC-env-01..05).
 *
 * Contract (SC-env-01/02): the returned base always ends with `/api/v1`,
 * whether `NESTJS_API_URL` is configured with or without the version suffix.
 * The documented default fallback is `http://localhost:3000/api/v1`.
 */

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1';
const API_VERSION_SUFFIX = '/api/v1';

/**
 * Resolves the API base URL from `NESTJS_API_URL`, guaranteeing the result
 * ends with `/api/v1`.
 *
 * - A configured URL without the suffix gets it appended
 *   (`https://api.somosriff.cl` → `https://api.somosriff.cl/api/v1`).
 * - A configured URL that already ends with the suffix is returned unchanged
 *   (never `/api/v1/api/v1`); a single trailing slash is tolerated and stripped.
 * - Unset or blank values fall back to `http://localhost:3000/api/v1`.
 *
 * Reads the environment at call time (not module load) so tests and builds
 * can inject `NESTJS_API_URL` without re-importing the module.
 */
export function resolveApiBaseUrl(): string {
  const configured = process.env.NESTJS_API_URL?.trim() ?? '';
  if (configured === '') {
    return DEFAULT_API_BASE_URL;
  }
  const withoutTrailingSlash = configured.endsWith('/')
    ? configured.slice(0, -1)
    : configured;
  if (withoutTrailingSlash.endsWith(API_VERSION_SUFFIX)) {
    return withoutTrailingSlash;
  }
  return `${withoutTrailingSlash}${API_VERSION_SUFFIX}`;
}

/**
 * Whether the current build MUST fail when a build-time catalog source is
 * unavailable (SC-env-03/04). Enabled explicitly with `REQUIRE_API=true`
 * (production Docker builds set it as a build arg). `import.meta.env.PROD`
 * alone does NOT enable the gate: without `REQUIRE_API` the warn-and-fallback
 * behavior is preserved (SC-env-05).
 */
export function mustFailOnCatalogError(): boolean {
  return process.env.REQUIRE_API === 'true';
}

/**
 * Shared gate for build-time catalog sources: re-throws as an explicit build
 * error when `REQUIRE_API=true`; otherwise returns so the caller can warn and
 * fall back (SC-env-03). Call it first inside the source's `catch`.
 */
export function assertCatalogSourceAvailable(source: string, error: unknown): void {
  if (!mustFailOnCatalogError()) {
    return;
  }
  const cause = error instanceof Error ? error.message : String(error);
  throw new Error(
    `[REQUIRE_API=true] Failed to load ${source} from API; failing the production build (SC-env-03/04). Cause: ${cause}`,
  );
}

/**
 * Warns (never throws) that a catalog source fell back to its safe default.
 * Flags production builds so silent empty-catalog fallbacks are visible in
 * build logs (SC-env-05).
 */
export function warnCatalogFallback(source: string, error: unknown): void {
  console.warn(
    `Failed to load ${source} from API${
      import.meta.env.PROD ? ' (production build)' : ''
    }; falling back to empty catalog (set REQUIRE_API=true to fail the build instead).`,
    error,
  );
}
