import type { Device } from '@app/domain/auth/entities/device.entity';
import type { IDeviceRepository } from '@app/domain/auth/repositories/device.repository';
import type {
  CreateDeviceInput,
  UpdateDeviceInput,
} from '@app/domain/auth/types/device.type';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';

const deviceSelect: Prisma.DeviceSelect = {
  id: true,
  deviceId: true,
  userId: true,
  deviceName: true,
  ip: true,
  userAgent: true,
  lastSeen: true,
  createdAt: true,
  revoked: true,
};

type DeviceModel = Prisma.DeviceGetPayload<{ select: typeof deviceSelect }>;

function toDomain(model: DeviceModel): Device {
  return {
    id: model.id,
    deviceId: model.deviceId,
    userId: model.userId,
    deviceName: model.deviceName ?? null,
    ip: model.ip ?? null,
    userAgent: model.userAgent ?? null,
    lastSeen: model.lastSeen,
    createdAt: model.createdAt,
    revoked: model.revoked,
    isDeleted: false,
    deletedAt: undefined,
    deletedBy: undefined,
    ownerId: undefined,
    createdBy: undefined,
  } as Device;
}

@Injectable()
export class PrismaDeviceRepository implements IDeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Device | null> {
    const prisma = (tx ?? this.prisma) as PrismaService;
    const model = await prisma.device.findUnique({
      where: { id },
      select: deviceSelect,
    });
    return model ? toDomain(model as DeviceModel) : null;
  }

  async findByDeviceId(
    deviceId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Device | null> {
    const prisma = (tx ?? this.prisma) as PrismaService;
    const model = await prisma.device.findFirst({
      where: { deviceId },
      select: deviceSelect,
    });
    return model ? toDomain(model as DeviceModel) : null;
  }

  async findByUserId(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Device[]> {
    const prisma = (tx ?? this.prisma) as PrismaService;
    const items = await prisma.device.findMany({
      where: { userId },
      select: deviceSelect,
    });
    return items.map((m) => toDomain(m as DeviceModel));
  }

  async list(
    params?: Partial<{ skip: number; take: number; userId?: string }>,
    tx?: Prisma.TransactionClient,
  ): Promise<Device[]> {
    const prisma = (tx ?? this.prisma) as PrismaService;
    const items = await prisma.device.findMany({
      where: params?.userId ? { userId: params.userId } : undefined,
      skip: params?.skip,
      take: params?.take,
      select: deviceSelect,
    });
    return items.map((m) => toDomain(m as DeviceModel));
  }

  async create(
    input: CreateDeviceInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Device> {
    const prisma = (tx ?? this.prisma) as PrismaService;
    const created = await prisma.device.create({
      data: {
        deviceId: input.deviceId,
        userId: input.userId,
        deviceName: input.deviceName ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        lastSeen: new Date(),
        revoked: input.revoked ?? false,
      },
      select: deviceSelect,
    });
    return toDomain(created as DeviceModel);
  }

  async update(
    id: string,
    input: UpdateDeviceInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Device> {
    const prisma = (tx ?? this.prisma) as PrismaService;
    const lastSeen = (input as { lastSeen?: Date | undefined }).lastSeen;
    const updated = await prisma.device.update({
      where: { id },
      data: {
        deviceName: input.deviceName ?? undefined,
        ip: input.ip ?? undefined,
        userAgent: input.userAgent ?? undefined,
        lastSeen: lastSeen ?? undefined,
        revoked: input.revoked ?? undefined,
      },
      select: deviceSelect,
    });
    return toDomain(updated as DeviceModel);
  }

  async revoke(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = (tx ?? this.prisma) as PrismaService;
    await prisma.device.update({
      where: { id },
      data: {
        revoked: true,
      },
    });
  }
}
