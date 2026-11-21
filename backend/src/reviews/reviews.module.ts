import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';
import {
  Review,
  ReviewSchema,
} from './entities/review.entity.js';
import {
  Product,
  ProductSchema,
} from '../products/entities/product.entity.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}