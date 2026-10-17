import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

const { sendPasswordResetEmailMock } = vi.hoisted(() => ({
  sendPasswordResetEmailMock: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'test' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ app: { options: {} } })),
  sendPasswordResetEmail: sendPasswordResetEmailMock,
}));

import { FIREBASE_AUTH } from '../auth/firebase.tokens';
import { UsersInvitationService } from './users-invitation.service';

/**
 * Invitation contract (task 4.3 / design D3, D9): the panel (not the backend)
 * triggers the Firebase built-in password reset email so the invited user
 * defines their own password, landing back on the admin login page.
 */
describe('UsersInvitationService', () => {
  let service: UsersInvitationService;
  let auth: unknown;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsersInvitationService);
    auth = TestBed.inject(FIREBASE_AUTH);
    sendPasswordResetEmailMock.mockReset();
    sendPasswordResetEmailMock.mockResolvedValue(undefined);
  });

  it('sends the password reset email with the admin login as the continue URL', async () => {
    await firstValueFrom(service.sendInvitation('ana@riff.cl'));

    expect(sendPasswordResetEmailMock).toHaveBeenCalledTimes(1);
    expect(sendPasswordResetEmailMock).toHaveBeenCalledWith(auth, 'ana@riff.cl', {
      url: `${window.location.origin}/login`,
    });
  });

  it('re-dispatches the same flow when resending the invitation (design D9)', async () => {
    await firstValueFrom(service.sendInvitation('ana@riff.cl'));
    await firstValueFrom(service.sendInvitation('ana@riff.cl'));

    expect(sendPasswordResetEmailMock).toHaveBeenCalledTimes(2);
  });

  it('surfaces the Firebase error to the caller (banner mapping happens upstream)', async () => {
    sendPasswordResetEmailMock.mockRejectedValue(new Error('auth/network-request-failed'));

    await expect(firstValueFrom(service.sendInvitation('ana@riff.cl'))).rejects.toThrow(
      'auth/network-request-failed',
    );
  });
});
