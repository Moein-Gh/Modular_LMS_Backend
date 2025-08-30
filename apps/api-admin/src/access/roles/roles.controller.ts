import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard, RoleService } from '@app/application';
import type { DomainRole } from '@app/domain';
import { CreateRoleDto } from './dtos/create-role.dto';

type ListRolesQuery = {
  search?: string;
  skip?: number;
  take?: number;
  orderBy?: 'createdAt' | 'name' | 'key';
  orderDir?: 'asc' | 'desc';
};

@UseGuards(AccessTokenGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  create(@Body() dto: CreateRoleDto): Promise<DomainRole> {
    return this.roleService.create(dto);
  }

  @Get()
  findAll(@Query() q: ListRolesQuery) {
    return this.roleService.findAll({
      search: q.search,
      skip: q.skip ?? 0,
      take: q.take ?? 20,
      orderBy: q.orderBy ?? 'createdAt',
      orderDir: q.orderDir ?? 'desc',
    });
  }

  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.roleService.getById(id);
  }

  @Delete(':id')
  delete(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.roleService.delete(id);
  }
}
