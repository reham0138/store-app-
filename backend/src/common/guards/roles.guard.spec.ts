
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let requiredRoles: string[] | undefined;

  const reflector = {
    getAllAndOverride: vi.fn(),
  };

  const config = {
    get: vi.fn(),
  };

  const jwtService = {
    verifyAsync: vi.fn(),
  };

  const createContext = (headers = {}) => {
    const req: any = { headers };

    return {
      req,
      context: {
        switchToHttp: () => ({
          getRequest: () => req,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as any,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    requiredRoles = undefined;
    reflector.getAllAndOverride.mockImplementation(
      () => requiredRoles,
    );

    guard = new RolesGuard(
      reflector as any,
      config as any,
      jwtService as any,
    );
  });

  it('should allow public routes', async () => {
    const { context } = createContext();

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should reject unauthenticated protected requests', async () => {
    requiredRoles = ['admin'];
    const { context } = createContext();

    await expect(guard.canActivate(context))
      .rejects.toThrow(UnauthorizedException);
  });

  it('should allow a customer on customer routes', async () => {
    requiredRoles = ['customer'];
    jwtService.verifyAsync.mockResolvedValue({ role: 'customer' });

    const { context } = createContext({
      authorization: 'Bearer valid-token',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should reject a customer on admin routes', async () => {
    requiredRoles = ['admin'];
    jwtService.verifyAsync.mockResolvedValue({ role: 'customer' });

    const { context } = createContext({
      authorization: 'Bearer valid-token',
    });

    await expect(guard.canActivate(context))
      .rejects.toThrow(ForbiddenException);
  });

  it('should normalize staff role to branchManager', async () => {
    requiredRoles = ['branchManager'];
    jwtService.verifyAsync.mockResolvedValue({
      role: 'staff',
      branchId: 'branch123',
    });

    const { context, req } = createContext({
      authorization: 'Bearer valid-token',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.role).toBe('branchManager');
  });

  it('should reject staff without a branch', async () => {
    requiredRoles = ['branchManager'];
    jwtService.verifyAsync.mockResolvedValue({ role: 'staff' });

    const { context } = createContext({
      authorization: 'Bearer valid-token',
    });

    await expect(guard.canActivate(context))
      .rejects.toThrow(UnauthorizedException);
  });
});
