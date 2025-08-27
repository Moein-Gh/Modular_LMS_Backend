export interface AccessTokenPayload {
  sub: string;
  phone?: string;
  exp: number; // seconds since epoch
}
