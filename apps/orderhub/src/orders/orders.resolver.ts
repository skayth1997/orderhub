import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { TenantRateLimitGuard } from '../rate-limit/tenant-rate-limit.guard.js';
import { UserRole } from '../users/user.entity.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { Order } from './order.entity.js';
import { OrdersService } from './orders.service.js';

type GraphQLContext = { req: AuthenticatedRequest };

@Resolver(() => Order)
@UseGuards(AuthGuard, RolesGuard, TenantRateLimitGuard)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Query(() => [Order])
  orders(
    @Context() context: GraphQLContext,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<Order[]> {
    return this.ordersService.findAll(
      context.req.user.tenantId,
      page,
      Math.min(limit, 100),
    );
  }

  @Query(() => Order)
  order(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @Context() context: GraphQLContext,
  ): Promise<Order> {
    return this.ordersService.findOne(id, context.req.user.tenantId);
  }

  @Mutation(() => Order)
  @Roles(UserRole.Admin, UserRole.Manager)
  createOrder(
    @Args('input') input: CreateOrderDto,
    @Context() context: GraphQLContext,
  ): Promise<Order> {
    return this.ordersService.create(input, context.req.user.tenantId);
  }
}
