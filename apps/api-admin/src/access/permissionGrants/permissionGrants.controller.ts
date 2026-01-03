import {
  CurrentUserId,
  PaginatedResponseDto,
  PaginationQueryDto,
  PermissionGrantsService,
} from '@app/application';
import { PermissionGrant } from '@app/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UUID_V4_PIPE } from '../../common/pipes/UUID.pipe';
import {
  CreatePermissionGrantDto,
  UpdatePermissionGrantDto,
} from './dtos/create-permission-grant.dto';

@Controller('permission-grants')
export class PermissionGrantsController {
  constructor(
    private readonly permissionGrantService: PermissionGrantsService,
  ) {}

  @Post()
  create(@Body() dto: CreatePermissionGrantDto) {
    return this.permissionGrantService.create(dto);
  }

  @Get(':id')
  getById(@Param('id', UUID_V4_PIPE) id: string) {
    return this.permissionGrantService.getById(id);
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<PermissionGrant>> {
    const { items, totalItems, page, pageSize } =
      await this.permissionGrantService.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/permission-grants?page=${p}&pageSize=${s}`,
    });
  }

  @Put(':id')
  update(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: UpdatePermissionGrantDto,
  ) {
    return this.permissionGrantService.update(id, dto);
  }

  @Delete(':id')
  softDelete(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() CurrentUserId: string,
  ) {
    return this.permissionGrantService.softDelete(id, CurrentUserId);
  }
}
