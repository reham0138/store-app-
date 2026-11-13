import {
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './entities/category.entity.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { Product } from '../products/entities/product.entity.js';

@Injectable()
export class CategoriesService {
  constructor(
    @Optional() @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument> | null = null,
    @Optional() @InjectModel(Product.name)
    private readonly productModel: Model<any> | null = null,
  ) {}

  private getCategoryModel() {
    if (!this.categoryModel) {
      throw new Error('Category model is not available');
    }
    return this.categoryModel;
  }

  private getProductModel() {
    if (!this.productModel) {
      throw new Error('Product model is not available');
    }
    return this.productModel;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    return this.getCategoryModel().create(createCategoryDto);
  }

  async findAll() {
    const categories = await this.getCategoryModel()
      .find({ isActive: { $ne: false } })
      .lean()
      .exec();

    const ids = categories.map((category) => new Types.ObjectId(String(category._id)));
    const counts = await this.getProductModel()
      .aggregate([
        { $match: { isActive: { $ne: false }, categoryId: { $in: ids } } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      ])
      .exec();

    const countsByCategory = new Map(
      counts.map((item) => [String(item._id), item.count]),
    );

    return categories.map((category) => ({
      ...category,
      activeProductCount: countsByCategory.get(String(category._id)) ?? 0,
    }));
  }

  async findOne(id: string) {
    const category = await this.getCategoryModel().findById(id).exec();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.getCategoryModel()
      .findByIdAndUpdate(id, updateCategoryDto, { new: true, runValidators: true })
      .exec();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async remove(id: string) {
    const existing = await this.getCategoryModel().findById(id).exec();
    if (!existing) throw new NotFoundException('Category not found');

    const used = await this.getProductModel()
      .findOne({ categoryId: id, isActive: { $ne: false } })
      .exec();

    if (used) {
      throw new ConflictException('Category is in use by one or more products');
    }

    const category = await this.getCategoryModel().findByIdAndDelete(id).exec();
    return category;
  }
}
