import { inject, InjectionToken } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { environment } from '../../environments/environment';

/**
 * Firebase client tokens (change `admin-panel-foundation`, design D2).
 *
 * The `firebase` JS SDK is used directly (no @angular/fire: its latest peer
 * range `^20.0.0` — next `^21.2.0` — does not support Angular 22). The app
 * instance is created once and shared; `AuthService` builds session state on
 * top of `FIREBASE_AUTH`. Token factories run inside the injection context,
 * so `inject()` is safe here.
 */
export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP', {
  providedIn: 'root',
  factory: () =>
    getApps().length > 0 ? getApp() : initializeApp(environment.firebase),
});

export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH', {
  providedIn: 'root',
  factory: () => getAuth(inject(FIREBASE_APP)),
});
