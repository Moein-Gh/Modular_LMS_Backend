import { NotFoundError, PaginationQueryDto } from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import {
  InstallmentStatus,
  LoanStatus,
  LoanType,
  type CreateLoanInput,
  type Loan,
  type UpdateLoanInput,
} from '@app/domain';
import {
  PrismaAccountRepository,
  PrismaInstallmentRepository,
  PrismaLoanRepository,
  PrismaLoanTypeRepository,
} from '@app/infra';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { BankFinancialsService } from './bank-financials.service';

@Injectable()
export class LoansService {
  constructor(
    private readonly loansRepo: PrismaLoanRepository,
    private readonly loanTypeRepo: PrismaLoanTypeRepository,
    private readonly accountRepo: PrismaAccountRepository,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
    private readonly installmentRepo: PrismaInstallmentRepository,
    private readonly bankFinancialsService: BankFinancialsService,
  ) {}

  async findAll(query?: PaginationQueryDto, tx?: Prisma.TransactionClient) {
    return paginatePrisma<Loan, Prisma.LoanFindManyArgs, Prisma.LoanWhereInput>(
      {
        repo: this.loansRepo,
        query: query ?? new PaginationQueryDto(),
        searchFields: ['name'],
        defaultOrderBy: 'createdAt',
        defaultOrderDir: 'desc',
        tx,
      },
    );
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<Loan> {
    const loan = await this.loansRepo.findById(id, tx);
    if (!loan) {
      throw new NotFoundError('Loan', 'id', id);
    }
    return loan;
  }

  async create(
    input: CreateLoanInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Loan> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      // Validate loan type ID
      const loanType = await this.validateLoanTypeId(input.loanTypeId, DBtx);
      // validate loan amount against loan type limits
      this.validateLoanLimits(input, loanType);
      // validate bank financials
      await this.checkBankFinancialsForNewLoan(input, DBtx);
      // validate account Id
      await this.validateAccountId(input.accountId, DBtx);
      // does this account have an active loan already?
      await this.checkLoanConflict(input.accountId, DBtx);
      // create the loan
      const loan = await this.loansRepo.create(input, DBtx);
      // create installments for loan
      await this.createInstallmentsForLoan(loan, DBtx);
      return loan;
    };

    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }

  async update(
    id: string,
    loan: UpdateLoanInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Loan> {
    const exists = await this.loansRepo.findById(id, tx);
    if (!exists) {
      throw new NotFoundError('Loan', 'id', id);
    }
    try {
      return await this.loansRepo.update(id, loan, tx);
    } catch (e) {
      if (this.isPrismaNotFoundError(e)) {
        throw new NotFoundError('Loan', 'id', id);
      }
      throw e;
    }
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const exists = await this.loansRepo.findById(id, tx);
    if (!exists) {
      throw new NotFoundError('Loan', 'id', id);
    }
    try {
      await this.loansRepo.delete(id, tx);
    } catch (e) {
      if (this.isPrismaNotFoundError(e)) {
        throw new NotFoundError('Loan', 'id', id);
      }
      throw e;
    }
  }

  // Narrowly detect Prisma's "Record not found" without importing Prisma types
  private isPrismaNotFoundError(e: unknown): boolean {
    const code = (e as { code?: unknown })?.code;
    return code === 'P2025';
  }

  private async validateLoanTypeId(
    loanTypeId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const loanType = await this.loanTypeRepo.findById(loanTypeId, tx);
    if (!loanType) {
      throw new NotFoundError('LoanType', 'id', loanTypeId);
    }
    return loanType;
  }

  private async validateAccountId(
    accountId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const account = await this.accountRepo.findById(accountId, tx);
    if (!account) {
      throw new NotFoundError('Account', 'id', accountId);
    }
    return account;
  }

  private async checkLoanConflict(
    accountId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const existingLoans = await this.loansRepo.findAll(
      {
        where: {
          accountId,
          status: LoanStatus.ACTIVE,
        },
      },
      tx,
    );
    if (existingLoans.length > 0) {
      throw new ConflictException(
        `Account with id '${accountId}' already has an active loan.`,
      );
    }
  }

  private async createInstallmentsForLoan(
    loan: Loan,
    tx?: Prisma.TransactionClient,
  ) {
    const installmentCount = loan.paymentMonths;
    const installmentAmount = (
      BigInt(loan.amount) / BigInt(installmentCount)
    ).toString();

    for (let i = 0; i < installmentCount; i++) {
      const startDate = new Date(loan.startDate);
      const dayOfMonth = startDate.getDate();

      // If start date is after 15th, skip to next month
      const monthsToAdd = dayOfMonth > 15 ? i + 2 : i + 1;

      const dueDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + monthsToAdd,
        1,
      );

      await this.installmentRepo.create(
        {
          loanId: loan.id,
          amount: installmentAmount,
          installmentNumber: i + 1,
          dueDate,
          status: InstallmentStatus.PENDING,
        },
        tx,
      );
    }
  }

  private validateLoanLimits(input: CreateLoanInput, loanType: LoanType) {
    const { paymentMonths } = input;
    const { minInstallments, maxInstallments } = loanType;
    if (paymentMonths < minInstallments || paymentMonths > maxInstallments) {
      throw new BadRequestException(
        `Loan payment months must be between ${minInstallments} and ${maxInstallments}.`,
      );
    }
  }

  private async checkBankFinancialsForNewLoan(
    input: CreateLoanInput,
    tx?: Prisma.TransactionClient,
  ) {
    const canApprove = await this.bankFinancialsService.canApproveLoan(
      input.amount,
      tx,
    );
    if (!canApprove) {
      throw new BadRequestException(
        'Bank has insufficient funds to approve this loan.',
      );
    }
  }
}
