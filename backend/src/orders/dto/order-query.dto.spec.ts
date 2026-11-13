import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OrderQueryDto } from './order-query.dto.js';

describe('order query DTO', () => {
  it('normalizes email and rejects invalid status and pagination', async () => {
    const query = plainToInstance(OrderQueryDto, {
      branchId: '507f1f77bcf86cd799439011',
      customerEmail: ' CUSTOMER@example.com ',
      status: 'refunded',
      page: '0',
    });

    const errors = await validate(query);
    expect(query.customerEmail).toBe('customer@example.com');
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['status', 'page']),
    );
  });
});
