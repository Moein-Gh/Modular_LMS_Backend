import type { GrantType, PermissionGrant } from '@app/domain';
import {
  CreatePermissionGrantInput,
  PermissionGrantRepository,
  UpdatePermissionGrantInput,
} from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';

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
  isDeleted: true,
  deletedAt: true,
  deletedBy: true,
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
    isDeleted: model.isDeleted,
    deletedAt: model.deletedAt ?? undefined,
    deletedBy: model.deletedBy ?? undefined,
  };
}

@Injectable()
export class PrismaPermissionGrantRepository
  implements PermissionGrantRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PermissionGrant | null> {
    const model = await this.prisma.permissionGrant.findFirst({
      where: { id, isDeleted: false },
      select: permissionGrantSelect,
    });
    return model ? toDomain(model) : null;
  }

  async findAll(
    options?: Prisma.PermissionGrantFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<PermissionGrant[]> {
    const prisma = tx ?? this.prisma;

    const items = await prisma.permissionGrant.findMany({
      ...(options ?? {}),
      where: {
        isDeleted: false,
        ...(options?.where ?? {}),
      },
      select: permissionGrantSelect,
    });

    return items.map((m) => toDomain(m as PermissionGrantModel));
  }

  async count(
    where?: Prisma.PermissionGrantWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = (tx ?? this.prisma) as PrismaService;
    return prisma.permissionGrant.count({
      where: {
        isDeleted: false,
        ...(where ?? {}),
      } as Prisma.PermissionGrantWhereInput,
    });
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

  async softDelete(id: string, currentUserId: string): Promise<void> {
    await this.prisma.permissionGrant.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: currentUserId,
      },
    });
  }
}
