import type { DomainRole } from '../entities/role.entity';

export interface CreateRoleInput {
  key: string;
  name: string;
  description?: string;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
}

export interface ListRolesParams {
  search?: string;
  skip?: number;
  take?: number;
  orderBy?: 'createdAt' | 'name' | 'key';
  orderDir?: 'asc' | 'desc';
}

export interface ListRolesResult {
  items: DomainRole[];
  total: number;
}

export interface RoleRepository {
  findById(id: string): Promise<DomainRole | null>;
  findByKey(key: string): Promise<DomainRole | null>;
  list(params: ListRolesParams): Promise<ListRolesResult>;
  create(data: CreateRoleInput): Promise<DomainRole>;
  update(id: string, data: UpdateRoleInput): Promise<DomainRole>;
  delete(id: string): Promise<void>;
}

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
