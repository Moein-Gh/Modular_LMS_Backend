import type { Session } from '../entities/session.entity';

export interface DomainSessionRepository {
  findById(id: string): Promise<Session | null>;
  findByUserId(userId: string): Promise<Session[]>;
  create(session: Omit<Session, 'id' | 'createdAt'>): Promise<Session>;
  revoke(sessionId: string): Promise<void>;
  replace(
    oldSessionId: string,
    newSession: Omit<Session, 'id' | 'createdAt'>,
  ): Promise<Session>;
}
