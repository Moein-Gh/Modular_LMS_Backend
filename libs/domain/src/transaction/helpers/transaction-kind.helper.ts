import { TransactionKind } from '@app/domain';

export class TransactionKindHelper {
  private static readonly CASH_IN_KINDS: ReadonlySet<TransactionKind> = new Set(
    ['DEPOSIT', 'SUBSCRIPTION_PAYMENT', 'LOAN_REPAYMENT', 'FEE'],
  );

  static isCashIn(kind: TransactionKind): boolean {
    return this.CASH_IN_KINDS.has(kind);
  }

  static isCashOut(kind: TransactionKind): boolean {
    return !this.isCashIn(kind);
  }
}
