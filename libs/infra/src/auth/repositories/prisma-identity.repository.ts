import { NotFoundError } from '@app/application';
import {
  CreateIdentityInput,
  Identity,
  IdentityRepository,
  UpdateIdentityInput,
} from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

type IdentityModel = {
  id: string;
  phone: string;
  name: string | null;
  countryCode: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
};

const identitySelect: Prisma.IdentitySelect = {
  id: true,
  phone: true,
  name: true,
  countryCode: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
  deletedAt: true,
  deletedBy: true,
};

function toDomain(model: IdentityModel): Identity {
  return {
    id: model.id,
    phone: model.phone,
    name: model.name || null,
    countryCode: model.countryCode || null,
    email: model.email || null,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    isDeleted: model.isDeleted,
    deletedAt: model.deletedAt ?? undefined,
    deletedBy: model.deletedBy ?? undefined,
  };
}

@Injectable()
export class PrismaIdentityRepository implements IdentityRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(
    data: CreateIdentityInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Identity> {
    const client = (tx ?? this.prisma) as PrismaService;
    const created: IdentityModel = await client.identity.create({
      data: {
        phone: data.phone,
        name: data.name,
        countryCode: data.countryCode,
        email: data.email,
      },
      select: identitySelect,
    });
    return toDomain(created);
  }

  async update(
    id: string,
    data: UpdateIdentityInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Identity> {
    const client = (tx ?? this.prisma) as PrismaService;
    const existing = await client.identity.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw new NotFoundError('Identity', 'id', id);
    }
    const updated: IdentityModel = await client.identity.update({
      where: { isDeleted: false, id },
      data: {
        phone: data.phone,
        name: data.name,
        countryCode: data.countryCode,
        email: data.email,
      },
      select: identitySelect,
    });
    return toDomain(updated);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = (tx ?? this.prisma) as PrismaService;
    const existing = await client.identity.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw new NotFoundError('Identity', 'id', id);
    }
    await client.identity.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: null,
      },
    });
  }

  async findOne(
    where: Prisma.IdentityWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Identity | null> {
    const client = (tx ?? this.prisma) as PrismaService;
    const whereWithDeleted = {
      ...(where ?? {}),
      isDeleted: false,
    } as Prisma.IdentityWhereInput;
    const identity = await client.identity.findFirst({
      where: whereWithDeleted,
      select: identitySelect,
    });
    return identity ? toDomain(identity) : null;
  }

  async findAll(
    options?: Prisma.IdentityFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Identity[]> {
    const client = (tx ?? this.prisma) as PrismaService;
    const { where, select, ...rest } = (options ?? {}) as {
      where?: Prisma.IdentityWhereInput;
      select?: Prisma.IdentitySelect;
    };
    const args: Prisma.IdentityFindManyArgs = {
      ...(select ? { select } : { select: identitySelect }),
      where: { isDeleted: false, ...(where as object) },
      ...rest,
    };
    const identities = await client.identity.findMany(args);
    return identities.map(toDomain);
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Identity | null> {
    const client = (tx ?? this.prisma) as PrismaService;
    const identity = await client.identity.findUnique({
      where: { id, isDeleted: false },
      select: identitySelect,
    });
    return identity ? toDomain(identity) : null;
  }

  async count(
    where: Prisma.IdentityWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = (tx ?? this.prisma) as PrismaService;
    return client.identity.count({ where: { isDeleted: false, ...where } });
  }
}
