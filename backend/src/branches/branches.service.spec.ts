import { ConflictException } from '@nestjs/common';
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
