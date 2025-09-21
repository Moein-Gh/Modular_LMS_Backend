import type { Identity } from '../entities/identity.entity';
import {
  CreateIdentityInput,
  UpdateIdentityInput,
} from '../types/identity.type';

export interface IdentityRepository {
  findAll(options?: unknown, tx?: unknown): Promise<Identity[]>;
  findById(id: string, tx?: unknown): Promise<Identity | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(account: CreateIdentityInput, tx?: unknown): Promise<Identity>;
  update(
    id: string,
    account: UpdateIdentityInput,
    tx?: unknown,
  ): Promise<Identity>;
  delete(id: string, tx?: unknown): Promise<void>;
}

export const IDENTITY_REPOSITORY = Symbol('IDENTITY_REPOSITORY');
