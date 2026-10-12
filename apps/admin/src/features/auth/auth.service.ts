import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  type Auth,
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { firstValueFrom } from 'rxjs';
import { ApiClientService } from '../../shared/api/api-client.service';
import { environment } from '../../environments/environment';
import { LOGIN_PATH, POST_LOGIN_REDIRECT } from '../../app/app-navigation';
import { FIREBASE_AUTH } from './firebase.tokens';
import { AdminUserProfile } from './auth.models';

/**
 * Session service (task 2.1 / spec `admin-auth`, design D2).
 *
 * Wraps the Firebase JS SDK (no @angular/fire — see design D2) and exposes
 * session state as signals: `currentUser` (profile from `GET /auth/me`),
 * `isAuthenticated` (Firebase session), `isInitializing` (restoration in
 * flight). The role of the user lives on the profile and feeds RoleService.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth: Auth = inject(FIREBASE_AUTH);
  private readonly api = inject(ApiClientService);
  private readonly router = inject(Router);

  private readonly firebaseUser = signal<User | null>(null);
  private readonly profile = signal<AdminUserProfile | null>(null);
  private readonly initializing = signal<boolean>(true);

  /** Profile loaded from `GET /api/v1/auth/me` (null while unknown). */
  readonly currentUser = this.profile.asReadonly();
  /** True once Firebase reports a session (independent of profile load). */
  readonly isAuthenticated = computed(() => this.firebaseUser() !== null);
  /** True while the initial auth state has not been resolved yet. */
  readonly isInitializing = this.initializing.asReadonly();

  /**
   * Resolves once the first `onAuthStateChanged` event fully settled — i.e.
   * the SDK restored (or ruled out) the persisted session after a page
   * reload AND the profile load completed.
   *
   * Route guards MUST await this before deciding: the initial Angular
   * navigation runs synchronously during bootstrap, while the SDK restores
   * the session asynchronously from indexedDB — deciding with the
   * pre-restore state kicks a signed-in user back to /login (the reload bug).
   * Fail-closed by design: if the SDK never fires, navigation stays pending.
   */
  readonly ready: Promise<void> = new Promise<void>((resolve) => {
    this.resolveReady = resolve;
  });

  private resolveReady!: () => void;

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.handleAuthState(user);
    });
  }

  /**
   * Authenticates with Firebase (email/password), loads the profile and
   * navigates to the intercepted `returnUrl` or `POST_LOGIN_REDIRECT`.
   * Failures propagate so the login page can render its error message.
   */
  async login(email: string, password: string): Promise<void> {
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    this.firebaseUser.set(credential.user);

    const profile = await firstValueFrom(this.api.get<AdminUserProfile>('auth/me'));
    this.profile.set(profile);

    const returnUrl = this.router.routerState.snapshot.root.queryParamMap.get('returnUrl');
    await this.router.navigateByUrl(returnUrl ?? POST_LOGIN_REDIRECT);
  }

  /** Signs out, clears local state and returns to the login screen. */
  async logout(): Promise<void> {
    await signOut(this.auth);
    this.firebaseUser.set(null);
    this.profile.set(null);
    await this.router.navigate([LOGIN_PATH]);
  }

  /**
   * Current Firebase ID token (auto-refreshed by the SDK), or `null` without
   * a session. Used by the HTTP interceptor for backend calls.
   */
  async getIdToken(): Promise<string | null> {
    const user = this.auth.currentUser ?? this.firebaseUser();
    return user === null ? null : user.getIdToken();
  }

  private handleAuthState(user: User | null): void {
    this.firebaseUser.set(user);
    if (user === null) {
      this.profile.set(null);
      this.initializing.set(false);
      this.resolveReady();
      return;
    }
    firstValueFrom(this.api.get<AdminUserProfile>('auth/me'))
      .then((profile) => this.profile.set(profile))
      .catch(() => this.profile.set(null))
      .finally(() => {
        this.initializing.set(false);
        this.resolveReady();
      });
  }
}

/** Convenience re-export for the interceptor URL check. */
export const API_BASE_URL = environment.apiBaseUrl;
