import { NotFoundError } from '@app/application/errors/not-found.error';
import { DEVICE_REPOSITORY, Device } from '@app/domain';
import type {
  CreateDeviceInput,
  UpdateDeviceInput,
} from '@app/domain/auth/types/device.type';
import { PrismaDeviceRepository } from '@app/infra';
import type { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class DevicesService {
  constructor(
    @Inject(DEVICE_REPOSITORY)
    private readonly deviceRepository: PrismaDeviceRepository,
  ) {}

  async create(
    input: CreateDeviceInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Device> {
    return await this.deviceRepository.create(input, tx);
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<Device> {
    const dev = await this.deviceRepository.findById(id, tx);
    if (!dev) throw new NotFoundError('Device', 'id', id);
    return dev;
  }

  async findByDeviceId(
    deviceId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Device | null> {
    return this.deviceRepository.findByDeviceId(deviceId, tx);
  }

  async findByUserId(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Device[]> {
    return this.deviceRepository.findByUserId(userId, tx);
  }

  async list(
    params?: Partial<{ skip: number; take: number; userId?: string }>,
    tx?: Prisma.TransactionClient,
  ): Promise<Device[]> {
    return this.deviceRepository.list(params, tx);
  }

  async update(
    id: string,
    input: UpdateDeviceInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Device> {
    const existing = await this.deviceRepository.findById(id, tx);
    if (!existing) throw new NotFoundError('Device', 'id', id);
    return this.deviceRepository.update(id, input, tx);
  }

  async revoke(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const existing = await this.deviceRepository.findById(id, tx);
    if (!existing) throw new NotFoundError('Device', 'id', id);
    return this.deviceRepository.revoke(id, tx);
  }
}
