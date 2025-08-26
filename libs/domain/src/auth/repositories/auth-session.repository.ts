import type { AuthSession } from '../entities/auth-session.entity';

export interface AuthSessionRepository {
  findById(id: string): Promise<AuthSession | null>;
  findByUserId(userId: string): Promise<AuthSession[]>;
  create(session: Omit<AuthSession, 'id' | 'createdAt'>): Promise<AuthSession>;
  revoke(sessionId: string): Promise<void>;
  replace(
    oldSessionId: string,
    newSession: Omit<AuthSession, 'id' | 'createdAt'>,
  ): Promise<AuthSession>;
}
