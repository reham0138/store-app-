import { IsIn, IsMongoId } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsMongoId()
  branchId: string;

  @IsIn(['paid', 'shipped', 'delivered', 'cancelled'])
  status: string;
}
