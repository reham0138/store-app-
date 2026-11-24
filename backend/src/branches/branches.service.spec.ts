import { ConflictException, NotFoundException } from '@nestjs/common';
import { BranchesService } from './branches.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';

describe('BranchesService', () => {
  it('normalizes branch codes before creating branches', async () => {
    const branchModel = {
      create: vi.fn().mockResolvedValue({ code: 'north' }),
    };
    const service = new BranchesService(branchModel as never);
    const dto = Object.assign(new CreateBranchDto(), {
      name: 'North Branch',
      code: 'NORTH',
    });

    await service.create(dto);

    expect(branchModel.create).toHaveBeenCalledWith({
      name: 'North Branch',
      code: 'north',
      address: undefined,
      latitude: undefined,
      longitude: undefined,
    });
  });

  it('stores branch coordinates for nearest-location selection', async () => {
    const branchModel = {
      create: vi.fn().mockResolvedValue({ code: 'dam' }),
    };
    const service = new BranchesService(branchModel as never);
    const dto = Object.assign(new CreateBranchDto(), {
      name: 'Damascus',
      code: 'DAM',
      latitude: 33.5138,
      longitude: 36.2765,
    });

    await service.create(dto);

    expect(branchModel.create).toHaveBeenCalledWith({
      name: 'Damascus',
      code: 'dam',
      address: undefined,
      latitude: 33.5138,
      longitude: 36.2765,
    });
  });

  it('reports duplicate branch codes as a conflict', async () => {
    const branchModel = {
      create: vi.fn().mockRejectedValue({ code: 11000 }),
    };
    const service = new BranchesService(branchModel as never);
    const dto = Object.assign(new CreateBranchDto(), {
      name: 'North Branch',
      code: 'north',
    });

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('BranchesService additional tests', () => {
  const branch = {
    _id: 'branch123',
    name: 'North Branch',
    code: 'north',
    address: 'Test Street',
    isActive: true,
  };

  const createQuery = (result: any) => ({
    sort: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(result),
  });

  it('should return active branches only by default', async () => {
    const query = createQuery([branch]);
    const branchModel = {
      find: vi.fn().mockReturnValue(query),
    };

    const service = new BranchesService(branchModel as never);
    const result = await service.findAll();

    expect(branchModel.find).toHaveBeenCalledWith({
      isActive: { $ne: false },
    });
    expect(result).toEqual([branch]);
  });

  it('should include inactive branches when requested', async () => {
    const query = createQuery([branch]);
    const branchModel = {
      find: vi.fn().mockReturnValue(query),
    };

    const service = new BranchesService(branchModel as never);
    await service.findAll(true);

    expect(branchModel.find).toHaveBeenCalledWith({});
  });

  it('should find a branch by ID', async () => {
    const branchModel = {
      findById: vi.fn().mockReturnValue(createQuery(branch)),
    };

    const service = new BranchesService(branchModel as never);
    const result = await service.findOne('branch123');

    expect(result).toEqual(branch);
  });

  it('should throw when branch is not found', async () => {
    const branchModel = {
      findById: vi.fn().mockReturnValue(createQuery(null)),
    };

    const service = new BranchesService(branchModel as never);

    await expect(service.findOne('unknown'))
      .rejects.toThrow(NotFoundException);
  });

  it('should update a branch and normalize its code', async () => {
    const branchModel = {
      findByIdAndUpdate: vi.fn().mockReturnValue(createQuery(branch)),
    };

    const service = new BranchesService(branchModel as never);

    await service.update('branch123', {
      name: 'Updated Branch',
      code: 'UPDATED',
      latitude: 33.5138,
      longitude: 36.2765,
    });

    expect(branchModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'branch123',
      {
        name: 'Updated Branch',
        code: 'updated',
        latitude: 33.5138,
        longitude: 36.2765,
      },
      { new: true, runValidators: true },
    );
  });

  it('should throw when updating a missing branch', async () => {
    const branchModel = {
      findByIdAndUpdate: vi.fn().mockReturnValue(createQuery(null)),
    };

    const service = new BranchesService(branchModel as never);

    await expect(
      service.update('unknown', { name: 'Updated Branch' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should reject duplicate codes during update', async () => {
    const branchModel = {
      findByIdAndUpdate: vi.fn().mockReturnValue({
        exec: vi.fn().mockRejectedValue({ code: 11000 }),
      }),
    };

    const service = new BranchesService(branchModel as never);

    await expect(
      service.update('branch123', { code: 'EXISTING' }),
    ).rejects.toThrow(ConflictException);
  });

  it('should confirm an active branch exists', async () => {
    const query = createQuery({ _id: 'branch123' });
    const branchModel = {
      findOne: vi.fn().mockReturnValue(query),
    };

    const service = new BranchesService(branchModel as never);

    await expect(service.assertActive('branch123'))
      .resolves.toBeUndefined();

    expect(branchModel.findOne).toHaveBeenCalledWith({
      _id: 'branch123',
      isActive: { $ne: false },
    });
  });

  it('should reject an inactive or missing branch', async () => {
    const branchModel = {
      findOne: vi.fn().mockReturnValue(createQuery(null)),
    };

    const service = new BranchesService(branchModel as never);

    await expect(service.assertActive('branch123'))
      .rejects.toThrow(NotFoundException);
  });

  it('should confirm a branch exists', async () => {
    const branchModel = {
      exists: vi.fn().mockResolvedValue({ _id: 'branch123' }),
    };

    const service = new BranchesService(branchModel as never);

    await expect(service.assertExists('branch123'))
      .resolves.toBeUndefined();
  });

  it('should reject a branch that does not exist', async () => {
    const branchModel = {
      exists: vi.fn().mockResolvedValue(null),
    };

    const service = new BranchesService(branchModel as never);

    await expect(service.assertExists('unknown'))
      .rejects.toThrow(NotFoundException);
  });
});

