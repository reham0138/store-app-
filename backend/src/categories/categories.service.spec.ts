
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service.js';

describe('CategoriesService', () => {
  const categoryId = '507f1f77bcf86cd799439011';

  const createService = () => {
    const category = {
      _id: categoryId,
      name: 'Burgers',
      isActive: true,
    };

    const categoryModel = {
      create: vi.fn().mockResolvedValue(category),

      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([category]),
      }),

      findById: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(category),
      }),

      findByIdAndUpdate: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(category),
      }),

      findByIdAndDelete: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(category),
      }),
    };

    const productModel = {
      aggregate: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([
          { _id: categoryId, count: 3 },
        ]),
      }),

      findOne: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      }),
    };

    const service = new CategoriesService(
      categoryModel as any,
      productModel as any,
    );

    return { service, categoryModel, productModel, category };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    const { service } = createService();
    expect(service).toBeDefined();
  });

  it('should create a category', async () => {
    const { service, categoryModel, category } = createService();

    const result = await service.create({
      name: 'Burgers',
    } as any);

    expect(categoryModel.create).toHaveBeenCalledWith({
      name: 'Burgers',
    });
    expect(result).toEqual(category);
  });

  it('should return active categories with product counts', async () => {
    const { service, categoryModel, productModel } = createService();

    const result = await service.findAll();

    expect(categoryModel.find).toHaveBeenCalledWith({
      isActive: { $ne: false },
    });
    expect(productModel.aggregate).toHaveBeenCalled();
    expect(result[0].activeProductCount).toBe(3);
  });

  it('should return a category by ID', async () => {
    const { service, categoryModel, category } = createService();

    const result = await service.findOne(categoryId);

    expect(categoryModel.findById).toHaveBeenCalledWith(categoryId);
    expect(result).toEqual(category);
  });

  it('should throw when category is not found', async () => {
    const { service, categoryModel } = createService();

    categoryModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.findOne(categoryId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should update a category', async () => {
    const { service, categoryModel, category } = createService();

    const result = await service.update(categoryId, {
      name: 'Updated Burgers',
    } as any);

    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      categoryId,
      { name: 'Updated Burgers' },
      { new: true, runValidators: true },
    );
    expect(result).toEqual(category);
  });

  it('should throw when updating a missing category', async () => {
    const { service, categoryModel } = createService();

    categoryModel.findByIdAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.update(categoryId, {} as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('should delete an unused category', async () => {
    const { service, categoryModel, productModel } = createService();

    const result = await service.remove(categoryId);

    expect(productModel.findOne).toHaveBeenCalled();
    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith(categoryId);
    expect(result).toBeDefined();
  });

  it('should reject deleting a category used by products', async () => {
    const { service, productModel, categoryModel } = createService();

    productModel.findOne.mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: 'product123' }),
    });

    await expect(
      service.remove(categoryId),
    ).rejects.toThrow(ConflictException);

    expect(categoryModel.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('should reject deleting a category that does not exist', async () => {
    const { service, categoryModel, productModel } = createService();

    categoryModel.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.remove(categoryId),
    ).rejects.toThrow(NotFoundException);

    expect(productModel.findOne).not.toHaveBeenCalled();
  });
});
