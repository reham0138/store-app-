import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Order, OrderDocument } from './entities/order.entity.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import {
  Product,
  ProductDocument,
} from '../products/entities/product.entity.js';
import { OrderQueryDto } from './dto/order-query.dto.js';
import {
  Inventory,
  InventoryDocument,
} from '../inventory/entities/inventory.entity.js';
import { BranchesService } from '../branches/branches.service.js';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['paid'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};
const ORDER_STATUSES = new Set([
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
]);
const DELIVERY_FEE = 10;

@Injectable()
export class OrdersService {
  constructor(
    @Optional()
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument> | null = null,
    @Optional()
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument> | null = null,
    @Optional()
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument> | null = null,
    @Optional()
    @Inject(BranchesService)
    private readonly branchesService: BranchesService | null = null,
    @Optional()
    @InjectConnection()
    private readonly connection: Connection | null = null,
  ) {}

  private getOrderModel() {
    if (!this.orderModel) throw new Error('Order model is not available');
    return this.orderModel;
  }

  private getProductModel() {
    if (!this.productModel) throw new Error('Product model is not available');
    return this.productModel;
  }

  private getConnection() {
    if (!this.connection)
      throw new Error('MongoDB connection is not available');
    return this.connection;
  }

  private getInventoryModel() {
    if (!this.inventoryModel)
      throw new Error('Inventory model is not available');
    return this.inventoryModel;
  }

  private getBranchesService() {
    if (!this.branchesService)
      throw new Error('Branches service is not available');
    return this.branchesService;
  }

  private roundMoney(amount: number) {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }

