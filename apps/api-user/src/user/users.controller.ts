import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import {
  CurrentUserId,
  GetUpcomingPaymentsQueryDto,
  UpcomingPaymentsResponseDto,
  UsersService,
} from '@app/application';

import { Permissions } from '@app/application/decorators/permissions.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // get user's upcoming payments
  @Permissions('user/user/get')
  @Get('/upcoming-payments')
  @ApiOperation({
    summary: "Get user's upcoming payments",
    description:
      'Returns a list of upcoming loan installments and subscription fees grouped by Persian calendar month. ' +
      'Includes payment status, transaction details, and monthly totals. ' +
      'Past unpaid payments are always included. Use includePastPaid query parameter to also retrieve paid past payments.',
  })
  @ApiQuery({
    name: 'includePastPaid',
    required: false,
    type: Boolean,
    description: 'Include fully paid past months in the response',
  })
  async getUpcomingPayments(
    @Query() query: GetUpcomingPaymentsQueryDto,
    @CurrentUserId() currentUserId: string,
  ): Promise<UpcomingPaymentsResponseDto> {
    return this.usersService.getUserUpcomingPayments(currentUserId, query);
  }
}
