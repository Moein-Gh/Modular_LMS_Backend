import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { IdentityService, NotFoundError, UsersService } from '@app/application';
import { ListUsersDto } from './dtos/list-users.dto';
import { GetUserDto } from './dtos/get-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { DomainUser } from '@app/domain';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly identityService: IdentityService,
  ) {}

  async findUserAndIdentity(id: string): Promise<DomainUser> {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (!user.isActive) throw new NotFoundException('User is not active');

    const identity = await this.identityService.findOne({
      id: user.identityId,
    });

    if (!identity) throw new NotFoundError('Identity', 'id', user.identityId);

    return {
      id: user.id,
      isActive: user.isActive,
      identityId: user.identityId,
      identity,
    };
  }

  @Get()
  async findAll(): Promise<ListUsersDto[]> {
    const users = await this.usersService.findAll(true);
    return users.map((u) => ({
      id: u.id,
      email: u.identity?.email ?? '',
      isActive: u.isActive,
      identityId: u.identityId,
      identity: u.identity!,
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GetUserDto> {
    const user = await this.findUserAndIdentity(id);
    return {
      id: user.id,
      isActive: user.isActive,
      identityId: user.identityId,
      identity: user.identity!,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<GetUserDto> {
    const user = await this.findUserAndIdentity(id);
    if (!user) throw new NotFoundError('User', 'id', id);

    const updated = await this.usersService.updateUser(id, {
      isActive: dto.isActive,
      identityId: dto.identityId,
    });
    if (!updated) throw new NotFoundError('User', 'id', id);
    return {
      id: updated.id,
      isActive: updated.isActive,
      identityId: updated.identityId,
      identity: updated.identity!,
    };
  }
}
