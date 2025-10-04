-- CreateEnum
CREATE TYPE "public"."SubscriptionFeeStatus" AS ENUM ('DUE', 'PAID', 'WAIVED');

-- CreateEnum
CREATE TYPE "public"."LedgerAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "public"."LedgerAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."JournalStatus" AS ENUM ('PENDING', 'POSTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "public"."DebitCredit" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "public"."JournalTargetType" AS ENUM ('INSTALLMENT', 'LOAN', 'SUBSCRIPTION_FEE', 'ACCOUNT', 'FEE', 'COMMISSION', 'ADJUSTMENT', 'REFUND', 'REVERSAL');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."TransactionKind" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'SUBSCRIPTION_PAYMENT', 'FEE');

-- AlterTable
ALTER TABLE "public"."bank" ALTER COLUMN "installmentOptions" SET DEFAULT ARRAY[5,10,12];

-- CreateTable
CREATE TABLE "public"."SubscriptionFee" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "status" "public"."SubscriptionFeeStatus" NOT NULL DEFAULT 'DUE',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "waivedAt" TIMESTAMP(3),
    "waiverReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LedgerAccount" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."LedgerAccountType" NOT NULL,
    "status" "public"."LedgerAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Journal" (
    "id" UUID NOT NULL,
    "transactionId" UUID,
    "note" TEXT,
    "status" "public"."JournalStatus" NOT NULL DEFAULT 'PENDING',
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JournalEntry" (
    "id" UUID NOT NULL,
    "journalId" UUID NOT NULL,
    "ledgerAccountId" UUID NOT NULL,
    "dc" "public"."DebitCredit" NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "targetType" "public"."JournalTargetType",
    "targetId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" UUID NOT NULL,
    "kind" "public"."TransactionKind" NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "externalRef" TEXT,
    "note" TEXT,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TransactionImage" (
    "id" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."File" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionFee_status_periodStart_idx" ON "public"."SubscriptionFee"("status", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionFee_accountId_periodStart_key" ON "public"."SubscriptionFee"("accountId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_code_key" ON "public"."LedgerAccount"("code");

-- CreateIndex
CREATE INDEX "Journal_transactionId_idx" ON "public"."Journal"("transactionId");

-- CreateIndex
CREATE INDEX "JournalEntry_journalId_idx" ON "public"."JournalEntry"("journalId");

-- CreateIndex
CREATE INDEX "JournalEntry_ledgerAccountId_idx" ON "public"."JournalEntry"("ledgerAccountId");

-- CreateIndex
CREATE INDEX "JournalEntry_targetType_targetId_idx" ON "public"."JournalEntry"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "JournalEntry_ledgerAccountId_createdAt_idx" ON "public"."JournalEntry"("ledgerAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "TransactionImage_transactionId_idx" ON "public"."TransactionImage"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionImage_fileId_idx" ON "public"."TransactionImage"("fileId");

-- AddForeignKey
ALTER TABLE "public"."SubscriptionFee" ADD CONSTRAINT "SubscriptionFee_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Journal" ADD CONSTRAINT "Journal_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JournalEntry" ADD CONSTRAINT "JournalEntry_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "public"."Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JournalEntry" ADD CONSTRAINT "JournalEntry_ledgerAccountId_fkey" FOREIGN KEY ("ledgerAccountId") REFERENCES "public"."LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransactionImage" ADD CONSTRAINT "TransactionImage_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransactionImage" ADD CONSTRAINT "TransactionImage_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
