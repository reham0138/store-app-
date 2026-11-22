import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @IsMongoId()
  branchId: string;

  @IsMongoId()
  categoryId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
