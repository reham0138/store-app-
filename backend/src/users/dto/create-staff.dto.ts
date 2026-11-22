import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateStaffDto {
  @Transform(({ value }) =>
  typeof value === 'string' ? value.trim() : value,
)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsMongoId()
  branchId: string;
}