import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
 @Transform(({ value }) =>
  typeof value === 'string' ? value.trim() : value,
)
@IsString()
@IsNotEmpty()
@MinLength(2)
name: string;
}

