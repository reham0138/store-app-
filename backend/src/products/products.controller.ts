import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IsMongoId } from 'class-validator';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { ProductQueryDto, LowStockQueryDto } from './dto/product-query.dto.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';

class BranchIdQueryDto {
  @IsMongoId()
  branchId: string;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Roles('staff', 'admin')
  @Get('low-stock')
  findLowStock(@Query() query: LowStockQueryDto) {
    return this.productsService.findLowStock(query.branchId, query.threshold);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query() query: BranchIdQueryDto,
  ) {
    return this.productsService.findOne(id.toString(), query.branchId);
  }

  @Roles('admin')
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Query() query: BranchIdQueryDto,
  ) {
    return this.productsService.update(
      id.toString(),
      updateProductDto,
      query.branchId,
    );
  }

  @Roles('admin')
  @Patch(':id/stock')
  updateStock(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: UpdateStockDto,
    @Query() query: BranchIdQueryDto,
  ) {
    return this.productsService.updateStock(
      id.toString(),
      body.delta,
      query.branchId,
    );
  }

  @Roles('admin')
  @Delete(':id')
  remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query() query: BranchIdQueryDto,
  ) {
    return this.productsService.remove(id.toString(), query.branchId);
  }
}
