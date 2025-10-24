import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  AccessTokenGuard,
  IdentitiesService,
  NotFoundError,
  PaginatedResponseDto,
  PaginationQueryDto,
  RegisterUserInput,
  RegisterUserUseCase,
  UsersService,
} from '@app/application';
import { User } from '@app/domain';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';
import { GetUserDto } from './dtos/get-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
@UseGuards(AccessTokenGuard)
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
      isActive: user.isActive,
      identityId: user.identityId,
      identity,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  registerUser(@Body() body: RegisterUserInput) {
    return this.registerUserUseCase.execute(body);
  }

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

  @Get(':id')
  async findOne(@Param('id', UUID_V4_PIPE) id: string): Promise<GetUserDto> {
    const user = await this.findUserAndIdentity(id);
    return {
      id: user.id,
      isActive: user.isActive,
      identityId: user.identityId,
      identity: {
        id: user.identity!.id!,
        name: user.identity!.name!,
      },
    };
  }

  @Patch(':id')
  async update(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<GetUserDto> {
    const user = await this.findUserAndIdentity(id);
    if (!user) throw new NotFoundError('User', 'id', id);

    const updated = await this.usersService.update(id, {
      isActive: dto.isActive,
      identityId: dto.identityId,
    });
    if (!updated) throw new NotFoundError('User', 'id', id);
    return {
      id: updated.id,
      isActive: updated.isActive,
      identityId: updated.identityId,
      identity: {
        id: user.identity!.id!,
        name: user.identity!.name!,
      },
    };
  }
}
