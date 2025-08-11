import type { DomainUser } from '../entities/user.entity';

export interface IUserRepository {
  createUser(params: { email: string }): Promise<DomainUser>;

  // Queries
  findByEmail(email: string): Promise<DomainUser | null>;
  findById(id: string): Promise<DomainUser | null>;

  // Basic status change
  setActive(userId: string, isActive: boolean): Promise<void>;
}
