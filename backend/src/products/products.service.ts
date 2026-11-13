import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Product, ProductDocument } from './entities/product.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductQueryDto } from './dto/product-query.dto.js';
import {
  Inventory,
  InventoryDocument,
} from '../inventory/entities/inventory.entity.js';
import { BranchesService } from '../branches/branches.service.js';

const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  stock_asc: { stock: 1 },
  stock_desc: { stock: -1 },
};

@Injectable()
export class ProductsService {
  constructor(
    @Optional()
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument> | null = null,
    @Optional()
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument> | null = null,
    @Optional() private readonly branchesService: BranchesService | null = null,
    @Optional()
    @InjectConnection()
    private readonly connection: Connection | null = null,
  ) {}

  private getProductModel() {
    if (!this.productModel) throw new Error('Product model is not available');
    return this.productModel;
  }

  private getInventoryModel() {
    if (!this.inventoryModel)
      throw new Error('Inventory model is not available');
    return this.inventoryModel;
  }

  private getBranchesService() {
    if (!this.branchesService)
      throw new Error('Branches service is not available');
    return this.branchesService;
  }

  private getConnection() {
    if (!this.connection)
      throw new Error('MongoDB connection is not available');
    return this.connection;
  }

  async create(dto: CreateProductDto) {
    await this.getBranchesService().assertActive(dto.branchId);
    const session = await this.getConnection().startSession();
    let createdProduct: ProductDocument | undefined;

    try {
      await session.withTransaction(async () => {
        const [product] = await this.getProductModel().create(
          [
            {
              name: dto.name,
              sku: dto.sku,
              description: dto.description,
              price: dto.price,
              categoryId: dto.categoryId,
              isActive: dto.isActive,
            },
          ],
          { session },
        );
        await this.getInventoryModel().create(
          [
            {
              branchId: dto.branchId,
              productId: product._id,
              stock: dto.stock,
            },
          ],
          { session },
        );
        createdProduct = product;
      });
    } finally {
      await session.endSession();
    }

    if (!createdProduct) {
      throw new Error(
        'Product transaction completed without creating a product',
      );
    }
    return Object.assign(createdProduct.toObject(), { stock: dto.stock });
  }

  async findAll(query: ProductQueryDto = new ProductQueryDto()) {
    await this.getBranchesService().assertActive(query.branchId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const search = query.search?.trim() ?? '';
    const categoryId = query.categoryId ?? query.category;
    const minPrice = query.minPrice;
    const maxPrice = query.maxPrice;

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      throw new BadRequestException('minPrice must not exceed maxPrice');
    }
    if (
      query.categoryId &&
      query.category &&
      query.categoryId !== query.category
    ) {
      throw new BadRequestException(
        'category and categoryId must match when both are provided',
      );
    }

    const filter: Record<string, unknown> = { isActive: { $ne: false } };
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { sku: { $regex: escapedSearch, $options: 'i' } },
      ];
    }
    if (categoryId) filter.categoryId = new Types.ObjectId(categoryId);
    if (minPrice !== undefined || maxPrice !== undefined) {
      const price: Record<string, number> = {};
      if (minPrice !== undefined) price.$gte = minPrice;
      if (maxPrice !== undefined) price.$lte = maxPrice;
      filter.price = price;
    }

    const [items, total] = await Promise.all([
      this.withBranchStock(filter, query.branchId)
        .sort(SORTS[query.sort ?? 'newest'])
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.getProductModel().countDocuments(filter).exec(),
    ]);

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findLowStock(branchId: string, threshold = 10) {
    await this.getBranchesService().assertActive(branchId);
    return this.withBranchStock({ isActive: { $ne: false } }, branchId)
      .match({ stock: { $lte: threshold } })
      .sort({ stock: 1, _id: 1 })
      .exec();
  }

  async findOne(id: string, branchId: string) {
    await this.getBranchesService().assertActive(branchId);
    const [product] = await this.withBranchStock(
      { _id: new Types.ObjectId(id), isActive: { $ne: false } },
      branchId,
    ).exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto, branchId: string) {
    await this.getBranchesService().assertActive(branchId);
    const product = await this.getProductModel()
      .findOneAndUpdate({ _id: id, isActive: { $ne: false } }, dto, {
        new: true,
        runValidators: true,
      })
      .exec();
    if (!product) throw new NotFoundException('Product not found');
    return this.findOne(id, branchId);
  }

  async updateStock(id: string, delta: number, branchId: string) {
    if (!Number.isSafeInteger(delta) || delta === 0) {
      throw new BadRequestException('Stock change must be a non-zero integer');
    }
    await this.getBranchesService().assertActive(branchId);
    const productExists = await this.getProductModel().exists({
      _id: id,
      isActive: { $ne: false },
    });
    if (!productExists) throw new NotFoundException('Product not found');

    const filter: Record<string, unknown> = {
      branchId: new Types.ObjectId(branchId),
      productId: new Types.ObjectId(id),
    };
    if (delta < 0) filter.stock = { $gte: Math.abs(delta) };

    let inventory: InventoryDocument | null;
    try {
      inventory = await this.getInventoryModel()
        .findOneAndUpdate(
          filter,
          { $inc: { stock: delta } },
          {
            new: true,
            upsert: delta > 0,
            runValidators: true,
            setDefaultsOnInsert: false,
          },
        )
        .exec();
    } catch (error) {
      if (delta <= 0 || !this.isDuplicateKey(error)) throw error;
      inventory = await this.getInventoryModel()
        .findOneAndUpdate(
          filter,
          { $inc: { stock: delta } },
          { new: true, runValidators: true },
        )
        .exec();
    }

    if (!inventory) {
      throw new ConflictException('Stock cannot go below zero');
    }
    return this.findOne(id, branchId);
  }

  async remove(id: string, branchId: string) {
    await this.getBranchesService().assertActive(branchId);
    const product = await this.getProductModel()
      .findOneAndUpdate(
        { _id: id, isActive: { $ne: false } },
        { isActive: false },
        { new: true },
      )
      .exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private withBranchStock(filter: Record<string, unknown>, branchId: string) {
    return this.getProductModel().aggregate([
      { $match: filter },
      {
        $lookup: {
          from: this.getInventoryModel().collection.name,
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$productId', '$$productId'] },
                    { $eq: ['$branchId', new Types.ObjectId(branchId)] },
                  ],
                },
              },
            },
            { $project: { _id: 0, stock: 1 } },
          ],
          as: 'branchInventory',
        },
      },
      {
        $set: {
          stock: {
            $ifNull: [{ $arrayElemAt: ['$branchInventory.stock', 0] }, 0],
          },
        },
      },
      { $unset: 'branchInventory' },
    ]);
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
