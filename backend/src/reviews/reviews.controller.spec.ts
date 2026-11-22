
import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';
import { vi } from 'vitest';

describe('ReviewsController', () => {
  let controller: ReviewsController;

  const reviewsService = {
    findByProduct: vi.fn(),
    createOrUpdate: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: reviewsService,
        },
      ],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return product reviews', async () => {
    const result = [{ rating: 5, comment: 'Excellent' }];
    const query = { page: 1, limit: 10 };

    reviewsService.findByProduct.mockResolvedValue(result);

    await expect(
      controller.findByProduct('product-id', query as any),
    ).resolves.toEqual(result);

    expect(reviewsService.findByProduct).toHaveBeenCalledWith(
      'product-id',
      query,
    );
  });

  it('should create or update a review', async () => {
    const dto = { rating: 5, comment: 'Excellent' };
    const result = { rating: 5, comment: 'Excellent' };

    reviewsService.createOrUpdate.mockResolvedValue(result);

    await expect(
      controller.createOrUpdate(
        'product-id',
        dto as any,
        { user: { sub: 'user-id' } } as any,
      ),
    ).resolves.toEqual(result);

    expect(reviewsService.createOrUpdate).toHaveBeenCalledWith(
      'product-id',
      'user-id',
      dto,
    );
  });

  it('should delete a review as its owner', async () => {
    reviewsService.delete.mockResolvedValue({ deleted: true });

    await expect(
      controller.remove(
        'review-id',
        {
          user: { sub: 'user-id' },
          role: 'customer',
        } as any,
      ),
    ).resolves.toEqual({ deleted: true });

    expect(reviewsService.delete).toHaveBeenCalledWith(
      'review-id',
      'user-id',
      false,
    );
  });

  it('should delete a review as admin', async () => {
    reviewsService.delete.mockResolvedValue({ deleted: true });

    await controller.remove('review-id', {
      user: { sub: 'admin-id' },
      role: 'admin',
    } as any);

    expect(reviewsService.delete).toHaveBeenCalledWith(
      'review-id',
      'admin-id',
      true,
    );
  });

  it('should pass empty user id when request has no user', async () => {
    reviewsService.delete.mockResolvedValue({ deleted: true });

    await controller.remove('review-id', {
      role: 'admin',
    } as any);

    expect(reviewsService.delete).toHaveBeenCalledWith(
      'review-id',
      '',
      true,
    );
  });
});
