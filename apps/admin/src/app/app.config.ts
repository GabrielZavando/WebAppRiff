import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideQuillConfig } from 'ngx-quill/config';
import { appRoutes } from './app.routes';
import { authInterceptor } from '../shared/api/auth.interceptor';

/**
 * Quill formats that match the backend sanitizer allowlist
 * (`@riff/html-sanitize` ALLOWED_TAGS). Keeping the toolbar inside this set
 * prevents the editor from producing markup that the backend would strip.
 */
export const QUILL_ALLOWED_FORMATS = [
  'bold',
  'italic',
  'underline',
  'header',
  'list',
  'blockquote',
  'link',
] as const;

export const QUILL_TOOLBAR = [
  ['bold', 'italic', 'underline'],
  [{ header: [2, 3, 4, false] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'link'],
  ['clean'],
];

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
    provideQuillConfig({
      theme: 'snow',
      modules: { toolbar: QUILL_TOOLBAR },
      formats: [...QUILL_ALLOWED_FORMATS],
    }),
  ],
};
