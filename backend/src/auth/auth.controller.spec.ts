
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { vi } from 'vitest';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    register: vi.fn(),
    Login: vi.fn(),
    getMe: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a user', async () => {
    const dto = {
      name: 'John',
      email: 'john@example.com',
      password: 'password123',
    };
    const result = { accessToken: 'token' };

    authService.register.mockResolvedValue(result);

    await expect(controller.register(dto as any)).resolves.toEqual(result);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('should login a user', async () => {
    const dto = {
      email: 'john@example.com',
      password: 'password123',
    };
    const result = { accessToken: 'token' };

    authService.Login.mockResolvedValue(result);

    await expect(controller.login(dto as any)).resolves.toEqual(result);
    expect(authService.Login).toHaveBeenCalledWith(dto);
  });

  it('should return current user details', async () => {
    const result = {
      id: 'user-id',
      email: 'john@example.com',
    };

    authService.getMe.mockResolvedValue(result);

    await expect(
      controller.getMe({ user: { sub: 'user-id' } }),
    ).resolves.toEqual(result);

    expect(authService.getMe).toHaveBeenCalledWith('user-id');
  });

  it('should reject getMe when user is not authenticated', async () => {
    await expect(controller.getMe({})).rejects.toThrow(
      UnauthorizedException,
    );

    expect(authService.getMe).not.toHaveBeenCalled();
  });
});
