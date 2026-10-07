import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { UserRole } from '../auth/user-role.js';
import { SetStockDto } from './dto/set-stock.dto.js';
import { Stock } from './stock.entity.js';
import { StockService } from './stock.service.js';

@Controller('stock')
@UseGuards(AuthGuard, RolesGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get(':product')
  get(
    @Param('product') product: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Stock> {
    return this.stockService.get(req.user.tenantId, product);
  }

  @Put()
  @Roles(UserRole.Admin)
  set(
    @Body() dto: SetStockDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Stock> {
    return this.stockService.set(dto, req.user.tenantId);
  }
}
