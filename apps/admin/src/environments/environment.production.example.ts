/**
 * EXAMPLE of the production environment file (task 1.1 / design D3).
 *
 * `environment.production.ts` is gitignored and generated during the build
 * pipeline from environment variables:
 *
 *   npm run env:write --workspace=apps/admin
 *     FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID,
 *     FIREBASE_APP_ID, API_BASE_URL
 *
 * Never commit `environment.production.ts` with real values.
 */
import type { AdminEnvironment } from './environment.model';

export const environment: AdminEnvironment = {
  firebase: {
    apiKey: 'your-production-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project',
    appId: '1:000000000000:web:yourappid',
  },
  apiBaseUrl: 'https://your-backend-run-url/api/v1',
};
