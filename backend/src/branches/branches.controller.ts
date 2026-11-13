import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BranchesService } from './branches.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { IsBooleanString, IsOptional } from 'class-validator';

class BranchQueryDto {
  @IsOptional()
  @IsBooleanString()
  includeInactive?: string;
}

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Roles('staff', 'admin')
  @Get()
  findAll(@Query() query: BranchQueryDto) {
    return this.branchesService.findAll(query.includeInactive === 'true');
  }

  @Roles('staff', 'admin')
  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.branchesService.findOne(id);
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.update(id, dto);
  }
}
