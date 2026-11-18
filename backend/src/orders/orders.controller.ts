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
  @Roles('customer')
  @Post()
  create(@Body() createOrderDto: CreateOrderDto,
          @Req() req:Request & {user?:{sub:string,email:string}}) {
    return this.ordersService.create(createOrderDto,{
      sub:req.user!.sub,
      email:req.user!.email,
    });
  }

  @Roles('customer', 'branchManager', 'admin')
@Get()
findAll(
  @Query() query: OrderQueryDto,
  @Req() req: Request & {
    role?: string;
    user?: { sub: string; branchId?: string };
  },
) {
  return this.ordersService.findAll(query, req.role, req.user);
}
  
@Roles('customer', 'branchManager', 'admin')
@Get(':id')
async findOne(
  @Param('id', ParseObjectIdPipe) id: string,
  @Query() query: OrderLookupQueryDto,
  @Req() req: Request & {
    role?: string;
    user?: { sub: string; branchId?: string };
  },
) {
  return this.ordersService.findOne(
    id.toString(),
    req.role ?? 'visitor',
    req.user,
    query.branchId,
  );
}

  
  @Roles('branchManager', 'admin')
@Patch(':id/status')
updateStatus(
  @Param('id', ParseObjectIdPipe) id: string,
  @Body() body: UpdateOrderStatusDto,
  @Req() req: Request & {
    role?: string;
    user?: { branchId?: string };
  },
) {
  const branchId =
    req.role === 'branchManager'
      ? req.user?.branchId
      : body.branchId;

  return this.ordersService.updateStatus(
    id.toString(),
    body.status,
    branchId!,
    req.role ?? 'visitor',
  );
}
}
