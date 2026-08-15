import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import type { Auth } from 'firebase-admin/auth';

interface TestRequest {
  headers?: { authorization?: string };
  user?: unknown;
}

function makeContext(request: TestRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('FirebaseAuthGuard', () => {
  const mockAuth = { verifyIdToken: jest.fn() } as unknown as Auth;
  let guard: FirebaseAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new FirebaseAuthGuard(mockAuth);
  });

  it('allows the request and populates request.user when the token is valid', async () => {
    const decoded = { uid: 'abc', role: 'admin', email: 'a@b.cl' };
    (mockAuth.verifyIdToken as jest.Mock).mockResolvedValue(decoded);
    const request: TestRequest = { headers: { authorization: 'Bearer valid-token' } };

    const result = await guard.canActivate(makeContext(request));

    expect(result).toBe(true);
    expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
    expect(request.user).toEqual(decoded);
  });

  it('throws UnauthorizedException when the authorization header is missing', async () => {
    const request: TestRequest = { headers: {} };
    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when the token is invalid', async () => {
    (mockAuth.verifyIdToken as jest.Mock).mockRejectedValue(new Error('invalid'));
    const request: TestRequest = { headers: { authorization: 'Bearer bad' } };
    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
