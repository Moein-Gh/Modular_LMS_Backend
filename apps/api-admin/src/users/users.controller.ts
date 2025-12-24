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

import {
  CurrentUserId,
  IdentitiesService,
  NotFoundError,
  PaginatedResponseDto,
  PaginationQueryDto,
  RegisterUserInput,
  RegisterUserUseCase,
  UsersService,
} from '@app/application';
import { Permissions } from '@app/application/decorators/permissions.decorator';
import { User } from '@app/domain';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';
import { GetUserDto } from './dtos/get-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

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
      isActive: user.isActive,
      identityId: user.identityId,
      identity,
      balanceSummary: user.balanceSummary,
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
      isActive: user.isActive,
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

    // Only allow isActive to be changed when editing other users
    const canChangeIsActive = !currentUserId || currentUserId !== id;
    const userUpdate: { isActive?: boolean } = {};
    if (canChangeIsActive && dto.isActive !== undefined) {
      userUpdate.isActive = dto.isActive;
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
      isActive: updated.isActive,
      code: updated.code,
      identityId: updated.identityId,
      identity: {
        id: user.identity!.id!,
        name: user.identity!.name!,
        email: user.identity!.email!,
        phone: user.identity?.countryCode + user.identity!.phone!,
        createdAt: user.identity!.createdAt!,
        updatedAt: user.identity!.updatedAt!,
      },
    };
  }

  // delete user
  @Permissions('user/delete')
  @Delete(':id')
  async deleteUser(@Param('id', UUID_V4_PIPE) id: string): Promise<void> {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');

    await this.usersService.delete(id);
  }
}
