import { Device } from '../entities/device.entity';
import {
  CreateDeviceInput,
  ListDevicesParams,
  UpdateDeviceInput,
} from '../types/device.type';

export interface IDeviceRepository {
  findById(id: string): Promise<Device | null>;
  findByDeviceId(deviceId: string): Promise<Device | null>;
  findByUserId(userId: string): Promise<Device[]>;
  list(params?: ListDevicesParams): Promise<Device[]>;
  create(input: CreateDeviceInput): Promise<Device>;
  update(id: string, input: UpdateDeviceInput): Promise<Device>;
  delete(id: string): Promise<void>;
}

export const DEVICE_REPOSITORY = Symbol('DEVICE_REPOSITORY');
