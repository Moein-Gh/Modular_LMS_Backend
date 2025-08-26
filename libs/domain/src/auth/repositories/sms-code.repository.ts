import { DomainSmsCode } from '../entities/sms-code.entity';

export interface SmsCodeRepository {
  findActive(phone: string, purpose: string): Promise<DomainSmsCode | null>;
  create(
    code: Omit<DomainSmsCode, 'id' | 'createdAt' | 'consumedAt'>,
  ): Promise<DomainSmsCode>;
  consume(id: string): Promise<void>;
  incrementAttempts(id: string): Promise<void>;
}
