import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ReportsService } from './reports.service.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles('admin', 'branchManager')
  @Get('overview')
  getOverview(
    @Query('branchId') branchId: string,
    @Req() req: Request & {
      role?: string;
      user?: { branchId?: string };
    },
  ) {
    const selectedBranchId =
      req.role === 'branchManager'
        ? req.user?.branchId
        : branchId;

    return this.reportsService.getOverview(selectedBranchId);
  }
  @Roles('admin', 'branchManager')
@Get('low-stock')
getLowStock(
  @Query('branchId') branchId: string,
  @Req() req: Request & {
    role?: string;
    user?: { branchId?: string };
  },
) {
  const selectedBranchId =
    req.role === 'branchManager'
      ? req.user?.branchId
      : branchId;

  return this.reportsService.getLowStock(selectedBranchId);
}
@Roles('admin', 'branchManager')
@Get('top-selling')
getTopSellingProducts(
  @Query('branchId') branchId: string,
  @Req() req: Request & {
    role?: string;
    user?: { branchId?: string };
  },
) {
  const selectedBranchId =
    req.role === 'branchManager'
      ? req.user?.branchId
      : branchId;

  return this.reportsService.getTopSellingProducts(selectedBranchId);
}
@Roles('admin', 'branchManager')
@Get('daily-sales')
getDailySales(
  @Query('branchId') branchId: string,
  @Req() req: Request & {
    role?: string;
    user?: { branchId?: string };
  },
) {
  const selectedBranchId =
    req.role === 'branchManager'
      ? req.user?.branchId
      : branchId;

  return this.reportsService.getDailySales(selectedBranchId);
}
@Roles('admin', 'branchManager')
@Get('sales-by-category')
getSalesByCategory(
  @Query('branchId') branchId: string,
  @Req() req: Request & {
    role?: string;
    user?: { branchId?: string };
  },
) {
  const selectedBranchId =
    req.role === 'branchManager'
      ? req.user?.branchId
      : branchId;

  return this.reportsService.getSalesByCategory(selectedBranchId);
}
@Get('recent-orders')
@Roles('admin', 'branchManager')
async getRecentOrders(
  @Req() req: any,
  @Query('branchId') branchId?: string,
) {
 const targetBranchId =
  req.role === 'branchManager'
    ? req.user?.branchId
    : branchId;

  return this.reportsService.getRecentOrders(targetBranchId);
}
}