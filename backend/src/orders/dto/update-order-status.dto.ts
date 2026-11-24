import { IsIn, IsMongoId, IsOptional } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsOptional()
  @IsMongoId()
  branchId?: string;

  @IsIn(['paid', 'shipped', 'delivered', 'cancelled'])
  status: string;
}
