import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ReviewQueryDto } from './dto/review-query.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('products/:id/reviews')
  findByProduct(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewsService.findByProduct(id, query);
  }

  @Roles('customer')
  @Post('products/:id/reviews')
  createOrUpdate(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: CreateReviewDto,
    @Req() req: Request & {
      user?: { sub: string };
    },
  ) {
    return this.reviewsService.createOrUpdate(
      id,
      req.user!.sub,
      dto,
    );
  }

  @Roles('customer', 'admin')
  @Delete('reviews/:id')
  remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: Request & {
      user?: { sub: string };
      role?: string;
    },
  ) {
    return this.reviewsService.delete(
      id,
     req.user?.sub ?? '',
      req.role === 'admin',
    );
  }
}