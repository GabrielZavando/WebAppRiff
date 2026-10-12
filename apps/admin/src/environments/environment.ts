/**
 * Admin panel environment — committed placeholder variant (task 1.1 / D3).
 *
 * Declares the full key set with safe empty values and is replaced per build
 * configuration via `fileReplacements` in `angular.json`:
 * - development  → `environment.development.local.ts` (gitignored, generated
 *                  by `scripts/write-env.mjs --target=dev`; example in
 *                  `environment.development.example.ts`)
 * - production   → `environment.production.ts` (gitignored, generated from
 *                  build env vars by `scripts/write-env.mjs`; see
 *                  `environment.production.example.ts`)
 */
import type { AdminEnvironment } from './environment.model';

export const environment: AdminEnvironment = {
  firebase: {
    apiKey: 'PLACEHOLDER',
    authDomain: 'PLACEHOLDER',
    projectId: 'PLACEHOLDER',
    appId: 'PLACEHOLDER',
  },
  apiBaseUrl: 'http://localhost:3000/api/v1',
};
