import {
  CurrentUserId,
  PaginatedResponseDto,
  PaginationQueryDto,
  PermissionsService,
} from '@app/application';
import { type Permission } from '@app/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UUID_V4_PIPE } from '../../common/pipes/UUID.pipe';
import { CreatePermissionDto } from './dtos/create-permission.dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionService: PermissionsService) {}

  @Post()
  create(@Body() dto: CreatePermissionDto): Promise<Permission> {
    return this.permissionService.create(dto);
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Permission>> {
    const { items, totalItems, page, pageSize } =
      await this.permissionService.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/permissions?page=${p}&pageSize=${s}`,
    });
  }

  @Get(':id')
  getById(@Param('id', UUID_V4_PIPE) id: string) {
    return this.permissionService.getById(id);
  }

  @Delete(':id')
  softDelete(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() currentUserId: string,
  ) {
    return this.permissionService.softDelete(id, currentUserId);
  }
}
