
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { BranchesController } from './branches.controller.js';
import { BranchesService } from './branches.service.js';
import { vi } from 'vitest';

describe('BranchesController', () => {
  let controller: BranchesController;

  const branchesService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchesController],
      providers: [
        {
          provide: BranchesService,
          useValue: branchesService,
        },
      ],
    }).compile();

    controller = module.get<BranchesController>(BranchesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all branches for admin', async () => {
    const result = [{ name: 'Main Branch' }];
    branchesService.findAll.mockResolvedValue(result);

    await expect(
      controller.findAll({ includeInactive: 'false' } as any, {
        role: 'admin',
      } as any),
    ).resolves.toEqual(result);

    expect(branchesService.findAll).toHaveBeenCalledWith(false);
  });

  it('should include inactive branches when requested', async () => {
    branchesService.findAll.mockResolvedValue([]);

    await controller.findAll(
      { includeInactive: 'true' } as any,
      { role: 'admin' } as any,
    );

    expect(branchesService.findAll).toHaveBeenCalledWith(true);
  });

  it('should return manager own branch', async () => {
    const result = { _id: '123', name: 'Main Branch' };
    branchesService.findOne.mockResolvedValue(result);

    await expect(
      controller.findAll({} as any, {
        role: 'branchManager',
        user: { branchId: '123' },
      } as any),
    ).resolves.toEqual(result);

    expect(branchesService.findOne).toHaveBeenCalledWith('123');
  });

  it('should return a branch by id for admin', async () => {
    const result = { _id: '123', name: 'Main Branch' };
    branchesService.findOne.mockResolvedValue(result);

    await expect(
      controller.findOne('123', { role: 'admin' } as any),
    ).resolves.toEqual(result);

    expect(branchesService.findOne).toHaveBeenCalledWith('123');
  });

  it('should allow manager to access own branch', async () => {
    const result = { _id: '123', name: 'Main Branch' };
    branchesService.findOne.mockResolvedValue(result);

    await expect(
      controller.findOne('123', {
        role: 'branchManager',
        user: { branchId: '123' },
      } as any),
    ).resolves.toEqual(result);
  });

  it('should reject manager access to another branch', () => {
    expect(() =>
      controller.findOne('456', {
        role: 'branchManager',
        user: { branchId: '123' },
      } as any),
    ).toThrow(ForbiddenException);

    expect(branchesService.findOne).not.toHaveBeenCalled();
  });

  it('should create a branch', async () => {
    const dto = { name: 'New Branch' };
    const result = { _id: '123', ...dto };
    branchesService.create.mockResolvedValue(result);

    await expect(controller.create(dto as any)).resolves.toEqual(result);
    expect(branchesService.create).toHaveBeenCalledWith(dto);
  });

  it('should update a branch', async () => {
    const dto = { name: 'Updated Branch' };
    const result = { _id: '123', ...dto };
    branchesService.update.mockResolvedValue(result);

    await expect(
      controller.update('123', dto as any),
    ).resolves.toEqual(result);

    expect(branchesService.update).toHaveBeenCalledWith('123', dto);
  });
});
