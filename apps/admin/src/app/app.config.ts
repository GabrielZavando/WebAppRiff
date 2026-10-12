import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { authInterceptor } from '../shared/api/auth.interceptor';

/**
 * Root application config (change `admin-panel-foundation`).
 *
 * - Router with the base route table (`app.routes.ts`).
 * - HttpClient with the auth interceptor chain (Bearer token + 401 handling).
 * - Firebase client (SDK puro, design D2): FIREBASE_APP/FIREBASE_AUTH tokens
 *   are `providedIn: 'root'` (see `features/auth/firebase.tokens.ts`) and are
 *   consumed by `AuthService`; they do not need explicit provider entries.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
