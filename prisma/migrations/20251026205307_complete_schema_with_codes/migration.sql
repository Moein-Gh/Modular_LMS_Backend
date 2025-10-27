-- CreateEnum
CREATE TYPE "public"."LoanStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'CLOSED', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "public"."InstallmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAID');

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
CREATE TYPE "public"."JournalTargetType" AS ENUM ('INSTALLMENT', 'LOAN', 'SUBSCRIPTION_FEE', 'ACCOUNT');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."TransactionKind" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'SUBSCRIPTION_PAYMENT', 'FEE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "code" SERIAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "identityId" UUID NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role" (
    "id" UUID NOT NULL,
    "code" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permission" (
    "id" UUID NOT NULL,
    "code" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoleAssignment" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permission_grant" (
    "id" UUID NOT NULL,
    "granteeType" TEXT NOT NULL,
    "granteeId" TEXT NOT NULL,
    "permissionId" UUID NOT NULL,
    "grantedBy" UUID,
    "isGranted" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."identity" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "country_code" TEXT,
    "national_code" TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refresh_token" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "replaced_by_token_id" UUID,
    "user_agent" TEXT,
    "ip_address" TEXT,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sms_code" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AccountType" (
    "id" UUID NOT NULL,
    "code" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "maxAccounts" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" UUID NOT NULL,
    "code" SERIAL NOT NULL,
    "accountTypeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bank" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "subscriptionFee" DECIMAL(18,4) NOT NULL,
    "commissionPercentage" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "defaultMaxInstallments" INTEGER NOT NULL DEFAULT 10,
    "installmentOptions" INTEGER[] DEFAULT ARRAY[5,10,12],
    "status" TEXT NOT NULL DEFAULT 'active',
    "currency" TEXT NOT NULL DEFAULT 'Toman',
    "timeZone" TEXT NOT NULL DEFAULT 'Asia/Tehran',
    "accountId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LoanType" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" SERIAL NOT NULL,
    "commissionPercentage" INTEGER NOT NULL DEFAULT 1,
    "defaultInstallments" INTEGER NOT NULL DEFAULT 10,
    "maxInstallments" INTEGER NOT NULL DEFAULT 20,
    "minInstallments" INTEGER NOT NULL DEFAULT 5,
    "creditRequirementPct" INTEGER NOT NULL DEFAULT 20,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Loan" (
    "id" UUID NOT NULL,
    "code" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "accountId" UUID NOT NULL,
    "loanTypeId" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "paymentMonths" INTEGER NOT NULL,
    "status" "public"."LoanStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Installment" (
    "id" UUID NOT NULL,
    "code" SERIAL NOT NULL,
    "loanId" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubscriptionFee" (
    "id" UUID NOT NULL,
    "code" SERIAL NOT NULL,
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
    "code" SERIAL NOT NULL,
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
    "code" SERIAL NOT NULL,
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
    "code" SERIAL NOT NULL,
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
    "code" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_code_key" ON "public"."User"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_identityId_key" ON "public"."User"("identityId");

-- CreateIndex
CREATE UNIQUE INDEX "role_code_key" ON "public"."role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "role_key_key" ON "public"."role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "permission_code_key" ON "public"."permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permission_key_key" ON "public"."permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "identity_phone_key" ON "public"."identity"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "identity_email_key" ON "public"."identity"("email");

-- CreateIndex
CREATE INDEX "refresh_token_user_idx" ON "public"."refresh_token"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_user_hash_unique" ON "public"."refresh_token"("user_id", "token_hash");

-- CreateIndex
CREATE INDEX "sms_code_phone_idx" ON "public"."sms_code"("phone");

-- CreateIndex
CREATE INDEX "sms_code_phone_code_idx" ON "public"."sms_code"("phone", "code");

-- CreateIndex
CREATE UNIQUE INDEX "AccountType_code_key" ON "public"."AccountType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AccountType_name_key" ON "public"."AccountType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Account_code_key" ON "public"."Account"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Account_cardNumber_key" ON "public"."Account"("cardNumber");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accountId_key" ON "public"."bank"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanType_name_key" ON "public"."LoanType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LoanType_code_key" ON "public"."LoanType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_code_key" ON "public"."Loan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Installment_code_key" ON "public"."Installment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionFee_code_key" ON "public"."SubscriptionFee"("code");

-- CreateIndex
CREATE INDEX "SubscriptionFee_status_periodStart_idx" ON "public"."SubscriptionFee"("status", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionFee_accountId_periodStart_key" ON "public"."SubscriptionFee"("accountId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_code_key" ON "public"."LedgerAccount"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Journal_code_key" ON "public"."Journal"("code");

-- CreateIndex
CREATE INDEX "Journal_transactionId_idx" ON "public"."Journal"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_code_key" ON "public"."JournalEntry"("code");

-- CreateIndex
CREATE INDEX "JournalEntry_journalId_idx" ON "public"."JournalEntry"("journalId");

-- CreateIndex
CREATE INDEX "JournalEntry_ledgerAccountId_idx" ON "public"."JournalEntry"("ledgerAccountId");

-- CreateIndex
CREATE INDEX "JournalEntry_targetType_targetId_idx" ON "public"."JournalEntry"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "JournalEntry_ledgerAccountId_createdAt_idx" ON "public"."JournalEntry"("ledgerAccountId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_code_key" ON "public"."Transaction"("code");

-- CreateIndex
CREATE INDEX "TransactionImage_transactionId_idx" ON "public"."TransactionImage"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionImage_fileId_idx" ON "public"."TransactionImage"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "File_code_key" ON "public"."File"("code");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "public"."identity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_accountTypeId_fkey" FOREIGN KEY ("accountTypeId") REFERENCES "public"."AccountType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bank" ADD CONSTRAINT "bank_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loan" ADD CONSTRAINT "Loan_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loan" ADD CONSTRAINT "Loan_loanTypeId_fkey" FOREIGN KEY ("loanTypeId") REFERENCES "public"."LoanType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Installment" ADD CONSTRAINT "Installment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "public"."Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
