import type { DomainUser } from '../entities/user.entity';

export interface IUserRepository {
  createUser(): Promise<DomainUser>;
  findById(id: string): Promise<DomainUser | null>;
  setActive(userId: string, isActive: boolean): Promise<void>;
}
