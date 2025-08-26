// AuthPayload: returned on successful login/refresh
export interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  userId: string;
}
