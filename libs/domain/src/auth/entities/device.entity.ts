export interface Device {
  id: string;
  deviceId: string;
  userId: string;
  deviceName?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  lastSeen: Date;
  createdAt: Date;
  revoked: boolean;

  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;

  ownerId?: string;
  createdBy?: string;
}
