import * as crypto from 'crypto';

export class RefreshToken {
  constructor(
    public readonly value: string,
    public readonly hash: string,
    public readonly expiresAt: Date,
  ) {
    if (!value || typeof value !== 'string') {
      throw new Error('Invalid refresh token');
    }
  }

  static create(expiresInSec: number): RefreshToken {
    const value = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(value).digest('hex');
    return new RefreshToken(
      value,
      hash,
      new Date(Date.now() + expiresInSec * 1000),
    );
  }

  toString() {
    return this.value;
  }
}
