import {
  CurrentUserId,
  PaymentSummaryDto,
  Permissions,
  UsersService,
} from '@app/application';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly usersService: UsersService) {}

  // get user's payment summary
  @Permissions('user/dashboard/view-payment-summary')
  @Get('/payment-summary')
  @ApiOperation({
    summary: "Get user's payment summary for dashboard",
    description:
      "Returns a summary of the user's payment obligations separated into next month's payments and overdue payments. " +
      'Upcoming shows only the next calendar month payments (e.g., if today is February, shows only March). ' +
      'Overdue shows all past-due payments. Does not include payments due in distant future months. ' +
      'This endpoint provides aggregated counts and amounts without detailed item breakdown, ' +
      'ideal for dashboard displays.',
  })
  getPaymentSummary(
    @CurrentUserId() currentUserId: string,
  ): Promise<PaymentSummaryDto> {
    console.log(currentUserId);
    return this.usersService.getUserPaymentSummary(currentUserId);
  }
}
