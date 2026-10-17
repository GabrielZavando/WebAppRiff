import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import { sendPasswordResetEmail } from 'firebase/auth';

import { FIREBASE_AUTH } from '../auth/firebase.tokens';

/**
 * Invitation flow (task 4.3 / design D3, D9): after the backend creates the
 * Firebase Auth user (without a password), the panel triggers the Firebase
 * built-in password reset email so the invited user defines their own
 * password. The continue URL lands back on the admin login page — its domain
 * must be whitelisted in Firebase Console (Authentication → Authorized
 * domains). Resending the invitation is the same call (design D9); delivery
 * failures surface to the caller for banner mapping (design D11).
 */
@Injectable({ providedIn: 'root' })
export class UsersInvitationService {
  private readonly auth = inject(FIREBASE_AUTH);

  sendInvitation(email: string): Observable<void> {
    return this.dispatch(email);
  }

  resendInvitation(email: string): Observable<void> {
    return this.dispatch(email);
  }

  /** `defer` keeps each subscription a fresh SDK call (retries, tests). */
  private dispatch(email: string): Observable<void> {
    return from(
      sendPasswordResetEmail(this.auth, email, {
        url: `${window.location.origin}/login`,
      }),
    );
  }
}
