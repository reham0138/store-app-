import {
  ConflictException,
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service.js';
import { BranchesService } from '../branches/branches.service.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly branchesService: BranchesService,
  ) {}

  @Roles('admin')
  @Post('staff')
  async createStaff(@Body() dto: CreateStaffDto) {
    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    await this.branchesService.assertActive(dto.branchId);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      name: dto.name,
      email,
      passwordHash,
      role: 'staff',
      branchId: dto.branchId,
    });

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: 'branchManager',
      branchId: user.branchId,
    };
  }
  @Roles('admin')
@Get('staff')
findStaff() {
  return this.usersService.findStaff();
}
@Roles('admin')
@Patch('staff/:id')
async updateStaff(
  @Param('id', ParseObjectIdPipe) id: string,
  @Body() dto: UpdateStaffDto,
) {
  const updateData: {
    name?: string;
    email?: string;
    passwordHash?: string;
    branchId?: string;
  } = {};

  if (dto.name !== undefined) updateData.name = dto.name;

  if (dto.email !== undefined) {
    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser && existingUser._id.toString() !== id) {
      throw new ConflictException('Email already registered');
    }

    updateData.email = email;
  }

  if (dto.password !== undefined) {
    updateData.passwordHash = await bcrypt.hash(dto.password, 10);
  }

  if (dto.branchId !== undefined) {
    await this.branchesService.assertActive(dto.branchId);
    updateData.branchId = dto.branchId;
  }

  return this.usersService.updateStaff(id, updateData);
}
@Roles('admin')
@Delete('staff/:id')
deleteStaff(
  @Param('id', ParseObjectIdPipe) id: string,
) {
  return this.usersService.deleteStaff(id);
}
}