import type { Role } from '../entities/role.entity';
import { CreateRoleInput, UpdateRoleInput } from '../types/role.type';

export interface RoleRepository {
  findAll(options?: unknown, tx?: unknown): Promise<Role[]>;
  findById(id: string, tx?: unknown): Promise<Role | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(account: CreateRoleInput, tx?: unknown): Promise<Role>;
  update(id: string, account: UpdateRoleInput, tx?: unknown): Promise<Role>;
  delete(id: string, tx?: unknown): Promise<void>;
}

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
