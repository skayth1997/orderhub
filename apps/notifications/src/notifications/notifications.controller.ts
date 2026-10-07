import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { Notification } from './notification.schema.js';
import { PaginationQueryDto } from './pagination-query.dto.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @Req() req: AuthenticatedRequest,
    @Query() query: PaginationQueryDto,
  ): Promise<Notification[]> {
    return this.notifications.findForTenant(
      req.user.tenantId,
      query.page,
      query.limit,
    );
  }
}
