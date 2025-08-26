import * as crypto from 'crypto';

export class AccessToken {
  constructor(
    public readonly value: string,
    public readonly expiresAt: Date,
  ) {
    if (!value || typeof value !== 'string') {
      throw new Error('Invalid access token');
    }
  }

  static create(
    payload: object,
    secret: string,
    expiresInSec: number,
  ): AccessToken {
    // This is a stub. Use @nestjs/jwt or jsonwebtoken in production.
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({
        ...payload,
        exp: Math.floor(Date.now() / 1000) + expiresInSec,
      }),
    ).toString('base64url');
    const sig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');
    const token = `${header}.${body}.${sig}`;
    return new AccessToken(token, new Date(Date.now() + expiresInSec * 1000));
  }

  toString() {
    return this.value;
  }
}
