import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

interface RoleRequest {
  user?: { role?: string };
}

function makeContext(request: RoleRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const mockReflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(mockReflector);
  });

  it('allows the request when the user role is among the required roles', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['superadmin', 'admin']);
    const result = guard.canActivate(makeContext({ user: { role: 'admin' } }));
    expect(result).toBe(true);
  });

  it('throws ForbiddenException when the user role is not allowed', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['superadmin']);
    expect(() => guard.canActivate(makeContext({ user: { role: 'editor' } }))).toThrow(
      ForbiddenException,
    );
  });

  it('throws ForbiddenException when the user has no role claim', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
    expect(() => guard.canActivate(makeContext({ user: {} }))).toThrow(ForbiddenException);
  });

  it('allows the request when no roles metadata is present (public route behind guard)', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const result = guard.canActivate(makeContext({ user: {} }));
    expect(result).toBe(true);
  });
});
