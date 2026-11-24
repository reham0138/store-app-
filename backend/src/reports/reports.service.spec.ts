
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { ReportsService } from './reports.service.js';

describe('ReportsService', () => {
  const branchId = '507f1f77bcf86cd799439011';

  const createService = () => {
    const orderModel = {
      countDocuments: vi.fn().mockResolvedValue(5),
      aggregate: vi.fn()
        .mockResolvedValueOnce([{ totalRevenue: 250 }])
        .mockResolvedValueOnce([
          { _id: 'paid', count: 3 },
          { _id: 'pending', count: 2 },
        ]),
      find: vi.fn(),
    };

    const inventoryQuery = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        { stock: 5, productId: 'product1' },
      ]),
    };

    const inventoryModel = {
      find: vi.fn().mockReturnValue(inventoryQuery),
    };

    const recentOrdersQuery = {
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        { total: 100, status: 'paid' },
      ]),
    };

    orderModel.find.mockReturnValue(recentOrdersQuery);

    const service = new ReportsService(
      orderModel as any,
      inventoryModel as any,
    );

    return {
      service,
      orderModel,
      inventoryModel,
      inventoryQuery,
      recentOrdersQuery,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    const { service } = createService();
    expect(service).toBeDefined();
  });

  it('should return overview statistics for a branch', async () => {
    const { service, orderModel } = createService();

    const result = await service.getOverview(branchId);

    expect(orderModel.countDocuments).toHaveBeenCalledWith({
      branchId: new Types.ObjectId(branchId),
    });

    expect(result.totalOrders).toBe(5);
    expect(result.totalRevenue).toBe(250);
    expect(result.ordersByStatus.paid).toBe(3);
    expect(result.ordersByStatus.pending).toBe(2);
  });

  it('should return low stock inventory for a branch', async () => {
    const {
      service,
      inventoryModel,
      inventoryQuery,
    } = createService();

    const result = await service.getLowStock(branchId);

    expect(inventoryModel.find).toHaveBeenCalledWith({
      stock: { $lte: 10 },
      branchId: new Types.ObjectId(branchId),
    });

    expect(inventoryQuery.populate).toHaveBeenCalledTimes(2);
    expect(inventoryQuery.sort).toHaveBeenCalledWith({ stock: 1 });
    expect(result).toHaveLength(1);
  });

  it('should omit low-stock inventory with a missing populated product', async () => {
    const { service, inventoryQuery } = createService();
    inventoryQuery.exec.mockResolvedValue([
      { stock: 5, productId: 'product1' },
      { stock: 0, productId: null },
    ]);

    await expect(service.getLowStock(branchId)).resolves.toEqual([
      { stock: 5, productId: 'product1' },
    ]);
  });

  it('should return top selling products', async () => {
    const { service, orderModel } = createService();

    const result = await service.getTopSellingProducts(branchId);

    const pipeline = orderModel.aggregate.mock.calls[0][0];

    expect(pipeline[0].$match.branchId).toEqual(
      new Types.ObjectId(branchId),
    );
    expect(pipeline[0].$match.status.$in).toEqual([
      'paid',
      'shipped',
      'delivered',
    ]);
    expect(pipeline).toContainEqual({ $limit: 10 });
    expect(result).toEqual([{ totalRevenue: 250 }]);
  });

  it('should return daily sales for a branch', async () => {
    const { service, orderModel } = createService();

    await service.getDailySales(branchId);

    const pipeline = orderModel.aggregate.mock.calls[0][0];

    expect(pipeline[0].$match.branchId).toEqual(
      new Types.ObjectId(branchId),
    );
    expect(pipeline.some((stage: any) => stage.$group)).toBe(true);
    expect(pipeline.some((stage: any) => stage.$sort)).toBe(true);
  });

  it('should return sales grouped by category', async () => {
    const { service, orderModel } = createService();

    await service.getSalesByCategory(branchId);

    const pipeline = orderModel.aggregate.mock.calls[0][0];

    expect(pipeline[0].$match.branchId).toEqual(
      new Types.ObjectId(branchId),
    );
    expect(pipeline.some((stage: any) => stage.$lookup)).toBe(true);
    expect(pipeline.some((stage: any) => stage.$group)).toBe(true);
  });

  it('should return the latest 10 orders for a branch', async () => {
    const {
      service,
      orderModel,
      recentOrdersQuery,
    } = createService();

    const result = await service.getRecentOrders(branchId);

    expect(orderModel.find).toHaveBeenCalledWith({
      branchId: new Types.ObjectId(branchId),
    });
    expect(recentOrdersQuery.limit).toHaveBeenCalledWith(10);
    expect(recentOrdersQuery.sort).toHaveBeenCalledWith({
      createdAt: -1,
    });
    expect(result).toHaveLength(1);
  });

  it('should return overview without a branch filter for admin', async () => {
    const { service, orderModel } = createService();

    await service.getOverview();

    expect(orderModel.countDocuments).toHaveBeenCalledWith({});
  });
});
