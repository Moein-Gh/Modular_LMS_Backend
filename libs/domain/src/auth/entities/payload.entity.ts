export interface DomainPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  userId: string;
}
