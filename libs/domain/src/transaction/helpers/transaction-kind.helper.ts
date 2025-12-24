import { TransactionKind } from '../entities/transaction.entity';

export class TransactionKindHelper {
  private static readonly CASH_IN_KINDS: ReadonlySet<TransactionKind> = new Set(
    [TransactionKind.DEPOSIT],
  );

  static isCashIn(kind: TransactionKind): boolean {
    return this.CASH_IN_KINDS.has(kind);
  }

  static isCashOut(kind: TransactionKind): boolean {
    return !this.isCashIn(kind);
  }
}
