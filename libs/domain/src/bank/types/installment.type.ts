import { BaseQueryParams } from '@app/domain/common';
import { Installment, InstallmentStatus } from '../entities/installment.entity';

export type CreateInstallmentInput = Pick<
  Installment,
  'loanId' | 'installmentNumber' | 'dueDate' | 'amount'
> & {
  status?: InstallmentStatus;
};

export type UpdateInstallmentInput = Partial<
  Pick<Installment, 'status' | 'journalEntryId'>
> & {
  paymentDate?: Date | string;
};

export type ListInstallmentQueryInput = BaseQueryParams & {
  loanId?: string;
  status?: InstallmentStatus;
};
