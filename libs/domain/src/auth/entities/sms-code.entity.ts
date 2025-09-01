export interface SmsCode {
  id: string;
  phone: string;
  code: string;
  purpose: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  consumedAt?: Date;
  createdAt: Date;
}
