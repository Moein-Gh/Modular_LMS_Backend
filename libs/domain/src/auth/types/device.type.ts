import { Device } from '../entities/device.entity';

export type CreateDeviceInput = Omit<
  Device,
  | 'id'
  | 'createdAt'
  | 'isDeleted'
  | 'deletedAt'
  | 'deletedBy'
  | 'ownerId'
  | 'createdBy'
  | 'revoked'
> & {
  revoked?: boolean;
};

export type UpdateDeviceInput = Partial<CreateDeviceInput>;

export interface ListDevicesParams {
  userId?: string;
  skip?: number;
  take?: number;
}
