import { Installment, InstallmentStatus } from '../entities/installment.entity';

export type CreateInstallmentInput = Pick<
  Installment,
  'loanId' | 'installmentNumber' | 'dueDate' | 'amount'
> & {
  status?: InstallmentStatus;
};

export type UpdateInstallmentInput = Partial<CreateInstallmentInput>;
