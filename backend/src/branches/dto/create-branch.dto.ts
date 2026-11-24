import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';

export class CreateBranchDto {
 @Transform(({ value }) =>
  typeof value === 'string' ? value.trim() : value,
)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,39}$/)
  code: string;

 @Transform(({ value }) =>
  typeof value === 'string' ? value.trim() : value,
)
  @IsOptional()
  @IsString()
  @MaxLength(250)
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180)
  @Max(180)
  longitude?: number;
}
