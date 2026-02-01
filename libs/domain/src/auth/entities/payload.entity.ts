import { User } from '../../user/entities/user.entity';

export interface Payload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  userId: string;
  user: User;
  sessionId: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  hasUnreadPushNotifications?: boolean;
}
