// Value object for refresh token (opaque string)
export class RefreshToken {
  constructor(public readonly value: string) {
    if (!value || typeof value !== 'string') {
      throw new Error('Invalid refresh token');
    }
  }
  toString() {
    return this.value;
  }
}
