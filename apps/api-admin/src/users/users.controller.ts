import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import {
  CurrentUserId,
  GetUpcomingPaymentsQueryDto,
  IdentitiesService,
  NotFoundError,
  PaginatedResponseDto,
  PaginationQueryDto,
  PaymentSummaryDto,
  RegisterUserInput,
  RegisterUserUseCase,
  UpcomingPaymentsResponseDto,
  UsersService,
} from '@app/application';
import { Permissions } from '@app/application/decorators/permissions.decorator';
import { User, UserStatus } from '@app/domain';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';
import { GetUserDto } from './dtos/get-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly identityService: IdentitiesService,
    private readonly registerUserUseCase: RegisterUserUseCase,
  ) {}

  async findUserAndIdentity(id: string): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const identity = await this.identityService.findById(user.identityId);

    if (!identity) throw new NotFoundError('Identity', 'id', user.identityId);

    return {
      id: user.id,
      code: user.code,
      status: user.status,
      identityId: user.identityId,
      identity,
      balanceSummary: user.balanceSummary,
      isDeleted: user.isDeleted,
      deletedAt: user.deletedAt,
      deletedBy: user.deletedBy,
    };
  }

  @Permissions('user/create')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  registerUser(@Body() body: RegisterUserInput) {
    return this.registerUserUseCase.execute(body);
  }

  @Permissions('user/get')
  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<User>> {
    const { items, totalItems, page, pageSize } =
      await this.usersService.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/users?page=${p}&pageSize=${s}`,
    });
  }

  @Permissions('user/get')
  @Get(':id')
  async findOne(@Param('id', UUID_V4_PIPE) id: string): Promise<GetUserDto> {
    const user = await this.findUserAndIdentity(id);
    return {
      id: user.id,
      status: user.status,
      code: user.code,
      identityId: user.identityId,
      balanceSummary: user.balanceSummary,
      identity: {
        id: user.identity!.id!,
        name: user.identity!.name!,
        email: user.identity!.email!,
        countryCode: user.identity!.countryCode!,
        phone: user.identity!.phone!,
        createdAt: user.identity!.createdAt!,
        updatedAt: user.identity!.updatedAt!,
      },
    };
  }

  @Permissions('user/update')
  @Patch(':id')
  async update(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUserId() currentUserId?: string,
  ): Promise<GetUserDto> {
    const user = await this.findUserAndIdentity(id);
    if (!user) throw new NotFoundError('User', 'id', id);

    // Only allow status to be changed when editing other users
    const canChangeStatus = !currentUserId || currentUserId !== id;
    const userUpdate: { status?: UserStatus } = {};
    if (canChangeStatus && dto.status !== undefined) {
      userUpdate.status = dto.status;
    }

    // Call usersService.update only if there is something to update at user-level
    const updated = Object.keys(userUpdate).length
      ? await this.usersService.update(id, userUpdate)
      : user;

    await this.identityService.update(user.identityId, {
      name: dto.name,
      phone: dto.phone,
      countryCode: dto.countryCode,
      email: dto.email,
    });

    if (!updated) throw new NotFoundError('User', 'id', id);
    return {
      id: updated.id,
      status: updated.status,
      code: updated.code,
      identityId: updated.identityId,
      balanceSummary: updated.balanceSummary,
      identity: {
        id: user.identity!.id!,
        name: user.identity!.name!,
        email: user.identity!.email!,
        countryCode: user.identity!.countryCode!,
        phone: user.identity!.phone!,
        createdAt: user.identity!.createdAt!,
        updatedAt: user.identity!.updatedAt!,
      },
    };
  }

  // delete user
  @Permissions('user/delete')
  @Delete(':id')
  async deleteUser(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<void> {
    await this.usersService.softDelete(id, currentUserId);
  }

  // restore deleted user
  @Permissions('user/restore')
  @Post(':id/restore')
  async restoreUser(
    @Param('id', UUID_V4_PIPE) id: string,
  ): Promise<GetUserDto> {
    return await this.usersService.restore(id);
  }

  // get user's upcoming payments
  @Permissions('user/get')
  @Get(':id/upcoming-payments')
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
    @Param('id', UUID_V4_PIPE) id: string,
    @Query() query: GetUpcomingPaymentsQueryDto,
  ): Promise<UpcomingPaymentsResponseDto> {
    return this.usersService.getUserUpcomingPayments(id, query);
  }

  // get user's payment summary
  @Permissions('user/get')
  @Get(':id/payment-summary')
  @ApiOperation({
    summary: "Get user's payment summary for dashboard",
    description:
      "Returns a summary of the user's payment obligations for the current month and overdue payments. " +
      'Includes only payments due this month plus any past-due payments. ' +
      'This endpoint provides aggregated counts and amounts without detailed item breakdown, ' +
      'ideal for dashboard displays.',
  })
  getPaymentSummary(
    @Param('id', UUID_V4_PIPE) id: string,
  ): Promise<PaymentSummaryDto> {
    return this.usersService.getUserPaymentSummary(id);
  }
}
