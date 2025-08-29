import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreatePermissionGrantDto,
  UpdatePermissionGrantDto,
} from './dtos/create-permission-grant.dto';
import { AccessTokenGuard, PermissionGrantService } from '@app/application';

@UseGuards(AccessTokenGuard)
@Controller('permission-grants')
export class PermissionGrantsController {
  constructor(
    private readonly permissionGrantService: PermissionGrantService,
  ) {}

  @Post()
  create(@Body() dto: CreatePermissionGrantDto) {
    return this.permissionGrantService.create(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.permissionGrantService.getById(id);
  }

  @Get()
  list(@Query() query: Record<string, any>) {
    return this.permissionGrantService.list(query);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePermissionGrantDto) {
    return this.permissionGrantService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.permissionGrantService.delete(id);
  }
}
