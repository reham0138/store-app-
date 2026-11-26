import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsIn, IsMongoId, IsOptional, IsString, MaxLength, ValidateNested,
} from 'class-validator';

export class AssistantHistoryEntryDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @MaxLength(2000)
  content: string;
}

export class AssistantChatDto {
  /** The shopper's own words, without any added context. */
  @IsString()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsMongoId()
  productId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  selectedProductName?: string;

  @IsOptional()
  @IsMongoId()
  branchId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timeZone?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AssistantHistoryEntryDto)
  history?: AssistantHistoryEntryDto[];
}
