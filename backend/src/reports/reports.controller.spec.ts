
import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { vi } from 'vitest';

describe('ReportsController', () => {
  let controller: ReportsController;

  const reportsService = {
    getOverview: vi.fn(),
    getLowStock: vi.fn(),
    getTopSellingProducts: vi.fn(),
    getDailySales: vi.fn(),
    getSalesByCategory: vi.fn(),
    getRecentOrders: vi.fn(),
  };

  const managerRequest = {
    role: 'branchManager',
    user: { branchId: 'manager-branch' },
  };

  const adminRequest = {
    role: 'admin',
    user: { role: 'admin' },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: reportsService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get overview for manager own branch', async () => {
    reportsService.getOverview.mockResolvedValue({ totalOrders: 5 });

    await expect(
      controller.getOverview('other-branch', managerRequest as any),
    ).resolves.toEqual({ totalOrders: 5 });

    expect(reportsService.getOverview).toHaveBeenCalledWith(
      'manager-branch',
    );
  });

  it('should get overview for admin selected branch', async () => {
    reportsService.getOverview.mockResolvedValue({ totalOrders: 10 });

    await controller.getOverview('selected-branch', adminRequest as any);

    expect(reportsService.getOverview).toHaveBeenCalledWith(
      'selected-branch',
    );
  });

  it('should get low stock for manager own branch', () => {
    controller.getLowStock('other-branch', managerRequest as any);

    expect(reportsService.getLowStock).toHaveBeenCalledWith(
      'manager-branch',
    );
  });

  it('should get top selling products for manager own branch', () => {
    controller.getTopSellingProducts(
      'other-branch',
      managerRequest as any,
    );

    expect(reportsService.getTopSellingProducts).toHaveBeenCalledWith(
      'manager-branch',
    );
  });

  it('should get daily sales for admin selected branch', () => {
    controller.getDailySales('selected-branch', adminRequest as any);

    expect(reportsService.getDailySales).toHaveBeenCalledWith(
      'selected-branch',
    );
  });

  it('should get sales by category for manager own branch', () => {
    controller.getSalesByCategory(
      'other-branch',
      managerRequest as any,
    );

    expect(reportsService.getSalesByCategory).toHaveBeenCalledWith(
      'manager-branch',
    );
  });

  it('should get recent orders for manager own branch', async () => {
    reportsService.getRecentOrders.mockResolvedValue([]);

    await controller.getRecentOrders(
      { ...managerRequest, user: { ...managerRequest.user, role: 'branchManager' } },
      'other-branch',
    );

    expect(reportsService.getRecentOrders).toHaveBeenCalledWith(
      'manager-branch',
    );
  });

  it('should get recent orders for admin selected branch', async () => {
    reportsService.getRecentOrders.mockResolvedValue([]);

    await controller.getRecentOrders(adminRequest, 'selected-branch');

    expect(reportsService.getRecentOrders).toHaveBeenCalledWith(
      'selected-branch',
    );
  });
});
