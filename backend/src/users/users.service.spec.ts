
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let createdInstance: any;

  const savedUser = {
    _id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'customer',
  };

  const userModel: any = class {
    data: any;
    save: any;

    constructor(data: any) {
      this.data = data;
      this.save = vi.fn().mockResolvedValue(savedUser);
      createdInstance = this;
    }
  };

  const createQuery = () => ({
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    exec: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();

    userModel.findOne = vi.fn();
    userModel.findById = vi.fn();
    userModel.find = vi.fn();
    userModel.findOneAndUpdate = vi.fn();
    userModel.findOneAndDelete = vi.fn();

    createdInstance = null;
    service = new UsersService(userModel);
  });

  it('should find a user by email', async () => {
    userModel.findOne.mockResolvedValue(savedUser);

    const result = await service.findByEmail('TEST@example.com');

    expect(userModel.findOne).toHaveBeenCalledWith({
      email: 'test@example.com',
    });
    expect(result).toEqual(savedUser);
  });

  it('should find a user by ID', async () => {
    const query = createQuery();
    query.exec.mockResolvedValue(savedUser);
    userModel.findById.mockReturnValue(query);

    const result = await service.findById('user123');

    expect(userModel.findById).toHaveBeenCalledWith('user123');
    expect(result).toEqual(savedUser);
  });

  it('should create a new user', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      role: 'customer' as const,
    };

    const result = await service.create(userData);

    expect(createdInstance.data).toEqual(userData);
    expect(createdInstance.save).toHaveBeenCalled();
    expect(result).toEqual(savedUser);
  });

  it('should return staff without password hashes', async () => {
    const query = createQuery();
    query.exec.mockResolvedValue([savedUser]);
    userModel.find.mockReturnValue(query);

    const result = await service.findStaff();

    expect(userModel.find).toHaveBeenCalledWith({ role: 'staff' });
    expect(query.select).toHaveBeenCalledWith('-passwordHash');
    expect(query.sort).toHaveBeenCalledWith({ name: 1 });
    expect(result).toEqual([savedUser]);
  });

  it('should update a staff member', async () => {
    const query = createQuery();
    query.exec.mockResolvedValue(savedUser);
    userModel.findOneAndUpdate.mockReturnValue(query);

    const updateData = { name: 'Updated Name' };

    const result = await service.updateStaff('staff123', updateData);

    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'staff123', role: 'staff' },
      updateData,
      { new: true, runValidators: true },
    );
    expect(query.select).toHaveBeenCalledWith('-passwordHash');
    expect(result).toEqual(savedUser);
  });

  it('should throw when staff member is not found during update', async () => {
    const query = createQuery();
    query.exec.mockResolvedValue(null);
    userModel.findOneAndUpdate.mockReturnValue(query);

    await expect(
      service.updateStaff('unknown123', { name: 'Updated Name' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should delete a staff member', async () => {
    const query = createQuery();
    query.exec.mockResolvedValue(savedUser);
    userModel.findOneAndDelete.mockReturnValue(query);

    const result = await service.deleteStaff('staff123');

    expect(userModel.findOneAndDelete).toHaveBeenCalledWith({
      _id: 'staff123',
      role: 'staff',
    });
    expect(result).toEqual({
      message: 'Staff member deleted successfully',
    });
  });

  it('should throw when staff member is not found during deletion', async () => {
    const query = createQuery();
    query.exec.mockResolvedValue(null);
    userModel.findOneAndDelete.mockReturnValue(query);

    await expect(
      service.deleteStaff('unknown123'),
    ).rejects.toThrow(NotFoundException);
  });
});
