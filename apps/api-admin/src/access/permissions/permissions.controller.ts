import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  ParseUUIDPipe, // add
} from '@nestjs/common';
import { PermissionService } from '@app/application';
import type { DomainPermission } from '@app/domain';
import { CreatePermissionDto } from './dtos/create-permission.dto';

type ListPermissionsQuery = {
  search?: string;
  skip?: number;
  take?: number;
  orderBy?: 'createdAt' | 'name' | 'key';
  orderDir?: 'asc' | 'desc';
};

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  create(@Body() dto: CreatePermissionDto): Promise<DomainPermission> {
    return this.permissionService.create(dto);
  }

  @Get()
  list(@Query() q: ListPermissionsQuery) {
    return this.permissionService.list({
      search: q.search,
      skip: q.skip ?? 0,
      take: q.take ?? 20,
      orderBy: q.orderBy ?? 'createdAt',
      orderDir: q.orderDir ?? 'desc',
    });
  }

  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.permissionService.getById(id);
  }

  @Delete(':id')
  delete(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.permissionService.delete(id);
  }
}
