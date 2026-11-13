import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service.js';
import { Types } from 'mongoose';
import { OrderQueryDto } from './dto/order-query.dto.js';

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('scopes staff order listings to the requested branch', async () => {
    const branchId = '507f1f77bcf86cd799439011';
    const findQuery = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    };
    const orderModel = {
      find: vi.fn().mockReturnValue(findQuery),
      countDocuments: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(0),
      }),
    };
    const branchesService = {
      assertExists: vi.fn().mockResolvedValue(undefined),
    };
    const scopedService = new OrdersService(
      orderModel as never,
      null,
      null,
      branchesService as never,
      null,
    );

    await scopedService.findAll(
      Object.assign(new OrderQueryDto(), { branchId }),
    );

    expect(orderModel.find).toHaveBeenCalledWith({
      branchId: new Types.ObjectId(branchId),
    });
    expect(branchesService.assertExists).toHaveBeenCalledWith(branchId);
  });
});
