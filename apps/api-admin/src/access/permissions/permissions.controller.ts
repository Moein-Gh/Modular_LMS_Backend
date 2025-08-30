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
import { AccessTokenGuard, PermissionService } from '@app/application';
import { OrderDirection, type DomainPermission } from '@app/domain';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { ListPermissionsQuery } from './dtos/list-permission.dto';
import { UUID_V4_PIPE } from '../../common/pipes/UUID.pipe';

@UseGuards(AccessTokenGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  create(@Body() dto: CreatePermissionDto): Promise<DomainPermission> {
    return this.permissionService.create(dto);
  }

  @Get()
  findAll(@Query() q: ListPermissionsQuery) {
    return this.permissionService.findAll({
      ...q,
      skip: q.skip ?? 0,
      take: q.take ?? 20,
      orderBy: q.orderBy ?? 'createdAt',
      orderDir: q.orderDir ?? OrderDirection.DESC,
    });
  }

  @Get(':id')
  getById(@Param('id', UUID_V4_PIPE) id: string) {
    return this.permissionService.getById(id);
  }

  @Delete(':id')
  delete(@Param('id', UUID_V4_PIPE) id: string) {
    return this.permissionService.delete(id);
  }
}
