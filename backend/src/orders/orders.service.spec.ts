
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { OrdersService } from './orders.service.js';
import { OrderQueryDto } from './dto/order-query.dto.js';

describe('OrdersService', () => {
  const customerId = '507f1f77bcf86cd799439011';
  const branchId = '507f1f77bcf86cd799439012';
  const orderId = '507f1f77bcf86cd799439013';
  const productId = '507f1f77bcf86cd799439014';

  const createService = () => {
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
      findOne: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({ _id: orderId }),
      }),
    };

    const branchesService = {
      assertExists: vi.fn().mockResolvedValue(undefined),
    };

    const service = new OrdersService(
      orderModel as any,
      null,
      null,
      branchesService as any,
      null,
    );

    return { service, orderModel, branchesService, findQuery };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    const { service } = createService();
    expect(service).toBeDefined();
  });

  it('should scope customer orders to their own ID', async () => {
    const { service, orderModel } = createService();

    await service.findAll(
      new OrderQueryDto(),
      'customer',
      { sub: customerId },
    );

    expect(orderModel.find).toHaveBeenCalledWith({
      customerId: new Types.ObjectId(customerId),
    });
  });

  it('should scope branch manager orders to their branch', async () => {
    const { service, orderModel, branchesService } = createService();

    await service.findAll(
      new OrderQueryDto(),
      'branchManager',
      { sub: customerId, branchId },
    );

    expect(orderModel.find).toHaveBeenCalledWith({
      branchId: new Types.ObjectId(branchId),
    });
    expect(branchesService.assertExists).toHaveBeenCalledWith(branchId);
  });

  it('should allow admin to filter orders by branch', async () => {
    const { service, orderModel, branchesService } = createService();

    await service.findAll(
      Object.assign(new OrderQueryDto(), { branchId }),
      'admin',
    );

    expect(orderModel.find).toHaveBeenCalledWith({
      branchId: new Types.ObjectId(branchId),
    });
    expect(branchesService.assertExists).toHaveBeenCalledWith(branchId);
  });

  it('should reject customers without an identity', async () => {
    const { service } = createService();

    await expect(
      service.findAll(new OrderQueryDto(), 'customer'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject branch managers without a branch ID', async () => {
    const { service } = createService();

    await expect(
      service.findAll(
        new OrderQueryDto(),
        'branchManager',
        { sub: customerId },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject users with an unauthorized role', async () => {
    const { service } = createService();

    await expect(
      service.findAll(new OrderQueryDto(), 'visitor'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should scope customer order details to their own ID', async () => {
    const { service, orderModel } = createService();

    await service.findOne(
      orderId,
      'customer',
      { sub: customerId },
    );

    expect(orderModel.findOne).toHaveBeenCalledWith({
      _id: new Types.ObjectId(orderId),
      customerId: new Types.ObjectId(customerId),
    });
  });

  it('should scope branch manager order details to their branch', async () => {
    const { service, orderModel, branchesService } = createService();

    await service.findOne(
      orderId,
      'branchManager',
      { sub: customerId, branchId },
    );

    expect(orderModel.findOne).toHaveBeenCalledWith({
      _id: new Types.ObjectId(orderId),
      branchId: new Types.ObjectId(branchId),
    });
    expect(branchesService.assertExists).toHaveBeenCalledWith(branchId);
  });

  it('should reject unauthorized access to order details', async () => {
    const { service } = createService();

    await expect(
      service.findOne(orderId, 'visitor'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should create an order and deduct stock', async () => {
    const session = {
      withTransaction: vi.fn(async (callback: any) => callback()),
      endSession: vi.fn(),
    };

    const product = {
      _id: new Types.ObjectId(productId),
      name: 'Test Product',
      price: 12.5,
    };

    const createdOrder = {
      _id: orderId,
      total: 25,
      status: 'pending',
    };

    const productModel = {
      find: vi.fn().mockReturnValue({
        session: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([product]),
      }),
    };

    const inventoryModel = {
      find: vi.fn().mockReturnValue({
        session: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([
          {
            productId: product._id,
            stock: 10,
          },
        ]),
      }),
      updateOne: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      }),
    };

    const orderModel = {
      create: vi.fn().mockResolvedValue([createdOrder]),
    };

    const branchesService = {
      assertActive: vi.fn().mockResolvedValue(undefined),
    };

    const connection = {
      startSession: vi.fn().mockResolvedValue(session),
    };

    const service = new OrdersService(
      orderModel as any,
      productModel as any,
      inventoryModel as any,
      branchesService as any,
      connection as any,
    );

    const result = await service.create(
      {
        branchId,
        items: [{ productId, quantity: 2 }],
      } as any,
      {
        sub: customerId,
        email: 'CUSTOMER@example.com',
      },
    );

    expect(result).toEqual(createdOrder);
    expect(orderModel.create).toHaveBeenCalled();
    expect(inventoryModel.updateOne).toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });

  it('should reject order creation when stock is insufficient', async () => {
    const session = {
      withTransaction: vi.fn(async (callback: any) => callback()),
      endSession: vi.fn(),
    };

    const product = {
      _id: new Types.ObjectId(productId),
      name: 'Test Product',
      price: 20,
    };

    const productModel = {
      find: vi.fn().mockReturnValue({
        session: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([product]),
      }),
    };

    const inventoryModel = {
      find: vi.fn().mockReturnValue({
        session: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([
          {
            productId: product._id,
            stock: 0,
          },
        ]),
      }),
    };

    const orderModel = {
      create: vi.fn(),
    };

    const branchesService = {
      assertActive: vi.fn().mockResolvedValue(undefined),
    };

    const connection = {
      startSession: vi.fn().mockResolvedValue(session),
    };

    const service = new OrdersService(
      orderModel as any,
      productModel as any,
      inventoryModel as any,
      branchesService as any,
      connection as any,
    );

    await expect(
      service.create(
        {
          branchId,
          items: [{ productId, quantity: 2 }],
        } as any,
        { sub: customerId, email: 'customer@example.com' },
      ),
    ).rejects.toThrow(ConflictException);

    expect(orderModel.create).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });

  it('should reject invalid order statuses', async () => {
    const branchesService = {
      assertActive: vi.fn(),
    };

    const service = new OrdersService(
      {} as any,
      null,
      null,
      branchesService as any,
      null,
    );

    await expect(
      service.updateStatus(
        orderId,
        'invalid-status',
        branchId,
        'admin',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(branchesService.assertActive).not.toHaveBeenCalled();
  });

  it('should prevent branch managers from cancelling paid orders', async () => {
    const session = {
      withTransaction: vi.fn(async (callback: any) => callback()),
      endSession: vi.fn(),
    };

    const orderModel = {
      findOne: vi.fn().mockReturnValue({
        session: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue({
          _id: orderId,
          branchId,
          status: 'paid',
          items: [],
        }),
      }),
    };

    const branchesService = {
      assertActive: vi.fn().mockResolvedValue(undefined),
    };

    const connection = {
      startSession: vi.fn().mockResolvedValue(session),
    };

    const service = new OrdersService(
      orderModel as any,
      null,
      null,
      branchesService as any,
      connection as any,
    );

    await expect(
      service.updateStatus(
        orderId,
        'cancelled',
        branchId,
        'branchManager',
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(session.endSession).toHaveBeenCalled();
  });

  it('should allow a valid order status transition', async () => {
    const session = {
      withTransaction: vi.fn(async (callback: any) => callback()),
      endSession: vi.fn(),
    };

    const updatedOrder = {
      _id: orderId,
      status: 'paid',
    };

    const orderModel = {
      findOne: vi.fn().mockReturnValue({
        session: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue({
          _id: orderId,
          branchId,
          status: 'pending',
          items: [],
        }),
      }),
      findOneAndUpdate: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(updatedOrder),
      }),
    };

    const branchesService = {
      assertActive: vi.fn().mockResolvedValue(undefined),
    };

    const connection = {
      startSession: vi.fn().mockResolvedValue(session),
    };

    const service = new OrdersService(
      orderModel as any,
      null,
      null,
      branchesService as any,
      connection as any,
    );

    const result = await service.updateStatus(
      orderId,
      'paid',
      branchId,
      'branchManager',
    );

    expect(result).toEqual(updatedOrder);
    expect(orderModel.findOneAndUpdate).toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });

});
