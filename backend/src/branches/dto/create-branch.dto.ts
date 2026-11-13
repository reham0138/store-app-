import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,39}$/)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  address?: string;
}
