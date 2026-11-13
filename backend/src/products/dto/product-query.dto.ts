import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const PRODUCT_SORTS = [
  'newest',
  'oldest',
  'name_asc',
  'name_desc',
  'price_asc',
  'price_desc',
  'stock_asc',
  'stock_desc',
] as const;

export class ProductQueryDto {
  @IsMongoId()
  branchId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @IsOptional()
  @IsMongoId()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? Number.NaN : Number(value)))
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? Number.NaN : Number(value)))
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  maxPrice?: number;

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
  limit = 12;

  @IsOptional()
  @Transform(({ value }) => String(value).toLowerCase())
  @IsIn(PRODUCT_SORTS)
  sort: (typeof PRODUCT_SORTS)[number] = 'newest';
}

export class LowStockQueryDto {
  @IsMongoId()
  branchId: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? Number.NaN : Number(value)))
  @IsInt()
  @Min(0)
  @Max(1000000)
  threshold = 10;
}
