import { DevicesService } from '@app/application';
import { Device } from '@app/domain/auth/entities/device.entity';
import {
  CreateDeviceInput,
  UpdateDeviceInput,
} from '@app/domain/auth/types/device.type';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

@Controller('devices')
export class DeviceController {
  constructor(private readonly devices: DevicesService) {}

  @Post()
  async create(@Body() body: CreateDeviceInput): Promise<Device> {
    return this.devices.create(body);
  }

  @Get()
  async list(@Query('userId') userId?: string): Promise<Device[]> {
    return this.devices.list(userId ? { userId } : undefined);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<Device> {
    return this.devices.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateDeviceInput,
  ): Promise<Device> {
    return this.devices.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.devices.delete(id);
  }
}
