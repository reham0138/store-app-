
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { BranchesService } from '../branches/branches.service.js';
import { vi } from 'vitest';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
  },
  hash: vi.fn().mockResolvedValue('hashed-password'),
}));

describe('UsersController', () => {
  let controller: UsersController;

  const usersService = {
    findByEmail: vi.fn(),
    create: vi.fn(),
    findStaff: vi.fn(),
    updateStaff: vi.fn(),
    deleteStaff: vi.fn(),
  };

  const branchesService = {
    assertActive: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: BranchesService, useValue: branchesService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a staff member', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({
      _id: { toString: () => 'staff-id' },
      name: 'John',
      email: 'john@example.com',
      branchId: 'branch-id',
    });

    const dto = {
      name: 'John',
      email: ' JOHN@EXAMPLE.COM ',
      password: 'password123',
      branchId: 'branch-id',
    };

    const result = await controller.createStaff(dto as any);

    expect(branchesService.assertActive).toHaveBeenCalledWith('branch-id');
    expect(usersService.create).toHaveBeenCalledWith({
      name: 'John',
      email: 'john@example.com',
      passwordHash: 'hashed-password',
      role: 'staff',
      branchId: 'branch-id',
    });
    expect(result).toEqual({
      id: 'staff-id',
      name: 'John',
      email: 'john@example.com',
      role: 'branchManager',
      branchId: 'branch-id',
    });
  });

  it('should reject duplicate email when creating staff', async () => {
    usersService.findByEmail.mockResolvedValue({ _id: 'existing-id' });

    await expect(
      controller.createStaff({
        name: 'John',
        email: 'john@example.com',
        password: 'password123',
        branchId: 'branch-id',
      } as any),
    ).rejects.toThrow(ConflictException);

    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('should return all staff members', async () => {
    const result = [{ name: 'John', role: 'staff' }];
    usersService.findStaff.mockResolvedValue(result);

    await expect(controller.findStaff()).resolves.toEqual(result);
    expect(usersService.findStaff).toHaveBeenCalled();
  });

  it('should update staff details', async () => {
    const dto = { name: 'Updated Name' };
    const result = { _id: 'staff-id', name: 'Updated Name' };
    usersService.updateStaff.mockResolvedValue(result);

    await expect(
      controller.updateStaff('staff-id', dto as any),
    ).resolves.toEqual(result);

    expect(usersService.updateStaff).toHaveBeenCalledWith(
      'staff-id',
      { name: 'Updated Name' },
    );
  });

  it('should reject duplicate email when updating staff', async () => {
    usersService.findByEmail.mockResolvedValue({
      _id: { toString: () => 'another-id' },
    });

    await expect(
      controller.updateStaff('staff-id', {
        email: 'taken@example.com',
      } as any),
    ).rejects.toThrow(ConflictException);

    expect(usersService.updateStaff).not.toHaveBeenCalled();
  });

  it('should validate branch when updating staff branch', async () => {
    usersService.updateStaff.mockResolvedValue({ success: true });

    await controller.updateStaff('staff-id', {
      branchId: 'new-branch-id',
    } as any);

    expect(branchesService.assertActive).toHaveBeenCalledWith(
      'new-branch-id',
    );
    expect(usersService.updateStaff).toHaveBeenCalledWith(
      'staff-id',
      { branchId: 'new-branch-id' },
    );
  });

  it('should delete a staff member', async () => {
    usersService.deleteStaff.mockResolvedValue({ deleted: true });

    await expect(
      controller.deleteStaff('staff-id'),
    ).resolves.toEqual({ deleted: true });

    expect(usersService.deleteStaff).toHaveBeenCalledWith('staff-id');
  });
});
