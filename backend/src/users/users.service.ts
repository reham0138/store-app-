import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }
  async findById(id:string){
    return this.userModel.findById(id).exec();
  }
  async findStaff() {
  return this.userModel
    .find({ role: 'staff' })
    .select('-passwordHash')
    .sort({ name: 1 })
    .exec();
}

  async create(userData: {
    name: string;
    email: string;
    passwordHash: string;
     role?: 'customer' | 'staff' | 'admin';
  branchId?: string;
  }) {
    const user = new this.userModel(userData);
    return user.save();
  }
  async updateStaff(
  id: string,
  updateData: {
    name?: string;
    email?: string;
    passwordHash?: string;
    branchId?: string;
  },
) {
  const user = await this.userModel
    .findOneAndUpdate(
      { _id: id, role: 'staff' },
      updateData,
      { new: true, runValidators: true },
    )
    .select('-passwordHash')
    .exec();

  if (!user) {
    throw new NotFoundException('Staff member not found');
  }

  return user;
}
async deleteStaff(id: string) {
  const user = await this.userModel
    .findOneAndDelete({ _id: id, role: 'staff' })
    .exec();

  if (!user) {
    throw new NotFoundException('Staff member not found');
  }

  return {
    message: 'Staff member deleted successfully',
  };
}
}