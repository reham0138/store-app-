import { Transform } from 'class-transformer';
import { IsInt, NotEquals } from 'class-validator';

export class UpdateStockDto {
  @Transform(({ value }) => (value === '' ? Number.NaN : Number(value)))
  @IsInt()
  @NotEquals(0)
  delta: number;
}
