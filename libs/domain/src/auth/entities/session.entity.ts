export interface DomainSession {
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
