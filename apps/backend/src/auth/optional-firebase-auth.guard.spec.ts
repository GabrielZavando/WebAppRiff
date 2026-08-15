import { ExecutionContext } from '@nestjs/common';
import { OptionalFirebaseAuthGuard } from './optional-firebase-auth.guard';

describe('OptionalFirebaseAuthGuard', () => {
  const auth = { verifyIdToken: jest.fn() };
  const guard = new OptionalFirebaseAuthGuard(auth as never);

  const buildContext = (header?: string) => {
    const request: { headers: { authorization?: string }; user?: unknown } = {
      headers: {},
    };
    if (header !== undefined) request.headers.authorization = header;
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { request, context };
  };

  beforeEach(() => jest.clearAllMocks());

  it('allows anonymous access when there is no header', async () => {
    const { request, context } = buildContext();
    expect(await guard.canActivate(context)).toBe(true);
    expect(request.user).toBeUndefined();
  });

  it('allows access with a malformed header', async () => {
    const { request, context } = buildContext('Token abc');
    expect(await guard.canActivate(context)).toBe(true);
    expect(auth.verifyIdToken).not.toHaveBeenCalled();
  });

  it('verifies a valid token and populates request.user', async () => {
    const decoded = { uid: 'u1', role: 'admin' };
    auth.verifyIdToken.mockResolvedValue(decoded as never);
    const { request, context } = buildContext('Bearer valid');
    expect(await guard.canActivate(context)).toBe(true);
    expect(auth.verifyIdToken).toHaveBeenCalledWith('valid');
    expect(request.user).toBe(decoded);
  });

  it('treats an invalid token as anonymous', async () => {
    auth.verifyIdToken.mockRejectedValue(new Error('invalid'));
    const { request, context } = buildContext('Bearer bad');
    expect(await guard.canActivate(context)).toBe(true);
    expect(request.user).toBeUndefined();
  });
});
