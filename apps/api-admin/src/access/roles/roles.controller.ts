import {
  CurrentUserId,
  PaginatedResponseDto,
  PaginationQueryDto,
  RolesService,
} from '@app/application';
import { type Role } from '@app/domain';
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
import { CreateRoleDto } from './dtos/create-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly roleService: RolesService) {}

  @Post()
  create(@Body() dto: CreateRoleDto): Promise<Role> {
    return this.roleService.create(dto);
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Role>> {
    const { items, totalItems, page, pageSize } =
      await this.roleService.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/roles?page=${p}&pageSize=${s}`,
    });
  }

  @Get(':id')
  getById(@Param('id', UUID_V4_PIPE) id: string) {
    return this.roleService.getById(id);
  }

  @Delete(':id')
  softDelete(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() CurrentUserId: string,
  ) {
    return this.roleService.softDelete(id, CurrentUserId);
  }
}
