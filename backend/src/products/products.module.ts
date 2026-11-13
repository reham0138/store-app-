import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { Product, ProductSchema } from './entities/product.entity.js';
import {
  Inventory,
  InventorySchema,
} from '../inventory/entities/inventory.entity.js';
import { BranchesModule } from '../branches/branches.module.js';

@Module({
  imports: [
    BranchesModule,
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([
      { name: Inventory.name, schema: InventorySchema },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
