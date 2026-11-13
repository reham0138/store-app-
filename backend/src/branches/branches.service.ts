import {
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Branch, BranchDocument } from './entities/branch.entity.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';

@Injectable()
export class BranchesService {
  constructor(
    @Optional()
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument> | null = null,
  ) {}

  private getBranchModel() {
    if (!this.branchModel) throw new Error('Branch model is not available');
    return this.branchModel;
  }

  async create(dto: CreateBranchDto) {
    try {
      return await this.getBranchModel().create({
        name: dto.name,
        code: dto.code.toLowerCase(),
        address: dto.address,
      });
    } catch (error) {
      if (this.isDuplicateKey(error)) {
        throw new ConflictException('A branch with this code already exists');
      }
      throw error;
    }
  }

  async findAll(includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: { $ne: false } };
    return this.getBranchModel().find(filter).sort({ name: 1, _id: 1 }).exec();
  }

  async findOne(id: string) {
    const branch = await this.getBranchModel().findById(id).exec();
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async update(id: string, dto: UpdateBranchDto) {
    const update: Partial<UpdateBranchDto> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.code !== undefined) update.code = dto.code.toLowerCase();
    if (dto.address !== undefined) update.address = dto.address;
    if (dto.isActive !== undefined) update.isActive = dto.isActive;
    try {
      const branch = await this.getBranchModel()
        .findByIdAndUpdate(id, update, { new: true, runValidators: true })
        .exec();
      if (!branch) throw new NotFoundException('Branch not found');
      return branch;
    } catch (error) {
      if (this.isDuplicateKey(error)) {
        throw new ConflictException('A branch with this code already exists');
      }
      throw error;
    }
  }

  async assertActive(id: string) {
    const branch = await this.getBranchModel()
      .findOne({ _id: id, isActive: { $ne: false } })
      .select({ _id: 1 })
      .exec();
    if (!branch) throw new NotFoundException('Active branch not found');
  }

  async assertExists(id: string) {
    const exists = await this.getBranchModel().exists({ _id: id });
    if (!exists) throw new NotFoundException('Branch not found');
  }

  private isDuplicateKey(error: unknown): error is { code: number } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }
}
