import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProductQueryDto, LowStockQueryDto } from './product-query.dto.js';

describe('product query DTOs', () => {
  it('converts bounded pagination and rejects unsupported sort values', async () => {
    const query = plainToInstance(ProductQueryDto, {
      branchId: '507f1f77bcf86cd799439011',
      page: '2',
      limit: '101',
      sort: 'arbitrary-field',
    });

    const errors = await validate(query);
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['limit', 'sort']),
    );
    expect(query.page).toBe(2);
  });

  it('rejects empty numeric query values instead of treating them as zero', async () => {
    const query = plainToInstance(LowStockQueryDto, { threshold: '' });
    const errors = await validate(query);
    expect(errors.map((error) => error.property)).toContain('threshold');
  });

  it('requires an explicit branch for product listings', async () => {
    const query = plainToInstance(ProductQueryDto, {});
    const errors = await validate(query);
    expect(errors.map((error) => error.property)).toContain('branchId');
  });
});
