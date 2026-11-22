
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

describe('ProductsController', () => {
  const productId = '507f1f77bcf86cd799439011';
  const branchId = '507f1f77bcf86cd799439012';
  const otherBranchId = '507f1f77bcf86cd799439013';

  let controller: ProductsController;
  let service: {
    findAll: ReturnType<typeof vi.fn>;
    findLowStock: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateStock: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      findLowStock: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateStock: vi.fn(),
      remove: vi.fn(),
    };

    controller = new ProductsController(
      service as unknown as ProductsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all products', () => {
    const query = { page: 1, limit: 10 };

    controller.findAll(query as any);

    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('should use the manager own branch for low stock', () => {
    const query = { branchId: otherBranchId, threshold: 5 };
    const req = {
      role: 'branchManager',
      user: { branchId },
    };

    controller.findLowStock(query as any, req as any);

    expect(service.findLowStock).toHaveBeenCalledWith(branchId, 5);
  });

  it('should use the selected branch for admin low stock', () => {
    const query = { branchId, threshold: 8 };
    const req = { role: 'admin' };

    controller.findLowStock(query as any, req as any);

    expect(service.findLowStock).toHaveBeenCalledWith(branchId, 8);
  });

  it('should reject low stock requests without a branch ID', () => {
    expect(() =>
      controller.findLowStock(
        {} as any,
        { role: 'admin' } as any,
      ),
    ).toThrow(BadRequestException);
  });

  it('should find a product by ID and branch', () => {
    controller.findOne(productId, { branchId } as any);

    expect(service.findOne).toHaveBeenCalledWith(productId, branchId);
  });

  it('should create a product', () => {
    const dto = { name: 'Test Product' };

    controller.create(dto as any);

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should update a product', () => {
    const dto = { name: 'Updated Product' };

    controller.update(productId, dto as any, { branchId } as any);

    expect(service.update).toHaveBeenCalledWith(
      productId,
      dto,
      branchId,
    );
  });

  it('should use the manager own branch when updating stock', () => {
    const body = { delta: 5 };
    const query = { branchId: otherBranchId };
    const req = {
      role: 'branchManager',
      user: { branchId },
    };

    controller.updateStock(
      productId,
      body as any,
      query as any,
      req as any,
    );

    expect(service.updateStock).toHaveBeenCalledWith(
      productId,
      5,
      branchId,
    );
  });

  it('should use the selected branch when admin updates stock', () => {
    const body = { delta: -2 };

    controller.updateStock(
      productId,
      body as any,
      { branchId } as any,
      { role: 'admin' } as any,
    );

    expect(service.updateStock).toHaveBeenCalledWith(
      productId,
      -2,
      branchId,
    );
  });

  it('should reject stock updates without a branch ID', () => {
    expect(() =>
      controller.updateStock(
        productId,
        { delta: 5 } as any,
        {} as any,
        { role: 'admin' } as any,
      ),
    ).toThrow(BadRequestException);
  });

  it('should remove a product', () => {
    controller.remove(productId, { branchId } as any);

    expect(service.remove).toHaveBeenCalledWith(productId, branchId);
  });
});
