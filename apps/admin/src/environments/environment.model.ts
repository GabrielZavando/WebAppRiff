/**
 * Admin panel environment contract (change `admin-panel-foundation`, D3).
 *
 * Types live in their own module so the per-configuration variants
 * (`environment.development.local.ts`, `environment.production.ts`) can reference
 * them without importing `environment.ts` — which gets REPLACED by
 * fileReplacements at build time (a self-import would be a compile error).
 *
 * Firebase web client credentials are public identifiers, but real values
 * are still kept out of the repository and injected per environment.
 */
export interface AdminFirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

export interface AdminEnvironment {
  firebase: AdminFirebaseClientConfig;
  /** Base URL of the backend API, e.g. `http://localhost:3000/api/v1`. */
  apiBaseUrl: string;
}
