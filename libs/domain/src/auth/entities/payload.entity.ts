export interface Payload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  userId: string;
  sessionId: string;
}
