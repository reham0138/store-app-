import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateStaffDto {
 @Transform(({ value }) =>
  typeof value === 'string' ? value.trim() : value,
)
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsMongoId()
  branchId?: string;
}