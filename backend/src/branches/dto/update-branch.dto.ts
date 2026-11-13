import { PartialType } from '@nestjs/mapped-types';
import { CreateBranchDto } from './create-branch.dto.js';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateBranchDto extends PartialType(CreateBranchDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
