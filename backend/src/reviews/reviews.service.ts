import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Review,
  ReviewDocument,
} from './entities/review.entity.js';
import {
  Product,
  ProductDocument,
} from '../products/entities/product.entity.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ReviewQueryDto } from './dto/review-query.dto.js';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async findByProduct(productId: string, query: ReviewQueryDto) {
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await Promise.all([
      this.reviewModel
        .find({ productId: new Types.ObjectId(productId) })
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.reviewModel.countDocuments({ productId }).exec(),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createOrUpdate(
    productId: string,
    userId: string,
    dto: CreateReviewDto,
  ) {
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const review = await this.reviewModel
      .findOneAndUpdate(
        {
          productId: new Types.ObjectId(productId),
          userId: new Types.ObjectId(userId),
        },
        {
          $set: {
            rating: dto.rating,
            comment: dto.comment,
          },
          $setOnInsert: {
            productId: new Types.ObjectId(productId),
            userId: new Types.ObjectId(userId),
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      )
      .exec();

    await this.updateProductRating(productId);

    return review;
  }

  async delete(
    reviewId: string,
    userId: string,
    isAdmin: boolean,
  ) {
    const review = await this.reviewModel.findById(reviewId).exec();

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!isAdmin && review.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You can only delete your own review',
      );
    }

    await review.deleteOne();

    await this.updateProductRating(review.productId.toString());

    return { message: 'Review deleted successfully' };
  }

  private async updateProductRating(productId: string) {
    const result = await this.reviewModel.aggregate([
      {
        $match: {
          productId: new Types.ObjectId(productId),
        },
      },
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    await this.productModel.findByIdAndUpdate(productId, {
      rating: result[0]?.averageRating ?? 0,
      reviewCount: result[0]?.reviewCount ?? 0,
    });
  }
}