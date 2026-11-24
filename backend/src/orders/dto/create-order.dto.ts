import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsMongoId,
  Min,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @IsMongoId()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsMongoId()
  branchId: string;

  @IsOptional()
  @IsBoolean()
  selectedByLocation?: boolean;

  // @IsEmail()
  // customerEmail: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
