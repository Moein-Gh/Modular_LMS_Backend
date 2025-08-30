import { Injectable, Inject } from '@nestjs/common';
import type { PrismaClient, Prisma } from '@generated/prisma';
import {
  PermissionGrantRepository,
  CreatePermissionGrantInput,
  UpdatePermissionGrantInput,
  ListPermissionGrantsParams,
  ListPermissionGrantsResult,
} from '@app/domain';
import type { DomainPermissionGrant } from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';

const permissionGrantSelect: Prisma.PermissionGrantSelect = {
  id: true,
  granteeType: true,
  granteeId: true,
  permissionId: true,
  grantedBy: true,
  isGranted: true,
  reason: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
};

type PermissionGrant = {
  id: string;
  granteeType: 'user' | 'role';
  granteeId: string;
  permissionId: string;
  grantedBy: string;
  isGranted: true;
  reason: string;
  expiresAt: null;
  createdAt: Date;
  updatedAt: Date;
};

function toDomain(model: PermissionGrant): DomainPermissionGrant {
  return {
    id: model.id,
    granteeType: model.granteeType,
    granteeId: model.granteeId,
    permissionId: model.permissionId,
    grantedBy: model.grantedBy ?? undefined,
    isGranted: model.isGranted,
    reason: model.reason ?? undefined,
    expiresAt: model.expiresAt ?? undefined,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

@Injectable()
export class PrismaPermissionGrantRepository
  implements PermissionGrantRepository
{
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<DomainPermissionGrant | null> {
    const model = await this.prisma.permissionGrant.findUnique({
      where: { id },
      select: permissionGrantSelect,
    });
    return model ? toDomain(model as PermissionGrant) : null;
  }

  async findAll(
    params: ListPermissionGrantsParams,
  ): Promise<ListPermissionGrantsResult> {
    const {
      granteeType,
      granteeId,
      permissionId,
      isGranted,
      skip = 0,
      take = 20,
      orderBy = 'createdAt',
      orderDir = 'desc',
    } = params;

    const where: Prisma.PermissionGrantWhereInput = {
      ...(granteeType && { granteeType }),
      ...(granteeId && { granteeId }),
      ...(permissionId && { permissionId }),
      ...(typeof isGranted === 'boolean' ? { isGranted } : {}),
    };

    const order: Prisma.PermissionGrantOrderByWithRelationInput = {
      [orderBy]: orderDir,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.permissionGrant.findMany({
        where,
        skip,
        take,
        orderBy: order,
        select: permissionGrantSelect,
      }),
      this.prisma.permissionGrant.count({ where }),
    ]);

    return { items: items.map(toDomain), total };
  }

  async create(
    input: CreatePermissionGrantInput,
  ): Promise<DomainPermissionGrant> {
    const created = await this.prisma.permissionGrant.create({
      data: {
        granteeType: input.granteeType,
        granteeId: input.granteeId,
        permissionId: input.permissionId,
        grantedBy: input.grantedBy ?? null,
        isGranted: input.isGranted ?? true,
        reason: input.reason ?? null,
        expiresAt: input.expiresAt ?? null,
      },
      select: permissionGrantSelect,
    });
    return toDomain(created as PermissionGrant);
  }

  async update(
    id: string,
    input: UpdatePermissionGrantInput,
  ): Promise<DomainPermissionGrant> {
    const updated = await this.prisma.permissionGrant.update({
      where: { id },
      data: {
        isGranted: input.isGranted,
        reason: input.reason ?? null,
        expiresAt: input.expiresAt ?? null,
      },
      select: permissionGrantSelect,
    });
    return toDomain(updated as PermissionGrant);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.permissionGrant.delete({ where: { id } });
  }
}
