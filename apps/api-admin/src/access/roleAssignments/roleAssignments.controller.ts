import { AccessTokenGuard, RoleAssignmentService } from '@app/application';
import { DomainRoleAssignment, OrderDirection } from '@app/domain';
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
import { CreateRoleAssignmentDto } from './dtos/create-role-assignment.dto';
import { ListRoleAssignmentQueryDto } from './dtos/list-role-assignment-query.dto';
import { UUID_V4_PIPE } from '../../common/pipes/UUID.pipe';
@UseGuards(AccessTokenGuard)
@Controller('role-assignments')
export class RoleAssignmentsController {
  constructor(private readonly roleAssignmentService: RoleAssignmentService) {}

  @Post()
  async create(
    @Body() dto: CreateRoleAssignmentDto,
  ): Promise<DomainRoleAssignment> {
    // after implementing authentication add AssignedBy as the current user
    return this.roleAssignmentService.create(dto);
  }

  @Get()
  async findAll(@Query() query: ListRoleAssignmentQueryDto) {
    return this.roleAssignmentService.findAll({
      ...query,
      skip: query.skip ?? 0,
      take: query.take ?? 20,
      orderBy: query.orderBy ?? 'createdAt',
      orderDir: query.orderDir ?? OrderDirection.DESC,
      userId: query.userId,
      includeUser: query.includeUser,
      includeRole: query.includeRole,
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
