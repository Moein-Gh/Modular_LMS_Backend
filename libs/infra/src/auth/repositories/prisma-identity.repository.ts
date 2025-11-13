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
  nationalCode: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const identitySelect: Prisma.IdentitySelect = {
  id: true,
  phone: true,
  name: true,
  countryCode: true,
  nationalCode: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

function toDomain(model: IdentityModel): Identity {
  return {
    id: model.id,
    phone: model.phone,
    name: model.name || null,
    countryCode: model.countryCode || null,
    nationalCode: model.nationalCode || null,
    email: model.email || null,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
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
        nationalCode: data.nationalCode,
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
    const updated: IdentityModel = await client.identity.update({
      where: { id },
      data: {
        phone: data.phone,
        name: data.name,
        countryCode: data.countryCode,
        nationalCode: data.nationalCode,
        email: data.email,
      },
      select: identitySelect,
    });
    return toDomain(updated);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = (tx ?? this.prisma) as PrismaService;
    await client.identity.delete({ where: { id } });
  }

  async findOne(
    where: Prisma.IdentityWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Identity | null> {
    const client = (tx ?? this.prisma) as PrismaService;
    const identity = await client.identity.findFirst({
      where,
      select: identitySelect,
    });
    return identity ? toDomain(identity) : null;
  }

  async findAll(
    options?: Prisma.IdentityFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Identity[]> {
    const client = (tx ?? this.prisma) as PrismaService;
    const { where } = (options ?? {}) as { where?: Prisma.IdentityWhereInput };
    const identities = await client.identity.findMany({
      where,
      select: identitySelect,
    });
    return identities.map(toDomain);
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Identity | null> {
    const client = (tx ?? this.prisma) as PrismaService;
    const identity = await client.identity.findUnique({
      where: { id },
      select: identitySelect,
    });
    return identity ? toDomain(identity) : null;
  }

  async count(
    where: Prisma.IdentityWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = (tx ?? this.prisma) as PrismaService;
    return client.identity.count({ where });
  }
}
