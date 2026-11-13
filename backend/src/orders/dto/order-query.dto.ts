import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class OrderQueryDto {
  @IsMongoId()
  branchId: string;

  @IsOptional()
  @IsIn(['pending', 'paid', 'shipped', 'delivered', 'cancelled'])
  status?: string;

  @IsOptional()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? Number.NaN : Number(value)))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? Number.NaN : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class OrderLookupQueryDto {
  @IsMongoId()
  branchId: string;

  @IsOptional()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email?: string;
}
