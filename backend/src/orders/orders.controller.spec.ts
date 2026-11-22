
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

describe('OrdersController', () => {
  const orderId = '507f1f77bcf86cd799439011';
  const branchId = '507f1f77bcf86cd799439012';
  const customerId = '507f1f77bcf86cd799439013';

  let controller: OrdersController;
  let ordersService: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    ordersService = {
      create: vi.fn().mockResolvedValue({ _id: orderId }),
      findAll: vi.fn().mockResolvedValue({ data: [], meta: {} }),
      findOne: vi.fn().mockResolvedValue({ _id: orderId }),
      updateStatus: vi.fn().mockResolvedValue({ _id: orderId }),
    };

    controller = new OrdersController(
      ordersService as unknown as OrdersService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an order using the authenticated customer identity', async () => {
    const dto = {
      branchId,
      items: [{ productId: orderId, quantity: 2 }],
    };

    const req = {
      user: {
        sub: customerId,
        email: 'CUSTOMER@example.com',
      },
    };

    await controller.create(dto as any, req as any);

    expect(ordersService.create).toHaveBeenCalledWith(dto, {
      sub: customerId,
      email: 'CUSTOMER@example.com',
    });
  });

  it('should return orders for the authenticated user', async () => {
    const query = { page: 1, limit: 10 };
    const req = {
      role: 'customer',
      user: { sub: customerId },
    };

    await controller.findAll(query as any, req as any);

    expect(ordersService.findAll).toHaveBeenCalledWith(
      query,
      'customer',
      req.user,
    );
  });

  it('should return a specific order', async () => {
    const query = { branchId };
    const req = {
      role: 'admin',
      user: { sub: customerId },
    };

    await controller.findOne(orderId, query as any, req as any);

    expect(ordersService.findOne).toHaveBeenCalledWith(
      orderId,
      'admin',
      req.user,
      branchId,
    );
  });

  it('should use the manager own branch when updating order status', async () => {
    const body = {
      status: 'shipped',
      branchId: '507f1f77bcf86cd799439099',
    };

    const req = {
      role: 'branchManager',
      user: { branchId },
    };

    await controller.updateStatus(orderId, body as any, req as any);

    expect(ordersService.updateStatus).toHaveBeenCalledWith(
      orderId,
      'shipped',
      branchId,
      'branchManager',
    );
  });

  it('should use the selected branch when admin updates order status', async () => {
    const body = {
      status: 'shipped',
      branchId,
    };

    const req = {
      role: 'admin',
      user: { sub: customerId },
    };

    await controller.updateStatus(orderId, body as any, req as any);

    expect(ordersService.updateStatus).toHaveBeenCalledWith(
      orderId,
      'shipped',
      branchId,
      'admin',
    );
  });

  it('should return the service result when creating an order', async () => {
    const result = await controller.create(
      {} as any,
      {
        user: {
          sub: customerId,
          email: 'customer@example.com',
        },
      } as any,
    );

    expect(result).toEqual({ _id: orderId });
  });
});
