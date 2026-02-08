import { Permissions, RolePermissionsService } from '@app/application';
import { type RolePermission } from '@app/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UUID_V4_PIPE } from '../../common/pipes/UUID.pipe';
import { CreateRolePermissionDto } from './dtos/create-role-permission.dto';
import { UpdateRolePermissionDto } from './dtos/update-role-permission.dto';

@ApiTags('Role Permissions')
@Controller('role-permissions')
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  @Permissions('admin/rolePermission/create')
  @Post()
  @ApiOperation({
    summary: 'Create a new role-permission mapping',
    description: 'Grants a permission to a role',
  })
  create(@Body() dto: CreateRolePermissionDto): Promise<RolePermission> {
    return this.rolePermissionsService.create(dto);
  }

  @Permissions('admin/rolePermission/list')
  @Get()
  @ApiOperation({
    summary: 'List all role-permission mappings',
    description: 'Returns all role-permission associations',
  })
  list(): Promise<RolePermission[]> {
    return this.rolePermissionsService.list();
  }

  @Permissions('admin/rolePermission/listByRole')
  @Get('by-role/:roleId')
  @ApiOperation({
    summary: 'Get all permissions for a role',
    description: 'Returns all permission associations for the specified role',
  })
  findByRoleId(
    @Param('roleId', UUID_V4_PIPE) roleId: string,
  ): Promise<RolePermission[]> {
    return this.rolePermissionsService.findByRoleId(roleId);
  }

  @Permissions('admin/rolePermission/listByPermission')
  @Get('by-permission/:permissionId')
  @ApiOperation({
    summary: 'Get all roles for a permission',
    description: 'Returns all role associations for the specified permission',
  })
  findByPermissionId(
    @Param('permissionId', UUID_V4_PIPE) permissionId: string,
  ): Promise<RolePermission[]> {
    return this.rolePermissionsService.findByPermissionId(permissionId);
  }

  @Permissions('admin/rolePermission/getById')
  @Get(':id')
  @ApiOperation({
    summary: 'Get a role-permission mapping by ID',
    description: 'Returns a specific role-permission association',
  })
  getById(@Param('id', UUID_V4_PIPE) id: string): Promise<RolePermission> {
    return this.rolePermissionsService.getById(id);
  }

  @Permissions('admin/rolePermission/update')
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a role-permission mapping',
    description: 'Updates an existing role-permission association',
  })
  update(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: UpdateRolePermissionDto,
  ): Promise<RolePermission> {
    return this.rolePermissionsService.update(id, dto);
  }

  @Permissions('admin/rolePermission/delete')
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a role-permission mapping',
    description: 'Removes the permission from the role',
  })
  delete(@Param('id', UUID_V4_PIPE) id: string): Promise<void> {
    return this.rolePermissionsService.delete(id);
  }
}
