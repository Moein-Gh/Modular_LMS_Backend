import { RoleAssignmentService } from '@app/application';
import { DomainRoleAssignment } from '@app/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateRoleAssignmentDto } from './dtos/create-role-assignment.dto';
import { ListRoleAssignmentQueryDto } from './dtos/list-role-assignment-query.dto';

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
  async list(@Query() query: ListRoleAssignmentQueryDto) {
    return this.roleAssignmentService.list({
      search: query.search,
      skip: query.skip ?? 0,
      take: query.take ?? 20,
      orderBy: query.orderBy ?? 'createdAt',
      orderDir: query.orderDir ?? 'desc',
      userId: query.userId,
      includeUser: query.includeUser,
      includeRole: query.includeRole,
    });
  }

  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.roleAssignmentService.getById(id);
  }

  @Delete(':id')
  delete(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.roleAssignmentService.delete(id);
  }
}
