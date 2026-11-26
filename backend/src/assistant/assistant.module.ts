import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../products/entities/product.entity.js';
import { Inventory, InventorySchema } from '../inventory/entities/inventory.entity.js';
import { Category, CategorySchema } from '../categories/entities/category.entity.js';
import { Branch, BranchSchema } from '../branches/entities/branch.entity.js';
import { Review, ReviewSchema } from '../reviews/entities/review.entity.js';
import { AssistantController } from './assistant.controller.js';
import { AssistantService } from './assistant.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: Category.name, schema: CategorySchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
  ],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
