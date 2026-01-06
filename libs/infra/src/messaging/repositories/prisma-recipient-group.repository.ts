import type {
  CreateRecipientGroupInput,
  IRecipientGroupRepository,
  RecipientGroup,
  RecipientGroupCriteria,
  UpdateRecipientGroupInput,
} from '@app/domain';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import { Prisma, type PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class PrismaRecipientGroupRepository
  implements IRecipientGroupRepository
{
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaClient,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
  ) {}

  async count(
    where?: Prisma.RecipientGroupWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.recipientGroup.count({
      where: { isDeleted: false, ...where },
    });
  }

  async findAll(
    options?: Prisma.RecipientGroupFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<RecipientGroup[]> {
    const prisma = tx ?? this.prisma;
    const groups = await prisma.recipientGroup.findMany({
      ...options,
      where: { isDeleted: false, ...options?.where },
    });
    return groups.map((g) => this.toDomain(g));
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RecipientGroup | null> {
    const prisma = tx ?? this.prisma;
    const group = await prisma.recipientGroup.findUnique({
      where: { isDeleted: false, id },
    });
    if (!group) return null;
    return this.toDomain(group);
  }

  async findByName(
    name: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RecipientGroup | null> {
    const prisma = tx ?? this.prisma;
    const group = await prisma.recipientGroup.findUnique({
      where: { isDeleted: false, name },
    });
    if (!group) return null;
    return this.toDomain(group);
  }

  async create(
    data: CreateRecipientGroupInput,
    tx?: Prisma.TransactionClient,
  ): Promise<RecipientGroup> {
    const prisma = tx ?? this.prisma;
    const group = await prisma.recipientGroup.create({
      data: {
        name: data.name,
        description: data.description,
        criteria: data.criteria as Prisma.InputJsonValue,
        isActive: data.isActive ?? true,
        createdBy: data.createdBy,
      },
    });
    return this.toDomain(group);
  }

  async update(
    id: string,
    data: UpdateRecipientGroupInput,
    tx?: Prisma.TransactionClient,
  ): Promise<RecipientGroup> {
    const prisma = tx ?? this.prisma;
    const group = await prisma.recipientGroup.update({
      where: { isDeleted: false, id },
      data: {
        name: data.name,
        description: data.description,
        criteria: data.criteria as Prisma.InputJsonValue | undefined,
        isActive: data.isActive,
      },
    });
    return this.toDomain(group);
  }

  async softDelete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.recipientGroup.update({
      where: { isDeleted: false, id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async restore(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RecipientGroup> {
    const prisma = tx ?? this.prisma;
    const group = await prisma.recipientGroup.update({
      where: { isDeleted: true, id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
    });
    return this.toDomain(group);
  }

  private toDomain(
    group: Prisma.RecipientGroupGetPayload<object>,
  ): RecipientGroup {
    return {
      id: group.id,
      code: group.code,
      name: group.name,
      description: group.description,
      criteria: group.criteria as RecipientGroupCriteria,
      isActive: group.isActive,
      createdBy: group.createdBy,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      isDeleted: group.isDeleted,
      deletedAt: group.deletedAt,
      deletedBy: group.deletedBy,
    };
  }
}
