import {
  AccessTokenGuard,
  PaginatedResponseDto,
  PaginationQueryDto,
  RoleService,
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
  UseGuards,
} from '@nestjs/common';
import { UUID_V4_PIPE } from '../../common/pipes/UUID.pipe';
import { CreateRoleDto } from './dtos/create-role.dto';

@UseGuards(AccessTokenGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  create(@Body() dto: CreateRoleDto): Promise<Role> {
    return this.roleService.create(dto);
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
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
  delete(@Param('id', UUID_V4_PIPE) id: string) {
    return this.roleService.delete(id);
  }
}
