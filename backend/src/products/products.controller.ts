import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsMongoId } from 'class-validator';
import { ProductsService } from './products.service.js';
import { ProductImagesService } from './product-images.service.js';
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
  constructor(
    private readonly productsService: ProductsService,
    private readonly productImagesService: ProductImagesService,
  ) {}

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

 @Roles('branchManager', 'admin')
@Get('low-stock')
findLowStock(
  @Query() query: LowStockQueryDto,
  @Req() req: Request & {
    role?: string;
    user?: { branchId?: string };
  },
) {
  const branchId =
    req.role === 'branchManager'
      ? req.user?.branchId
      : query.branchId;

  if (!branchId) {
    throw new BadRequestException('Branch ID is required');
  }

  return this.productsService.findLowStock(branchId, query.threshold);
}

  @Get(':id')
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query() query: BranchIdQueryDto,
  ) {
    return this.productsService.findOne(id.toString(), query.branchId);
  }

  @Roles('admin')
  @Post('images')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 8 * 1024 * 1024, files: 1 },
      fileFilter: (_request, file, callback) => {
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype)) {
          callback(new BadRequestException('Only JPEG, PNG, WebP, or AVIF images are allowed'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file?: { buffer: Buffer }) {
    if (!file) {
      throw new BadRequestException('An image file is required');
    }
    return this.productImagesService.upload(file.buffer);
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

 @Roles('branchManager', 'admin')
@Patch(':id/stock')
updateStock(
  @Param('id', ParseObjectIdPipe) id: string,
  @Body() body: UpdateStockDto,
  @Query() query: BranchIdQueryDto,
  @Req() req: Request & {
    role?: string;
    user?: { branchId?: string };
  },
) {
  const branchId =
    req.role === 'branchManager'
      ? req.user?.branchId
      : query.branchId;

  if (!branchId) {
    throw new BadRequestException('Branch ID is required');
  }

  return this.productsService.updateStock(
    id.toString(),
    body.delta,
    branchId,
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
