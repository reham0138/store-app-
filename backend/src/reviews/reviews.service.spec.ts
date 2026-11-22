
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';

describe('ReviewsService', () => {
  const productId = '507f1f77bcf86cd799439011';
  const userId = '507f1f77bcf86cd799439012';
  const reviewId = '507f1f77bcf86cd799439013';

  const createService = () => {
    const review = {
      _id: reviewId,
      productId,
      userId: { toString: () => userId },
      rating: 5,
      comment: 'Great product',
      deleteOne: vi.fn().mockResolvedValue(undefined),
    };

    const findQuery = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([review]),
    };

    const reviewModel = {
      find: vi.fn().mockReturnValue(findQuery),
      countDocuments: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(1),
      }),
      findOneAndUpdate: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(review),
      }),
      findById: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(review),
      }),
      aggregate: vi.fn().mockResolvedValue([
        { averageRating: 5, reviewCount: 1 },
      ]),
    };

    const productModel = {
      findById: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({ _id: productId }),
      }),
      findByIdAndUpdate: vi.fn().mockResolvedValue({}),
    };

    const service = new ReviewsService(
      reviewModel as any,
      productModel as any,
    );

    return {
      service,
      review,
      reviewModel,
      productModel,
      findQuery,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    const { service } = createService();
    expect(service).toBeDefined();
  });

  it('should return product reviews with pagination', async () => {
    const { service, reviewModel, findQuery } = createService();

    const result = await service.findByProduct(productId, {
      page: 2,
      limit: 5,
    } as any);

    expect(reviewModel.find).toHaveBeenCalled();
    expect(findQuery.skip).toHaveBeenCalledWith(5);
    expect(findQuery.limit).toHaveBeenCalledWith(5);
    expect(result.meta.page).toBe(2);
    expect(result.meta.total).toBe(1);
  });

  it('should reject reviews for a missing product', async () => {
    const { service, productModel } = createService();

    productModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.findByProduct(productId, {} as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('should create or update a product review', async () => {
    const { service, reviewModel, productModel } = createService();

    const result = await service.createOrUpdate(
      productId,
      userId,
      { rating: 5, comment: 'Great product' } as any,
    );

    expect(reviewModel.findOneAndUpdate).toHaveBeenCalled();
    expect(reviewModel.aggregate).toHaveBeenCalled();
    expect(productModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(result.rating).toBe(5);
  });

  it('should reject creating a review for a missing product', async () => {
    const { service, productModel, reviewModel } = createService();

    productModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.createOrUpdate(
        productId,
        userId,
        { rating: 5, comment: 'Great product' } as any,
      ),
    ).rejects.toThrow(NotFoundException);

    expect(reviewModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('should allow a user to delete their own review', async () => {
    const { service, review, productModel } = createService();

    const result = await service.delete(reviewId, userId, false);

    expect(review.deleteOne).toHaveBeenCalled();
    expect(productModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(result.message).toBe('Review deleted successfully');
  });

  it('should reject deleting another users review', async () => {
    const { service, review } = createService();

    await expect(
      service.delete(reviewId, '507f1f77bcf86cd799439099', false),
    ).rejects.toThrow(ForbiddenException);

    expect(review.deleteOne).not.toHaveBeenCalled();
  });

  it('should allow admin to delete another users review', async () => {
    const { service, review } = createService();

    await service.delete(
      reviewId,
      '507f1f77bcf86cd799439099',
      true,
    );

    expect(review.deleteOne).toHaveBeenCalled();
  });

  it('should reject deleting a review that does not exist', async () => {
    const { service, reviewModel } = createService();

    reviewModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.delete(reviewId, userId, false),
    ).rejects.toThrow(NotFoundException);
  });
});
