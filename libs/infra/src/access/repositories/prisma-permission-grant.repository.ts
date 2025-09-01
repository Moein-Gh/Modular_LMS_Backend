import { Injectable } from '@nestjs/common';
import type { Prisma } from '@generated/prisma';
import {
  PermissionGrantRepository,
  CreatePermissionGrantInput,
  UpdatePermissionGrantInput,
  ListPermissionGrantsParams,
} from '@app/domain';
import type { BaseListResult, PermissionGrant, GrantType } from '@app/domain';
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

type PermissionGrantModel = Prisma.PermissionGrantGetPayload<{
  select: typeof permissionGrantSelect;
}>;

function toDomain(model: PermissionGrantModel): PermissionGrant {
  return {
    id: model.id,
    granteeType: model.granteeType as unknown as GrantType,
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
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PermissionGrant | null> {
    const model = await this.prisma.permissionGrant.findUnique({
      where: { id },
      select: permissionGrantSelect,
    });
    return model ? toDomain(model) : null;
  }

  async findAll(
    params: ListPermissionGrantsParams,
  ): Promise<BaseListResult<PermissionGrant>> {
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

    const [items, total] = await this.prisma.$transaction([
      this.prisma.permissionGrant.findMany({
        where,
        skip,
        take,
        // Cast is safe because orderBy and orderDir are validated at domain layer
        orderBy: {
          [orderBy]: orderDir,
        } as Prisma.PermissionGrantOrderByWithRelationInput,
        select: permissionGrantSelect,
      }),
      this.prisma.permissionGrant.count({ where }),
    ]);

    return { items: items.map(toDomain), total };
  }

  async create(input: CreatePermissionGrantInput): Promise<PermissionGrant> {
    const created = await this.prisma.permissionGrant.create({
      data: {
        granteeType:
          input.granteeType as unknown as Prisma.PermissionGrantUncheckedCreateInput['granteeType'],
        granteeId: input.granteeId,
        permissionId: input.permissionId,
        grantedBy: input.grantedBy ?? null,
        isGranted: input.isGranted ?? true,
        reason: input.reason ?? null,
        expiresAt: input.expiresAt ?? null,
      },
      select: permissionGrantSelect,
    });
    return toDomain(created);
  }

  async update(
    id: string,
    input: UpdatePermissionGrantInput,
  ): Promise<PermissionGrant> {
    const updated = await this.prisma.permissionGrant.update({
      where: { id },
      data: {
        isGranted: input.isGranted,
        reason: input.reason ?? null,
        expiresAt: input.expiresAt ?? null,
      },
      select: permissionGrantSelect,
    });
    return toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.permissionGrant.delete({ where: { id } });
  }
}
