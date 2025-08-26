// AuthSession entity: represents a login session with access/refresh tokens
export interface AuthSession {
  id: string;
  userId: string;
  refreshTokenHash: string;
  revoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  replacedByTokenId?: string;
  userAgent?: string;
  ipAddress?: string;
}
