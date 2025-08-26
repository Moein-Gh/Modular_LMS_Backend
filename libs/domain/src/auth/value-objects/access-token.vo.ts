// Value object for access token (JWT or opaque string)
export class AccessToken {
  constructor(public readonly value: string) {
    if (!value || typeof value !== 'string') {
      throw new Error('Invalid access token');
    }
  }
  toString() {
    return this.value;
  }
}
