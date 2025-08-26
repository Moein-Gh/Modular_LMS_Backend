import type { SmsCode } from '../entities/sms-code.entity';

export interface SmsCodeRepository {
  findActive(phone: string, purpose: string): Promise<SmsCode | null>;
  create(
    code: Omit<SmsCode, 'id' | 'createdAt' | 'consumedAt'>,
  ): Promise<SmsCode>;
  consume(id: string): Promise<void>;
  incrementAttempts(id: string): Promise<void>;
}
