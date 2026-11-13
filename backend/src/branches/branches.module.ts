import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BranchesController } from './branches.controller.js';
import { BranchesService } from './branches.service.js';
import { Branch, BranchSchema } from './entities/branch.entity.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Branch.name, schema: BranchSchema }]),
  ],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService, MongooseModule],
})
export class BranchesModule {}