  async create(
    createOrderDto: CreateOrderDto,
    user: { sub: string; email: string },
  ) {
    await this.getBranchesService().assertActive(createOrderDto.branchId);
    const quantities = new Map<string, number>();
    for (const item of createOrderDto.items) {
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) + item.quantity,
      );
    }

    const session = await this.getConnection().startSession();
    let createdOrder: OrderDocument | undefined;

    try {
      await session.withTransaction(async () => {
        const requested = [...quantities.entries()];
        const productIds = requested.map(([id]) => new Types.ObjectId(id));
        const products = await this.getProductModel()
          .find({ _id: { $in: productIds }, isActive: { $ne: false } })
          .session(session)
          .exec();
        const productMap = new Map(
          products.map((product) => [String(product._id), product]),
        );
        const branchId = new Types.ObjectId(createOrderDto.branchId);
        const inventories = await this.getInventoryModel()
          .find({ branchId, productId: { $in: productIds } })
          .session(session)
          .exec();
        const stockByProduct = new Map(
          inventories.map((inventory) => [
            String(inventory.productId),
            inventory.stock,
          ]),
        );

        const orderItems = requested.map(([productId, quantity]) => {
          const product = productMap.get(productId);
          if (!product) {
            throw new NotFoundException(
              `Product ${productId} not found or inactive`,
            );
          }
          if (!Number.isSafeInteger(quantity) || quantity <= 0) {
            throw new BadRequestException(
              'Product quantities must be positive integers',
            );
          }
          if ((stockByProduct.get(productId) ?? 0) < quantity) {
            throw new ConflictException(
              `Not enough stock for product ${product.name}`,
            );
          }
          return {
            productId: product._id,
            quantity,
            unitPrice: this.roundMoney(product.price),
          };
        });

        for (const item of orderItems) {
          const result = await this.getInventoryModel()
            .updateOne(
              {
                branchId,
                productId: item.productId,
                stock: { $gte: item.quantity },
              },
              { $inc: { stock: -item.quantity } },
              { session },
            )
            .exec();

          if (result.modifiedCount !== 1) {
            throw new ConflictException(
              'Product stock changed; please retry the order',
            );
          }
        }

        const subtotal = orderItems.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        );
        const deliveryFee = createOrderDto.selectedByLocation
          ? 0
          : DELIVERY_FEE;
        const total = this.roundMoney(subtotal + deliveryFee);
        const [order] = await this.getOrderModel().create(
          [
            {
              customerId: new Types.ObjectId(user.sub),
              customerEmail: user.email.toLowerCase(),
              branchId,
              items: orderItems,
              deliveryFee,
              total,
              status: 'pending',
              history: [
                {
                  status: 'pending',
                  changedAt: new Date(),
                  note: 'Order created',
                },
              ],
            },
          ],
          { session },
        );
        createdOrder = order;
      });
    } finally {
      await session.endSession();
    }

    if (!createdOrder)
      throw new Error('Order transaction completed without creating an order');
    return createdOrder;
  }

  async findAll(
  query: OrderQueryDto = new OrderQueryDto(),
  role?: string,
  user?: { sub: string; branchId?: string },
) {
  const filter: Record<string, unknown> = {};

  if (role === 'customer') {
    if (!user?.sub) {
      throw new ForbiddenException('User identity is required');
    }

    filter.customerId = new Types.ObjectId(user.sub);
  } else if (role === 'branchManager') {
    if (!user?.branchId) {
      throw new ForbiddenException('Branch ID is required');
    }

    await this.getBranchesService().assertExists(user.branchId);
    filter.branchId = new Types.ObjectId(user.branchId);
  } else if (role === 'admin') {
    if (query.branchId) {
      await this.getBranchesService().assertExists(query.branchId);
      filter.branchId = new Types.ObjectId(query.branchId);
    }
  } else {
    throw new ForbiddenException('Access denied');
  }
    if (query.status) filter.status = query.status;
    // if (query.customerEmail)
    //   filter.customerEmail = query.customerEmail.toLowerCase();

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.getOrderModel()
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.getOrderModel().countDocuments(filter).exec(),
    ]);

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(
  id: string,
  role: string | undefined,
  user?: { sub: string; branchId?: string },
  branchId?: string,
) {
  const filter: Record<string, unknown> = {
    _id: new Types.ObjectId(id),
  };

  if (role === 'customer') {
    if (!user?.sub) {
      throw new ForbiddenException('User identity is required');
    }

    filter.customerId = new Types.ObjectId(user.sub);
  } else if (role === 'branchManager') {
    if (!user?.branchId) {
      throw new ForbiddenException('Branch ID is required');
    }

    await this.getBranchesService().assertExists(user.branchId);
    filter.branchId = new Types.ObjectId(user.branchId);
  } else if (role === 'admin') {
    if (branchId) {
      await this.getBranchesService().assertExists(branchId);
      filter.branchId = new Types.ObjectId(branchId);
    }
  } else {
    throw new ForbiddenException('Access denied');
  }

  const order = await this.getOrderModel()
    .findOne(filter)
    .exec();

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  return order;
}

  async updateStatus(
    id: string,
    nextStatus: string,
    branchId: string | undefined,
    role: string,
  ) {
    if (!ORDER_STATUSES.has(nextStatus)) {
      throw new BadRequestException('Invalid order status');
    }
    if (role !== 'admin' && role !== 'branchManager') {
      throw new ForbiddenException('Access denied');
    }
    if (role === 'branchManager' && !branchId) {
      throw new ForbiddenException('Branch ID is required');
    }
    const managerBranchId =
      role === 'branchManager' ? new Types.ObjectId(branchId) : undefined;

    const session = await this.getConnection().startSession();
    let updatedOrder: OrderDocument | null = null;

    try {
      await session.withTransaction(async () => {
        const orderFilter: Record<string, unknown> = {
          _id: new Types.ObjectId(id),
        };
        if (managerBranchId) {
          orderFilter.branchId = managerBranchId;
        }
        const order = await this.getOrderModel()
          .findOne(orderFilter)
          .session(session)
          .exec();
        if (!order) throw new NotFoundException('Order not found');

        const orderBranchId = new Types.ObjectId(String(order.branchId));
        await this.getBranchesService().assertExists(orderBranchId.toString());

        if (nextStatus === 'cancelled' && role !== 'admin') {
          throw new ForbiddenException('Only admins can cancel paid orders');
        }
        if (order.status === nextStatus) {
          updatedOrder = order;
          return;
        }

        const currentStatus =
          order.status === 'processing' ? 'paid' : order.status;
        if (nextStatus === 'cancelled') {
          if (currentStatus !== 'paid') {
            throw new BadRequestException('Only paid orders can be cancelled');
          }
        } else if (
          !(STATUS_TRANSITIONS[currentStatus] ?? []).includes(nextStatus)
        ) {
          throw new BadRequestException(
            `Invalid status transition from ${currentStatus} to ${nextStatus}`,
          );
        }

        const changed = await this.getOrderModel()
          .findOneAndUpdate(
            { _id: order._id, branchId: orderBranchId, status: order.status },
            {
              $set: { status: nextStatus },
              $push: {
                history: {
                  status: nextStatus,
                  changedAt: new Date(),
                  note: `Status changed to ${nextStatus}`,
                },
              },
            },
            { new: true, runValidators: true, session },
          )
          .exec();

        if (!changed) {
          throw new ConflictException('Order status changed; please retry');
        }

        if (nextStatus === 'cancelled') {
          for (const item of order.items) {
            const result = await this.getInventoryModel()
              .updateOne(
                { branchId: order.branchId, productId: item.productId },
                { $inc: { stock: item.quantity } },
                { session },
              )
              .exec();
            if (result.matchedCount !== 1) {
              throw new ConflictException(
                'Could not restore stock for a cancelled order',
              );
            }
          }
        }

        updatedOrder = changed;
      });
    } finally {
      await session.endSession();
    }

    if (!updatedOrder)
      throw new Error('Order status transaction completed without an order');
    return updatedOrder;
  }
}
