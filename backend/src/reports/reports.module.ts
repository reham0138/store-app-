import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../orders/entities/order.entity.js';
import { Product, ProductSchema } from '../products/entities/product.entity.js';
import {
  Inventory,
  InventorySchema,
} from '../inventory/entities/inventory.entity.js';
import { Branch, BranchSchema } from '../branches/entities/branch.entity.js';
import { Category, CategorySchema } from '../categories/entities/category.entity.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [ReportsController],
providers: [ReportsService],
})
export class ReportsModule {}