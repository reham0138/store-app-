import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @Transform(({ value }) =>
  typeof value === 'string' ? value.trim() : value,
)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}