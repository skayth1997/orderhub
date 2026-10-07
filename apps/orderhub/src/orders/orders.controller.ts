import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { UserRole } from '../users/user.entity.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { Order } from './order.entity.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
@UseGuards(AuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Manager)
  create(
    @Body() dto: CreateOrderDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Order> {
    return this.ordersService.create(dto, req.user.tenantId);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest): Promise<Order[]> {
    return this.ordersService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Order> {
    return this.ordersService.findOne(id, req.user.tenantId);
  }
}
