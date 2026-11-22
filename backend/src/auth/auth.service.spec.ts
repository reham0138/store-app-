
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let authService: AuthService;

  const usersService = {
    findByEmail: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
  };

  const jwtService = {
    signAsync: vi.fn(),
  };

  const user = {
    _id: { toString: () => 'user123' },
    name: 'Test Customer',
    email: 'customer.test@example.com',
    passwordHash: '$2a$10$exampleHash',
    role: 'customer',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    authService = new AuthService(
      usersService as any,
      jwtService as any,
    );

    jwtService.signAsync.mockResolvedValue('test-access-token');
  });

  it('should register a new customer', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(user);

    const result = await authService.register({
      name: 'Test Customer',
      email: 'customer.test@example.com',
      password: 'Test123456',
    });

    expect(usersService.create).toHaveBeenCalled();
    expect(result.accessToken).toBe('test-access-token');
    expect(result.user.role).toBe('customer');
  });

  it('should reject registration with an existing email', async () => {
    usersService.findByEmail.mockResolvedValue(user);

    await expect(
      authService.register({
        name: 'Test Customer',
        email: 'customer.test@example.com',
        password: 'Test123456',
      }),
    ).rejects.toThrow(ConflictException);

    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('should login with correct credentials', async () => {
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash('Test123456', 10);

    usersService.findByEmail.mockResolvedValue({
      ...user,
      passwordHash,
    });

    const result = await authService.Login({
      email: 'customer.test@example.com',
      password: 'Test123456',
    });

    expect(result.accessToken).toBe('test-access-token');
    expect(result.user.email).toBe('customer.test@example.com');
  });

  it('should reject an incorrect password', async () => {
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash('Test123456', 10);

    usersService.findByEmail.mockResolvedValue({
      ...user,
      passwordHash,
    });

    await expect(
      authService.Login({
        email: 'customer.test@example.com',
        password: 'WrongPassword123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject an unknown email', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.Login({
        email: 'unknown@example.com',
        password: 'Test123456',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
