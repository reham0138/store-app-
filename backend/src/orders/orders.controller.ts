import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { OrderLookupQueryDto, OrderQueryDto } from './dto/order-query.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Roles('staff', 'admin')
  @Get()
  findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query() query: OrderLookupQueryDto,
    @Req() req: Request & { role?: string },
  ) {
    const role = req.role ?? 'visitor';
    return this.ordersService.findOne(
      id.toString(),
      query.email,
      role,
      query.branchId,
    );
  }

  @Roles('staff', 'admin')
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: UpdateOrderStatusDto,
    @Req() req: Request & { role?: string },
  ) {
    return this.ordersService.updateStatus(
      id.toString(),
      body.status,
      body.branchId,
      req.role ?? 'visitor',
    );
  }
}
