import {
  AccessTokenGuard,
  PaginatedResponseDto,
  PaginationQueryDto,
  RoleAssignmentService,
} from '@app/application';
import { RoleAssignment } from '@app/domain';
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
import { CreateRoleAssignmentDto } from './dtos/create-role-assignment.dto';
@UseGuards(AccessTokenGuard)
@Controller('role-assignments')
export class RoleAssignmentsController {
  constructor(private readonly roleAssignmentService: RoleAssignmentService) {}

  @Post()
  async create(@Body() dto: CreateRoleAssignmentDto): Promise<RoleAssignment> {
    // after implementing authentication add AssignedBy as the current user
    return this.roleAssignmentService.create(dto);
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const { items, totalItems, page, pageSize } =
      await this.roleAssignmentService.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/role-assignments?page=${p}&pageSize=${s}`,
    });
  }

  @Get(':id')
  getById(@Param('id', UUID_V4_PIPE) id: string) {
    return this.roleAssignmentService.getById(id);
  }

  @Delete(':id')
  delete(@Param('id', UUID_V4_PIPE) id: string) {
    return this.roleAssignmentService.delete(id);
  }
}
