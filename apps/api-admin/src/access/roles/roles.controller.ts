import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard, RoleService } from '@app/application';
import { OrderDirection, type DomainRole } from '@app/domain';
import { CreateRoleDto } from './dtos/create-role.dto';
import { ListRolesQuery } from './dtos/list-role.dto';
import { UUID_V4_PIPE } from '../../common/pipes/UUID.pipe';

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
      orderDir: q.orderDir ?? OrderDirection.DESC,
    });
  }

  @Get(':id')
  getById(@Param('id', UUID_V4_PIPE) id: string) {
    return this.roleService.getById(id);
  }

  @Delete(':id')
  delete(@Param('id', UUID_V4_PIPE) id: string) {
    return this.roleService.delete(id);
  }
}
