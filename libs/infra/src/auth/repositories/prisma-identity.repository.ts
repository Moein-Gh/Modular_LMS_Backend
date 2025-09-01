import { Identity, IdentityRepository } from '@app/domain';
import { CreateIdentityInput } from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import { Prisma } from '@generated/prisma';
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

  async create(data: CreateIdentityInput): Promise<Identity> {
    const created: IdentityModel = await this.prisma.identity.create({
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
  async update(id: string, data: CreateIdentityInput): Promise<Identity> {
    const updated: IdentityModel = await this.prisma.identity.update({
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

  async delete(id: string): Promise<void> {
    await this.prisma.identity.delete({
      where: { id },
    });
  }

  async findOne(where: Prisma.IdentityWhereInput): Promise<Identity | null> {
    const identity = await this.prisma.identity.findFirst({
      where,
      select: identitySelect,
    });
    return identity ? toDomain(identity) : null;
  }
}
