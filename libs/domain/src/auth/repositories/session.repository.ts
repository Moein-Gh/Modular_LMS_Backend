import type { DomainSession } from '../entities/session.entity';

export interface DomainSessionRepository {
  findById(id: string): Promise<DomainSession | null>;
  findByUserId(userId: string): Promise<DomainSession[]>;
  create(
    session: Omit<DomainSession, 'id' | 'createdAt'>,
  ): Promise<DomainSession>;
  revoke(sessionId: string): Promise<void>;
  replace(
    oldSessionId: string,
    newSession: Omit<DomainSession, 'id' | 'createdAt'>,
  ): Promise<DomainSession>;
}
