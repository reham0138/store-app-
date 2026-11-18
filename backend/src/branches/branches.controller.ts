import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { BranchesService } from './branches.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { IsBooleanString, IsOptional } from 'class-validator';
type BranchRequest = Request & {
  user: {
    role: string;
    branchId: string;
  };
};

class BranchQueryDto {
  @IsOptional()
  @IsBooleanString()
  includeInactive?: string;
}

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Roles('branchManager', 'admin')
@Get()
findAll(
  @Query() query: BranchQueryDto,
  @Req() req: BranchRequest,
) {
  if (req.user.role === 'branchManager') {
    return this.branchesService.findOne(req.user.branchId);
  }

  return this.branchesService.findAll(
    query.includeInactive === 'true',
  );
}

 @Roles('branchManager', 'admin')
@Get(':id')
findOne(
  @Param('id', ParseObjectIdPipe) id: string,
  @Req() req: BranchRequest,
) {
  if (
    req.user.role === 'branchManager' &&
    req.user.branchId !== id
  ) {
    throw new ForbiddenException(
      'You can only access your own branch',
    );
  }

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
