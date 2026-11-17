import { Injectable } from '@nestjs/common';
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

  async create(userData: {
    name: string;
    email: string;
    passwordHash: string;
  }) {
    const user = new this.userModel(userData);
    return user.save();
  }
}