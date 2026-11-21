import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../orders/entities/order.entity.js';
import { Inventory } from '../inventory/entities/inventory.entity.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Order.name)
    @InjectModel(Inventory.name)
private readonly inventoryModel: Model<Inventory>,
    private readonly orderModel: Model<Order>,
  ) {}

  async getOverview(branchId?: string) {
    const filter: any = {};

    if (branchId) {
      filter.branchId = new Types.ObjectId(branchId);
    }

    const [totalOrders, revenueResult, statusResult] = await Promise.all([
      this.orderModel.countDocuments(filter),

      this.orderModel.aggregate([
        {
          $match: {
            ...filter,
            status: { $in: ['paid', 'shipped', 'delivered'] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
          },
        },
      ]),

      this.orderModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const ordersByStatus = {
      pending: 0,
      paid: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const item of statusResult) {
  const status = item._id as keyof typeof ordersByStatus;
  ordersByStatus[status] = item.count;
}

    return {
      totalOrders,
      totalRevenue: revenueResult[0]?.totalRevenue ?? 0,
      ordersByStatus,
    };
  }
  async getLowStock(branchId?: string) {
  const filter: any = {
    stock: { $lte: 10 },
  };

  if (branchId) {
    filter.branchId = new Types.ObjectId(branchId);
  }

  return this.inventoryModel
    .find(filter)
    .populate('productId', 'name sku price')
    .populate('branchId', 'name code')
    .sort({ stock: 1 })
    .exec();
}
async getTopSellingProducts(branchId?: string) {
  const match: any = {
    status: { $in: ['paid', 'shipped', 'delivered'] },
  };

  if (branchId) {
    match.branchId = new Types.ObjectId(branchId);
  }

  return this.orderModel.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: {
          $sum: {
            $multiply: ['$items.quantity', '$items.unitPrice'],
          },
        },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $project: {
        _id: 1,
        name: '$product.name',
        sku: '$product.sku',
        totalQuantity: 1,
        totalRevenue: 1,
      },
    },
  ]);
}
async getDailySales(branchId?: string) {
  const match: any = {
    status: { $in: ['paid', 'shipped', 'delivered'] },
  };

  if (branchId) {
    match.branchId = new Types.ObjectId(branchId);
  }

  return this.orderModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
          },
        },
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}
async getSalesByCategory(branchId?: string) {
  const match: any = {
    status: { $in: ['paid', 'shipped', 'delivered'] },
  };

  if (branchId) {
    match.branchId = new Types.ObjectId(branchId);
  }

  return this.orderModel.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$product.categoryId',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: {
          $sum: {
            $multiply: ['$items.quantity', '$items.unitPrice'],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $project: {
        _id: 1,
        categoryName: '$category.name',
        totalQuantity: 1,
        totalRevenue: 1,
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);
}
async getRecentOrders(branchId?: string) {
  const filter: any = {};

  if (branchId) {
    filter.branchId = new Types.ObjectId(branchId);
  }

  return this.orderModel
    .find(filter)
    .select('customerEmail total status createdAt branchId')
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('branchId', 'name code')
    .exec();
}
}