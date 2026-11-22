
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';

describe('ProductsService', () => {
  let service: ProductsService;

  const branchId = '507f1f77bcf86cd799439011';
  const productId = '507f1f77bcf86cd799439012';

  const product = {
    _id: productId,
    name: 'Test Product',
    price: 20,
    isActive: true,
    stock: 15,
  };

  const createAggregate = (result: any) => ({
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(result),
  });

  const setup = () => {
    const aggregate = createAggregate([product]);

    const productModel = {
      aggregate: vi.fn().mockReturnValue(aggregate),
      countDocuments: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(1),
      }),
      exists: vi.fn().mockResolvedValue({ _id: productId }),
    };

    const inventoryModel = {
      collection: { name: 'inventories' },
      findOneAndUpdate: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({ stock: 15 }),
      }),
    };

    const branchesService = {
      assertActive: vi.fn().mockResolvedValue(undefined),
    };

    service = new ProductsService(
      productModel as any,
      inventoryModel as any,
      branchesService as any,
      null,
    );

    return {
      aggregate,
      productModel,
      inventoryModel,
      branchesService,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    setup();
    expect(service).toBeDefined();
  });

  it('should return products with pagination', async () => {
    const { productModel, aggregate, branchesService } = setup();

    const result = await service.findAll({
      branchId,
      page: 1,
      limit: 12,
    } as any);

    expect(branchesService.assertActive).toHaveBeenCalledWith(branchId);
    expect(productModel.aggregate).toHaveBeenCalled();
    expect(aggregate.skip).toHaveBeenCalledWith(0);
    expect(aggregate.limit).toHaveBeenCalledWith(12);
    expect(result.data).toEqual([product]);
    expect(result.meta.total).toBe(1);
  });

  it('should reject when minimum price exceeds maximum price', async () => {
    setup();

    await expect(
      service.findAll({
        branchId,
        minPrice: 100,
        maxPrice: 50,
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject mismatched category filters', async () => {
    setup();

    await expect(
      service.findAll({
        branchId,
        categoryId: '507f1f77bcf86cd799439013',
        category: '507f1f77bcf86cd799439014',
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should filter low stock products by threshold', async () => {
    const { aggregate, branchesService } = setup();

    const result = await service.findLowStock(branchId, 5);

    expect(branchesService.assertActive).toHaveBeenCalledWith(branchId);
    expect(aggregate.match).toHaveBeenCalledWith({
      stock: { $lte: 5 },
    });
    expect(result).toEqual([product]);
  });

  it('should throw when a product is not found', async () => {
    const { productModel } = setup();
    productModel.aggregate.mockReturnValue(createAggregate([]));

    await expect(
      service.findOne(productId, branchId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should reject zero stock changes', async () => {
    setup();

    await expect(
      service.updateStock(productId, 0, branchId),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject non-integer stock changes', async () => {
    setup();

    await expect(
      service.updateStock(productId, 1.5, branchId),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject stock changes that would make stock negative', async () => {
    const { inventoryModel } = setup();

    inventoryModel.findOneAndUpdate.mockReturnValue({
      exec: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.updateStock(productId, -20, branchId),
    ).rejects.toThrow(ConflictException);
  });
});
