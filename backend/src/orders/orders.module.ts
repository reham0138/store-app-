import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { Order, OrderSchema } from './entities/order.entity.js';
import { Product, ProductSchema } from '../products/entities/product.entity.js';
import {
  Inventory,
  InventorySchema,
} from '../inventory/entities/inventory.entity.js';
import { BranchesModule } from '../branches/branches.module.js';

@Module({
  imports: [
    BranchesModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Inventory.name, schema: InventorySchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
