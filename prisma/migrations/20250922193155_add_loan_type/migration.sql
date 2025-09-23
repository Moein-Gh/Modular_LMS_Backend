-- CreateEnum
CREATE TYPE "public"."LoanStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'CLOSED', 'DEFAULTED');

-- AlterTable
ALTER TABLE "public"."bank" ALTER COLUMN "installmentOptions" SET DEFAULT ARRAY[5,10,12];

-- CreateTable
CREATE TABLE "public"."LoanType" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "commissionPercentage" DECIMAL(5,2) NOT NULL,
    "defaultInstallments" INTEGER NOT NULL DEFAULT 10,
    "maxInstallments" INTEGER NOT NULL DEFAULT 20,
    "minInstallments" INTEGER NOT NULL DEFAULT 5,
    "creditRequirementPct" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Loan" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "accountId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "loanTypeId" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "paymentMonths" INTEGER NOT NULL,
    "status" "public"."LoanStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoanType_name_key" ON "public"."LoanType"("name");

-- AddForeignKey
ALTER TABLE "public"."Loan" ADD CONSTRAINT "Loan_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loan" ADD CONSTRAINT "Loan_loanTypeId_fkey" FOREIGN KEY ("loanTypeId") REFERENCES "public"."LoanType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
